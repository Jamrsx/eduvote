<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('admins receive pending student registration count in shared props', function () {
    $admin = User::factory()->admin()->create();
    User::factory()
        ->count(2)
        ->pendingStudentRegistration()
        ->create();

    $response = $this->actingAs($admin)->get(route('admin.dashboard'));

    $response->assertOk()->assertInertia(fn (Assert $page) => $page
        ->where('pendingStudentRegistrationCount', 2));
});

test('non admins receive zero pending registration count', function () {
    $student = User::factory()->student()->create();
    User::factory()->pendingStudentRegistration()->create();

    $response = $this->actingAs($student)->get(route('student.dashboard'));

    $response->assertOk()->assertInertia(fn (Assert $page) => $page
        ->where('pendingStudentRegistrationCount', 0));
});
