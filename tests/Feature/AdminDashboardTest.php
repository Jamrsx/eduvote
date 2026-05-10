<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('admin dashboard renders summary data', function () {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)->get(route('admin.dashboard'));

    $response->assertOk()->assertInertia(fn (Assert $page) => $page
        ->component('admin/dashboard')
        ->has('stats')
        ->has('stats.elections')
        ->has('stats.elections.byStatus')
        ->has('stats.students')
        ->has('recentElections'));
});

test('students cannot access admin dashboard', function () {
    $student = User::factory()->student()->create();

    $this->actingAs($student)->get(route('admin.dashboard'))->assertForbidden();
});
