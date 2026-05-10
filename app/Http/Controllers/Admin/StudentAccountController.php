<?php

namespace App\Http\Controllers\Admin;

use App\Enums\StudentAccountStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\EmailAllStudentCredentialsRequest;
use App\Http\Requests\EmailStudentCredentialsRequest;
use App\Http\Requests\ImportStudentsExcelRequest;
use App\Http\Requests\StoreStudentAccountRequest;
use App\Mail\StudentLoginCredentialsMail;
use App\Models\Course;
use App\Models\StudentImportBatch;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\RichText\RichText;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

class StudentAccountController extends Controller
{
    /**
     * Student accounts and profiles — administrators create approved accounts here; students may also self-register pending approval.
     */
    public function index(): Response
    {
        $courses = Course::query()
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(fn (Course $course): array => [
                'id' => $course->id,
                'code' => $course->code,
                'name' => $course->name,
            ]);

        return Inertia::render('admin/students/index', [
            'breadcrumbs' => [
                ['title' => 'Admin', 'href' => route('admin.dashboard')],
                ['title' => 'Students', 'href' => route('admin.students.index')],
            ],
            'courses' => $courses,
        ]);
    }

    /**
     * Student accounts listed by program (course), plus users missing a program assignment.
     */
    public function accounts(): Response
    {
        $studentUsers = User::query()
            ->where('role', UserRole::Student)
            ->where(function ($query): void {
                $query
                    ->whereNull('student_account_status')
                    ->orWhere('student_account_status', StudentAccountStatus::Active);
            })
            ->with(['studentProfile.course'])
            ->orderBy('name')
            ->get();

        $mapRow = fn (User $user): array => [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'student_id' => $user->studentProfile?->student_id,
            'section' => $user->studentProfile?->section,
            'year_level' => $user->studentProfile?->year_level,
            'registered_at' => $user->created_at?->format('M j, Y'),
        ];

        $courseGroups = Course::query()
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(function (Course $course) use ($studentUsers, $mapRow): array {
                $students = $studentUsers
                    ->filter(
                        fn (User $user): bool => (int) ($user->studentProfile?->course_id) === $course->id
                    )
                    ->values()
                    ->map($mapRow)
                    ->all();

                return [
                    'course' => [
                        'id' => $course->id,
                        'code' => $course->code,
                        'name' => $course->name,
                    ],
                    'students' => $students,
                    'count' => count($students),
                ];
            })
            ->values()
            ->all();

        $unassignedStudents = $studentUsers
            ->filter(
                fn (User $user): bool => $user->studentProfile === null
                    || $user->studentProfile->course_id === null
            )
            ->values()
            ->map($mapRow)
            ->all();

        $disabledStudentUsers = User::query()
            ->where('role', UserRole::Student)
            ->where('student_account_status', StudentAccountStatus::Disabled)
            ->with(['studentProfile.course'])
            ->orderBy('name')
            ->get();

        $disabledStudents = $disabledStudentUsers->values()->map($mapRow)->all();

        return Inertia::render('admin/students/accounts', [
            'breadcrumbs' => [
                ['title' => 'Admin', 'href' => route('admin.dashboard')],
                ['title' => 'Students', 'href' => route('admin.students.index')],
                ['title' => 'By program', 'href' => route('admin.students.accounts')],
            ],
            'courseGroups' => $courseGroups,
            'unassignedStudents' => $unassignedStudents,
            'disabledStudents' => $disabledStudents,
            'totalStudents' => $studentUsers->count(),
        ]);
    }

    /**
     * Block sign-in and student access for an active student account.
     */
    public function disableStudentAccount(User $user): RedirectResponse
    {
        abort_unless($user->role === UserRole::Student, 404);

        if (! in_array($user->student_account_status, [null, StudentAccountStatus::Active], true)) {
            abort(404);
        }

        $user->forceFill([
            'student_account_status' => StudentAccountStatus::Disabled,
        ])->save();

        return redirect()->route('admin.students.accounts')->with(
            'success',
            'The student account for '.$user->email.' has been disabled.',
        );
    }

    /**
     * Restore a disabled student account to active status.
     */
    public function enableStudentAccount(User $user): RedirectResponse
    {
        abort_unless($user->role === UserRole::Student, 404);
        abort_unless($user->student_account_status === StudentAccountStatus::Disabled, 404);

        $user->forceFill([
            'student_account_status' => StudentAccountStatus::Active,
        ])->save();

        return redirect()->route('admin.students.accounts')->with(
            'success',
            'The student account for '.$user->email.' has been enabled.',
        );
    }

    /**
     * Store a new student user and linked profile (single-database school deployment).
     */
    public function store(StoreStudentAccountRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $plainPassword = Str::password(16);
        $loginUrl = route('login', [], true);

        $user = DB::transaction(function () use ($data, $plainPassword): User {
            $created = User::query()->create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => $plainPassword,
                'role' => UserRole::Student,
                'student_account_status' => StudentAccountStatus::Active,
                'email_verified_at' => now(),
            ]);

            StudentProfile::query()->create([
                'user_id' => $created->id,
                'student_id' => $data['student_id'],
                'course_id' => $data['course_id'],
                'section' => $data['section'] ?? null,
                'year_level' => $data['year_level'] ?? null,
            ]);

            return $created;
        });

        try {
            Mail::to($user)->send(new StudentLoginCredentialsMail($user, $plainPassword, $loginUrl));
        } catch (\Throwable $e) {
            report($e);

            DB::transaction(function () use ($user): void {
                StudentProfile::query()->where('user_id', $user->id)->delete();
                $user->delete();
            });

            return redirect()->route('admin.students.index')->withErrors([
                'mail' => 'Could not send email (SMTP rejected credentials or blocked sending). Fix MAIL_* in .env — use a fresh Gmail App Password (16 letters, no spaces), run php artisan config:clear, then try again. No student account was saved.',
            ]);
        }

        return redirect()->route('admin.students.index')->with(
            'success',
            'Student account created. Login details were emailed to '.$user->email.'.',
        );
    }

    /**
     * Generate a new password for every student and email credentials to their address.
     */
    public function emailCredentialsToAll(EmailAllStudentCredentialsRequest $request): RedirectResponse
    {
        $students = User::query()
            ->where('role', UserRole::Student)
            ->where(function ($query): void {
                $query
                    ->whereNull('student_account_status')
                    ->orWhere('student_account_status', StudentAccountStatus::Active);
            })
            ->orderBy('id')
            ->get();

        if ($students->isEmpty()) {
            return redirect()->route('admin.students.accounts')->with('success', 'No student accounts to email.');
        }

        $preflight = $this->preflightSmtp($request);
        if ($preflight !== null) {
            return $preflight;
        }

        $loginUrl = route('login', [], true);

        foreach ($students as $user) {
            $plainPassword = Str::password(16);
            $user->forceFill(['password' => $plainPassword])->save();

            Mail::to($user)->send(new StudentLoginCredentialsMail($user, $plainPassword, $loginUrl));
        }

        return redirect()->route('admin.students.accounts')->with(
            'success',
            'New passwords were generated and emailed to '.$students->count().' student account(s).',
        );
    }

    /**
     * Generate a new password for one student and email credentials to their address.
     */
    public function emailStudentCredentials(EmailStudentCredentialsRequest $request, User $user): RedirectResponse
    {
        if ($user->role !== UserRole::Student) {
            abort(403);
        }

        abort_if($user->student_account_status === StudentAccountStatus::Disabled, 403);

        $previousHash = $user->password;
        $plainPassword = Str::password(16);
        $loginUrl = route('login', [], true);

        $user->forceFill(['password' => $plainPassword])->save();

        try {
            Mail::to($user)->send(new StudentLoginCredentialsMail($user, $plainPassword, $loginUrl));
        } catch (\Throwable $e) {
            report($e);

            $user->forceFill(['password' => $previousHash])->save();

            return redirect()->route('admin.students.accounts')->withErrors([
                'mail' => 'Could not send email to '.$user->email.'. Their password was not changed.',
            ]);
        }

        return redirect()->route('admin.students.accounts')->with(
            'success',
            'Login details were emailed to '.$user->email.'.',
        );
    }

    /**
     * Excel template for bulk student registration (filled out and re-uploaded by admin).
     *
     * Columns: name, email, student_id, course_code (must match Programs), optional section & year_level.
     */
    public function downloadTemplate(): StreamedResponse
    {
        $spreadsheet = new Spreadsheet;
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->fromArray([
            ['name', 'email', 'student_id', 'course_code', 'section', 'year_level'],
            [
                'Example Student',
                'student.email@school.edu',
                '2024-00001',
                'BSIT',
                'A',
                '4',
            ],
        ], null, 'A1');

        return response()->streamDownload(function () use ($spreadsheet): void {
            $writer = new Xlsx($spreadsheet);
            $writer->save('php://output');
        }, 'eduvote-student-import-template.xlsx', [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    /**
     * Create student accounts from an uploaded Excel workbook (same columns as the downloadable template).
     */
    public function importStudents(ImportStudentsExcelRequest $request): RedirectResponse
    {
        $uploaded = $request->file('excel');
        $warnings = [];
        $imported = 0;
        $loginUrl = route('login', [], true);
        $filename = $uploaded->getClientOriginalName();

        try {
            $spreadsheet = IOFactory::load($uploaded->getRealPath());
        } catch (\Throwable $e) {
            report($e);

            return redirect()->route('admin.students.index')->withErrors([
                'excel' => 'Could not read the Excel file. Download the template and save as .xlsx.',
            ]);
        }

        $sheet = $spreadsheet->getActiveSheet();
        $highestRow = (int) $sheet->getHighestDataRow();

        if ($highestRow < 1) {
            return redirect()->route('admin.students.index')->withErrors([
                'excel' => 'The spreadsheet is empty.',
            ]);
        }

        $lastHeaderColumn = $sheet->getHighestDataColumn(1);
        $headerRow = $sheet->rangeToArray('A1:'.$lastHeaderColumn.'1', null, true, false)[0] ?? [];

        $columnIndexByKey = $this->mapImportHeaderColumns($headerRow);
        foreach (['name', 'email', 'student_id', 'course_code'] as $required) {
            if (! array_key_exists($required, $columnIndexByKey)) {
                return redirect()->route('admin.students.index')->withErrors([
                    'excel' => 'The first row must include a "'.$required.'" column.',
                ]);
            }
        }

        $colCount = count($headerRow);

        /** @var Collection<string, Course> $coursesByUpperCode */
        $coursesByUpperCode = Course::query()
            ->get(['id', 'code'])
            ->keyBy(fn (Course $course): string => strtoupper(trim($course->code)));

        $seenEmails = [];
        $seenStudentIds = [];

        for ($rowNumber = 2; $rowNumber <= $highestRow; $rowNumber++) {
            $row = [];
            for ($c = 0; $c < $colCount; $c++) {
                $letter = Coordinate::stringFromColumnIndex($c + 1);
                $cell = $sheet->getCell($letter.$rowNumber);
                $row[$c] = $this->importValueToString($cell->getValue());
            }

            if ($this->importRowIsBlank($row)) {
                continue;
            }

            $name = $row[$columnIndexByKey['name']] ?? '';
            $email = $row[$columnIndexByKey['email']] ?? '';
            $studentId = $row[$columnIndexByKey['student_id']] ?? '';
            $courseCode = $row[$columnIndexByKey['course_code']] ?? '';
            $section = array_key_exists('section', $columnIndexByKey)
                ? ($row[$columnIndexByKey['section']] ?? '')
                : '';
            $yearLevel = array_key_exists('year_level', $columnIndexByKey)
                ? ($row[$columnIndexByKey['year_level']] ?? '')
                : '';

            if ($this->isTemplateExampleRow($name, $email)) {
                continue;
            }

            $emailKey = strtolower($email);

            if ($emailKey !== '' && isset($seenEmails[$emailKey])) {
                $warnings[] = "Row {$rowNumber}: duplicate email in file ({$email}).";

                continue;
            }

            if ($studentId !== '' && isset($seenStudentIds[$studentId])) {
                $warnings[] = "Row {$rowNumber}: duplicate student ID in file ({$studentId}).";

                continue;
            }

            $course = $coursesByUpperCode->get(strtoupper($courseCode));
            if ($course === null) {
                $warnings[] = "Row {$rowNumber}: unknown program code \"{$courseCode}\".";

                continue;
            }

            $validator = Validator::make([
                'name' => $name,
                'email' => $email,
                'student_id' => $studentId,
                'section' => $section === '' ? null : $section,
                'year_level' => $yearLevel === '' ? null : $yearLevel,
            ], [
                'name' => ['required', 'string', 'max:255'],
                'email' => ['required', 'string', 'email', 'max:255', Rule::unique(User::class)],
                'student_id' => ['required', 'string', 'max:255', Rule::unique('student_profiles', 'student_id')],
                'section' => ['nullable', 'string', 'max:255'],
                'year_level' => ['nullable', 'string', 'max:255'],
            ], [], [
                'student_id' => 'student ID',
            ]);

            if ($validator->fails()) {
                $warnings[] = "Row {$rowNumber}: ".$validator->errors()->first();

                continue;
            }

            $data = $validator->validated();
            $plainPassword = Str::password(16);

            try {
                $user = DB::transaction(function () use ($data, $plainPassword, $course): User {
                    $created = User::query()->create([
                        'name' => $data['name'],
                        'email' => $data['email'],
                        'password' => $plainPassword,
                        'role' => UserRole::Student,
                        'student_account_status' => StudentAccountStatus::Active,
                        'email_verified_at' => now(),
                    ]);

                    StudentProfile::query()->create([
                        'user_id' => $created->id,
                        'student_id' => $data['student_id'],
                        'course_id' => $course->id,
                        'section' => $data['section'] ?? null,
                        'year_level' => $data['year_level'] ?? null,
                    ]);

                    return $created;
                });
            } catch (\Throwable $e) {
                report($e);
                $warnings[] = "Row {$rowNumber}: could not save this row.";

                continue;
            }

            try {
                Mail::to($user)->send(new StudentLoginCredentialsMail($user, $plainPassword, $loginUrl));
            } catch (\Throwable $e) {
                report($e);

                DB::transaction(function () use ($user): void {
                    StudentProfile::query()->where('user_id', $user->id)->delete();
                    $user->delete();
                });

                $warnings[] = "Row {$rowNumber}: email could not be sent for {$data['email']} — row skipped.";

                continue;
            }

            if ($emailKey !== '') {
                $seenEmails[$emailKey] = true;
            }

            if ($studentId !== '') {
                $seenStudentIds[$studentId] = true;
            }

            $imported++;
        }

        if ($imported > 0) {
            StudentImportBatch::query()->create([
                'user_id' => $request->user()->id,
                'filename' => $filename,
                'row_count' => $imported,
            ]);
        }

        $success = $imported === 0
            ? 'No student accounts were imported.'
            : "Imported {$imported} student account(s). Open View by program to see them grouped.";

        return redirect()
            ->route('admin.students.index')
            ->with('success', $success)
            ->with('import_warnings', $warnings);
    }

    /**
     * Send a tiny message so SMTP auth runs before any bulk password resets.
     *
     * @return RedirectResponse|null Returns a redirect if SMTP is not usable.
     */
    private function preflightSmtp(Request $request): ?RedirectResponse
    {
        try {
            Mail::raw('EduVote mail delivery check.', function ($message) use ($request): void {
                $message
                    ->from(config('mail.from.address'), (string) config('mail.from.name'))
                    ->to($request->user()->email)
                    ->subject('EduVote mail delivery check');
            });
        } catch (\Throwable $e) {
            report($e);

            return redirect()->route('admin.students.accounts')->withErrors([
                'mail' => 'Gmail rejected the sign-in (535) or SMTP failed. Use Google Account → Security → App passwords, create a new 16-character password for “Mail”, put it in MAIL_PASSWORD with no spaces, set MAIL_PORT=465 or 587, run php artisan config:clear, then try again.',
            ]);
        }

        return null;
    }

    /**
     * @param  array<int, mixed>  $headerRow
     * @return array<string, int>
     */
    private function mapImportHeaderColumns(array $headerRow): array
    {
        $map = [];
        foreach ($headerRow as $index => $label) {
            $key = strtolower(trim((string) $label));
            if ($key !== '') {
                $map[$key] = (int) $index;
            }
        }

        return $map;
    }

    /**
     * @param  array<int, string>  $row
     */
    private function importRowIsBlank(array $row): bool
    {
        foreach ($row as $cell) {
            if ($cell !== '') {
                return false;
            }
        }

        return true;
    }

    private function isTemplateExampleRow(string $name, string $email): bool
    {
        return strcasecmp($name, 'Example Student') === 0
            && strcasecmp($email, 'student.email@school.edu') === 0;
    }

    private function importValueToString(mixed $value): string
    {
        if ($value === null) {
            return '';
        }

        if ($value instanceof RichText) {
            return trim($value->getPlainText());
        }

        if (is_int($value)) {
            return (string) $value;
        }

        if (is_float($value)) {
            if (fmod($value, 1.0) === 0.0 && abs($value) < 1e15) {
                return (string) (int) $value;
            }

            return trim(rtrim(sprintf('%.12F', $value), '0'), '.');
        }

        return trim((string) $value);
    }
}
