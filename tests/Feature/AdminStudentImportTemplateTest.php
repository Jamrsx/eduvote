<?php

use App\Models\User;
use PhpOffice\PhpSpreadsheet\IOFactory;

test('guest cannot download student import template', function () {
    $this->get(route('admin.students.imports.template'))
        ->assertRedirect(route('login'));
});

test('student cannot download student import template', function () {
    $student = User::factory()->student()->create();

    $this->actingAs($student)->get(route('admin.students.imports.template'))
        ->assertForbidden();
});

test('admin can download student import excel template', function () {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)->get(route('admin.students.imports.template'));

    $response->assertOk();
    $response->assertDownload('eduvote-student-import-template.xlsx');

    $tmp = tempnam(sys_get_temp_dir(), 'tplxlsx_');
    file_put_contents($tmp, $response->getContent());
    $sheet = IOFactory::load($tmp)->getActiveSheet();
    unlink($tmp);

    expect((string) $sheet->getCell('A1')->getValue())->toBe('name')
        ->and((string) $sheet->getCell('C1')->getValue())->toBe('student_id')
        ->and((string) $sheet->getCell('D1')->getValue())->toBe('course_code')
        ->and((string) $sheet->getCell('A2')->getValue())->toBe('Example Student');
});
