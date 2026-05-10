<?php

use App\Enums\UserRole;
use App\Mail\StudentLoginCredentialsMail;
use App\Models\Course;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Support\Facades\Mail;
use Inertia\Testing\AssertableInertia as Assert;

test('admin students accounts page groups students by course', function () {
    $admin = User::factory()->admin()->create();
    $course = Course::factory()->create([
        'code' => 'BSIT',
        'name' => 'Information Technology',
    ]);
    $student = User::factory()->student()->create([
        'name' => 'Jane Doe',
        'email' => 'jane@school.edu',
    ]);
    StudentProfile::factory()->create([
        'user_id' => $student->id,
        'student_id' => '2024-001',
        'course_id' => $course->id,
        'section' => 'A',
        'year_level' => '3',
    ]);

    $this->actingAs($admin)
        ->get(route('admin.students.accounts'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/students/accounts')
            ->has('courseGroups')
            ->has('unassignedStudents')
            ->has('disabledStudents')
            ->where('totalStudents', 1));
});

test('guest cannot store student account', function () {
    Mail::fake();
    $course = Course::factory()->create();

    $this->post(route('admin.students.store'), [
        'name' => 'Test Student',
        'email' => 'student@school.edu',
        'student_id' => '2024-001',
        'course_id' => $course->id,
    ])->assertRedirect(route('login'));

    Mail::assertNothingSent();
});

test('student cannot store student account', function () {
    Mail::fake();
    $student = User::factory()->student()->create();
    $course = Course::factory()->create();

    $this->actingAs($student)->post(route('admin.students.store'), [
        'name' => 'Test Student',
        'email' => 'student@school.edu',
        'student_id' => '2024-001',
        'course_id' => $course->id,
    ])->assertForbidden();

    Mail::assertNothingSent();
});

test('admin can create student account and profile', function () {
    Mail::fake();
    $admin = User::factory()->admin()->create();
    $course = Course::factory()->create();

    $response = $this->actingAs($admin)->post(route('admin.students.store'), [
        'name' => 'Test Student',
        'email' => 'student@school.edu',
        'student_id' => '2024-001',
        'course_id' => $course->id,
        'section' => 'A',
        'year_level' => '2',
    ]);

    $response->assertRedirect(route('admin.students.index'));
    $response->assertSessionHas('success');

    $user = User::query()->where('email', 'student@school.edu')->first();
    expect($user)->not->toBeNull()
        ->and($user->role)->toBe(UserRole::Student)
        ->and($user->email_verified_at)->not->toBeNull();

    $this->assertDatabaseHas('student_profiles', [
        'user_id' => $user->id,
        'student_id' => '2024-001',
        'course_id' => $course->id,
        'section' => 'A',
        'year_level' => '2',
    ]);

    Mail::assertSent(StudentLoginCredentialsMail::class);
});

test('store validates unique student id', function () {
    Mail::fake();
    $admin = User::factory()->admin()->create();
    $course = Course::factory()->create();
    $existing = User::factory()->student()->create();
    StudentProfile::factory()->create([
        'user_id' => $existing->id,
        'student_id' => 'DUP-001',
        'course_id' => $course->id,
    ]);

    $this->actingAs($admin)->post(route('admin.students.store'), [
        'name' => 'Other',
        'email' => 'other@school.edu',
        'student_id' => 'DUP-001',
        'course_id' => $course->id,
    ])->assertSessionHasErrors('student_id');

    Mail::assertNothingSent();
});
