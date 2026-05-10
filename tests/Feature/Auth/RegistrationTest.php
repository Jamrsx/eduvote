<?php

use App\Models\Course;
use App\Models\User;
use Laravel\Fortify\Features;

beforeEach(function () {
    $this->skipUnlessFortifyHas(Features::registration());
});

test('registration screen can be rendered', function () {
    $response = $this->get(route('register'));

    $response->assertOk();
});

test('new student can register with pending approval status', function () {
    $course = Course::factory()->create();

    $response = $this->post(route('register.store'), [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
        'student_id' => 'REG-TEST-001',
        'course_id' => $course->id,
        'section' => 'A',
        'year_level' => '2',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('student.registration-pending', absolute: false));

    $this->assertDatabaseHas('users', [
        'email' => 'test@example.com',
        'student_account_status' => 'pending',
    ]);

    expect(User::where('email', 'test@example.com')->first()?->email_verified_at)->not->toBeNull();
});
