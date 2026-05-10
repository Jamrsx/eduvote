<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('student dashboard shows election summaries and program label', function (): void {
    $user = User::factory()->student()->create();

    $this->actingAs($user)
        ->get(route('student.dashboard'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('student/dashboard')
            ->has('election_summaries')
            ->where('student_course_label', null));
});
