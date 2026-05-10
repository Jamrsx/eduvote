<?php

use App\Enums\StudentAccountStatus;
use App\Models\Course;
use App\Models\StudentProfile;
use App\Models\User;

test('admin can approve a pending student registration', function () {
    $admin = User::factory()->admin()->create();
    $course = Course::factory()->create();
    $pending = User::factory()->pendingStudentRegistration()->create([
        'name' => 'Pending User',
        'email' => 'pending@test.edu',
    ]);
    StudentProfile::factory()->create([
        'user_id' => $pending->id,
        'student_id' => 'P-999',
        'course_id' => $course->id,
    ]);

    $this->actingAs($admin)->post(route('admin.students.pending.approve', $pending))
        ->assertRedirect(route('admin.roster.index'));

    expect($pending->fresh()->student_account_status)->toBe(StudentAccountStatus::Active);
});

test('admin can reject a pending student registration', function () {
    $admin = User::factory()->admin()->create();
    $course = Course::factory()->create();
    $pending = User::factory()->pendingStudentRegistration()->create([
        'email' => 'reject@test.edu',
    ]);
    StudentProfile::factory()->create([
        'user_id' => $pending->id,
        'student_id' => 'P-888',
        'course_id' => $course->id,
    ]);

    $this->actingAs($admin)->post(route('admin.students.pending.reject', $pending))
        ->assertRedirect(route('admin.roster.index'));

    expect($pending->fresh()->student_account_status)->toBe(StudentAccountStatus::Rejected);
});
