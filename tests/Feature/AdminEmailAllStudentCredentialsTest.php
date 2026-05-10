<?php

use App\Mail\StudentLoginCredentialsMail;
use App\Models\Course;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Support\Facades\Mail;

test('guest cannot bulk email student credentials', function () {
    Mail::fake();

    $this->post(route('admin.students.accounts.email-all'))
        ->assertRedirect(route('login'));

    Mail::assertNothingSent();
});

test('student cannot bulk email student credentials', function () {
    Mail::fake();

    $student = User::factory()->student()->create();

    $this->actingAs($student)->post(route('admin.students.accounts.email-all'))
        ->assertForbidden();

    Mail::assertNothingSent();
});

test('admin bulk email shows message when no students exist', function () {
    Mail::fake();

    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->post(route('admin.students.accounts.email-all'))
        ->assertRedirect(route('admin.students.accounts'))
        ->assertSessionHas('success');

    Mail::assertNothingSent();
});

test('admin emails credentials to all students and resets passwords', function () {
    Mail::fake();

    $admin = User::factory()->admin()->create();
    $course = Course::factory()->create();
    $studentA = User::factory()->student()->create(['email' => 'alpha@test.edu']);
    $studentB = User::factory()->student()->create(['email' => 'beta@test.edu']);
    StudentProfile::factory()->create([
        'user_id' => $studentA->id,
        'course_id' => $course->id,
    ]);
    StudentProfile::factory()->create([
        'user_id' => $studentB->id,
        'course_id' => $course->id,
    ]);
    $hashBefore = $studentA->fresh()->password;

    $this->actingAs($admin)->post(route('admin.students.accounts.email-all'))
        ->assertRedirect(route('admin.students.accounts'))
        ->assertSessionHas('success');

    Mail::assertSentTimes(StudentLoginCredentialsMail::class, 2);

    expect($studentA->fresh()->password)->not->toBe($hashBefore);
});

test('admin can email credentials to one student', function () {
    Mail::fake();

    $admin = User::factory()->admin()->create();
    $course = Course::factory()->create();
    $student = User::factory()->student()->create(['email' => 'single@test.edu']);
    StudentProfile::factory()->create([
        'user_id' => $student->id,
        'course_id' => $course->id,
    ]);
    $hashBefore = $student->fresh()->password;

    $this->actingAs($admin)
        ->post(route('admin.students.accounts.email-credentials', $student))
        ->assertRedirect(route('admin.students.accounts'))
        ->assertSessionHas('success');

    Mail::assertSent(StudentLoginCredentialsMail::class);
    expect($student->fresh()->password)->not->toBe($hashBefore);
});

test('student cannot email credentials for another account', function () {
    Mail::fake();

    $student = User::factory()->student()->create();
    $other = User::factory()->student()->create();

    $this->actingAs($student)
        ->post(route('admin.students.accounts.email-credentials', $other))
        ->assertForbidden();

    Mail::assertNothingSent();
});

test('admin cannot email credentials for non-student user', function () {
    Mail::fake();

    $admin = User::factory()->admin()->create();
    $otherAdmin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->post(route('admin.students.accounts.email-credentials', $otherAdmin))
        ->assertForbidden();

    Mail::assertNothingSent();
});
