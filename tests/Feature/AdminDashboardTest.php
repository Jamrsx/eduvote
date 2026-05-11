<?php

use App\Models\Election;
use App\Models\User;
use Illuminate\Support\Carbon;
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

test('recent elections use app timezone schedule strings like election schedule page', function (): void {
    $admin = User::factory()->admin()->create();

    $opensAt = Carbon::parse('2026-05-07 09:00:00', config('app.timezone'));
    $closesAt = Carbon::parse('2026-05-12 17:00:00', config('app.timezone'));

    Election::factory()->create([
        'title' => '2026 Election',
        'opens_at' => $opensAt,
        'closes_at' => $closesAt,
        'updated_at' => now(),
    ]);

    $expectedOpens = $opensAt->timezone(config('app.timezone'))->format('M j, Y g:i A');
    $expectedCloses = $closesAt->timezone(config('app.timezone'))->format('M j, Y g:i A');

    $this->actingAs($admin)
        ->get(route('admin.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/dashboard')
            ->has('recentElections', 1)
            ->where('recentElections.0.opens_at_display', $expectedOpens)
            ->where('recentElections.0.closes_at_display', $expectedCloses));
});

test('students cannot access admin dashboard', function () {
    $student = User::factory()->student()->create();

    $this->actingAs($student)->get(route('admin.dashboard'))->assertForbidden();
});
