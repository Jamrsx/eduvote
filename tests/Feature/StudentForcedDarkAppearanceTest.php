<?php

use App\Models\User;

test('student html includes forced dark meta and class', function (): void {
    $student = User::factory()->student()->create();

    $response = $this->actingAs($student)->get(route('student.dashboard'));

    $response->assertOk();
    $html = $response->getContent();
    expect($html)->toContain('name="eduvote-student-forced-dark"');
    expect($html)->toMatch('/<html lang="[^"]+" class="dark"/');
});

test('admin html does not include student forced dark meta', function (): void {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)->get(route('admin.dashboard'));

    $response->assertOk();
    expect($response->getContent())->not->toContain('eduvote-student-forced-dark');
});
