<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\ImportSchoolRosterExcelRequest;
use App\Models\SchoolRosterEntry;
use App\Support\AdminPendingRegistrations;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\RichText\RichText;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SchoolRosterController extends Controller
{
    /**
     * Pending self-registrations and approval actions (default school roster view).
     */
    public function index(): Response
    {
        return Inertia::render('admin/roster/index', [
            'breadcrumbs' => [
                ['title' => 'Admin', 'href' => route('admin.dashboard')],
                ['title' => 'School roster', 'href' => route('admin.roster.index')],
            ],
            'pendingRegistrations' => AdminPendingRegistrations::rows(),
        ]);
    }

    /**
     * Official roster rows: import Excel and maintain entries.
     */
    public function masterList(): Response
    {
        return Inertia::render('admin/roster/master-list', [
            'breadcrumbs' => [
                ['title' => 'Admin', 'href' => route('admin.dashboard')],
                ['title' => 'School roster', 'href' => route('admin.roster.index')],
                ['title' => 'Master list', 'href' => route('admin.roster.master-list')],
            ],
            'entries' => $this->rosterEntryRows(),
        ]);
    }

    /**
     * @return list<array{id: int, student_id: string, email: string|null, full_name: string|null}>
     */
    private function rosterEntryRows(): array
    {
        return SchoolRosterEntry::query()
            ->orderBy('student_id')
            ->get()
            ->map(fn (SchoolRosterEntry $entry): array => [
                'id' => $entry->id,
                'student_id' => $entry->student_id,
                'email' => $entry->email,
                'full_name' => $entry->full_name,
            ])
            ->values()
            ->all();
    }

    /**
     * Excel template: student_id, email (optional), full_name (optional).
     */
    public function downloadTemplate(): StreamedResponse
    {
        $spreadsheet = new Spreadsheet;
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->fromArray([
            ['student_id', 'email', 'full_name'],
            ['ROSTER-EXAMPLE', 'registrar@school.edu', 'Official roster example'],
        ], null, 'A1');

        return response()->streamDownload(function () use ($spreadsheet): void {
            $writer = new Xlsx($spreadsheet);
            $writer->save('php://output');
        }, 'eduvote-school-roster-template.xlsx', [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    public function import(ImportSchoolRosterExcelRequest $request): RedirectResponse
    {
        $uploaded = $request->file('excel');
        $imported = 0;
        $skipped = 0;

        try {
            $spreadsheet = IOFactory::load($uploaded->getRealPath());
        } catch (\Throwable $e) {
            report($e);

            return redirect()->route('admin.roster.master-list')->withErrors([
                'excel' => 'Could not read the Excel file. Use the template and save as .xlsx.',
            ]);
        }

        $sheet = $spreadsheet->getActiveSheet();
        $highestRow = (int) $sheet->getHighestDataRow();

        if ($highestRow < 1) {
            return redirect()->route('admin.roster.master-list')->withErrors([
                'excel' => 'The spreadsheet is empty.',
            ]);
        }

        $lastHeaderColumn = $sheet->getHighestDataColumn(1);
        $headerRow = $sheet->rangeToArray('A1:'.$lastHeaderColumn.'1', null, true, false)[0] ?? [];
        $columnIndexByKey = $this->mapImportHeaderColumns($headerRow);

        if (! array_key_exists('student_id', $columnIndexByKey)) {
            return redirect()->route('admin.roster.master-list')->withErrors([
                'excel' => 'The first row must include a "student_id" column.',
            ]);
        }

        $colCount = count($headerRow);

        DB::transaction(function () use ($sheet, $highestRow, $colCount, $columnIndexByKey, &$imported, &$skipped): void {
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

                $studentId = trim($row[$columnIndexByKey['student_id']] ?? '');
                if ($studentId === '' || strcasecmp($studentId, 'ROSTER-EXAMPLE') === 0) {
                    $skipped++;

                    continue;
                }

                $email = array_key_exists('email', $columnIndexByKey)
                    ? trim((string) ($row[$columnIndexByKey['email']] ?? ''))
                    : '';
                $fullName = array_key_exists('full_name', $columnIndexByKey)
                    ? trim((string) ($row[$columnIndexByKey['full_name']] ?? ''))
                    : '';

                SchoolRosterEntry::query()->updateOrCreate(
                    ['student_id' => $studentId],
                    [
                        'email' => $email === '' ? null : $email,
                        'full_name' => $fullName === '' ? null : $fullName,
                    ],
                );
                $imported++;
            }
        });

        return redirect()->route('admin.roster.master-list')->with(
            'success',
            "Roster updated: {$imported} row(s) saved.".($skipped > 0 ? " ({$skipped} blank/example row(s) skipped.)" : ''),
        );
    }

    public function destroy(SchoolRosterEntry $school_roster_entry): RedirectResponse
    {
        $school_roster_entry->delete();

        return redirect()->route('admin.roster.master-list')->with(
            'success',
            'Roster entry removed.',
        );
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
