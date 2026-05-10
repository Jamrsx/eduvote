<?php

use App\Enums\UserRole;
use App\Mail\StudentLoginCredentialsMail;
use App\Models\Course;
use App\Models\StudentImportBatch;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

/**
 * @param  list<list<mixed>>  $rows
 */
function studentImportSampleXlsx(array $rows, string $filename = 'import.xlsx'): UploadedFile
{
    $spreadsheet = new Spreadsheet;
    $spreadsheet->getActiveSheet()->fromArray($rows, null, 'A1');

    $path = tempnam(sys_get_temp_dir(), 'impxlsx_');
    (new Xlsx($spreadsheet))->save($path);

    return new UploadedFile(
        $path,
        $filename,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        null,
        true,
    );
}

test('guest cannot import students from excel', function () {
    $file = studentImportSampleXlsx([
        ['name', 'email', 'student_id', 'course_code'],
    ]);

    $this->post(route('admin.students.import'), [
        'excel' => $file,
    ])->assertRedirect(route('login'));
});

test('student cannot import students from excel', function () {
    $student = User::factory()->student()->create();

    $file = studentImportSampleXlsx([
        ['name', 'email', 'student_id', 'course_code'],
    ]);

    $this->actingAs($student)->post(route('admin.students.import'), [
        'excel' => $file,
    ])->assertForbidden();
});

test('admin import rejects excel missing required column', function () {
    Mail::fake();

    $admin = User::factory()->admin()->create();
    Course::factory()->create(['code' => 'BSIT']);

    $file = studentImportSampleXlsx([
        ['name', 'email', 'student_id'],
        ['Jane', 'j@test.edu', 'S1'],
    ], 'bad.xlsx');

    $this->actingAs($admin)->post(route('admin.students.import'), [
        'excel' => $file,
    ])
        ->assertRedirect(route('admin.students.index'))
        ->assertSessionHasErrors('excel');

    expect(User::query()->where('email', 'j@test.edu')->exists())->toBeFalse();
});

test('admin can import students from excel and they appear on accounts grouping', function () {
    Mail::fake();

    $admin = User::factory()->admin()->create();
    $course = Course::factory()->create(['code' => 'BSIT']);

    $file = studentImportSampleXlsx([
        ['name', 'email', 'student_id', 'course_code', 'section', 'year_level'],
        ['Alice Import', 'alice-import@test.edu', 'IMP-A001', 'BSIT', 'A', '2'],
        ['Bob Import', 'bob-import@test.edu', 'IMP-B002', 'BSIT', 'B', '3'],
    ], 'students.xlsx');

    $this->actingAs($admin)->post(route('admin.students.import'), [
        'excel' => $file,
    ])
        ->assertRedirect(route('admin.students.index'))
        ->assertSessionHas('success')
        ->assertSessionHas('import_warnings');

    expect(User::query()->where('email', 'alice-import@test.edu')->where('role', UserRole::Student)->exists())->toBeTrue();
    expect(User::query()->where('email', 'bob-import@test.edu')->where('role', UserRole::Student)->exists())->toBeTrue();

    Mail::assertSent(StudentLoginCredentialsMail::class, 2);

    $this->actingAs($admin)->get(route('admin.students.accounts'))->assertOk();

    expect(StudentImportBatch::query()->where('user_id', $admin->id)->where('row_count', 2)->exists())->toBeTrue()
        ->and($course->studentProfiles()->count())->toBe(2);
});
