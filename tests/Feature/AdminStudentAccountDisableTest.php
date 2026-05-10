<?php

use App\Enums\StudentAccountStatus;
use App\Models\User;

test('admin can disable an active student account', function () {
    $admin = User::factory()->admin()->create();
    $student = User::factory()->student()->create();

    $this->actingAs($admin)
        ->post(route('admin.students.disable-account', $student))
        ->assertRedirect(route('admin.students.accounts'));

    expect($student->fresh()->student_account_status)->toBe(StudentAccountStatus::Disabled);
});

test('admin can enable a disabled student account', function () {
    $admin = User::factory()->admin()->create();
    $student = User::factory()->disabledStudentAccount()->create();

    $this->actingAs($admin)
        ->post(route('admin.students.enable-account', $student))
        ->assertRedirect(route('admin.students.accounts'));

    expect($student->fresh()->student_account_status)->toBe(StudentAccountStatus::Active);
});

test('students cannot disable accounts', function () {
    $student = User::factory()->student()->create();
    $target = User::factory()->student()->create();

    $this->actingAs($student)
        ->post(route('admin.students.disable-account', $target))
        ->assertForbidden();
});
