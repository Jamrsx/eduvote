<?php

use App\Models\Election;
use App\Models\User;
use App\Models\Vote;

test('admin can create an election', function () {
    $admin = User::factory()->admin()->create();

    $opens = now()->addDay()->startOfHour();
    $closes = now()->addWeeks(2)->startOfHour();

    $this->actingAs($admin)
        ->post(route('admin.elections.store'), [
            'title' => 'Council election 2026',
            'description' => 'Campus-wide',
            'opens_at' => $opens->format('Y-m-d\TH:i'),
            'closes_at' => $closes->format('Y-m-d\TH:i'),
            'lifecycle' => 'draft',
        ])
        ->assertRedirect(route('admin.elections.index'));

    expect(Election::query()->where('title', 'Council election 2026')->exists())->toBeTrue();
});

test('admin cannot create election when closes_at is before opens_at', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->post(route('admin.elections.store'), [
            'title' => 'Bad dates',
            'description' => null,
            'opens_at' => now()->addWeek()->format('Y-m-d\TH:i'),
            'closes_at' => now()->addDay()->format('Y-m-d\TH:i'),
            'lifecycle' => 'draft',
        ])
        ->assertSessionHasErrors('closes_at');
});

test('admin can delete an election with no votes', function () {
    $admin = User::factory()->admin()->create();
    $election = Election::factory()->draft()->create(['title' => 'To delete']);

    $this->actingAs($admin)
        ->delete(route('admin.elections.destroy', $election))
        ->assertRedirect(route('admin.elections.index'));

    expect(Election::query()->find($election->id))->toBeNull();
});

test('admin cannot delete an election after votes exist', function () {
    $admin = User::factory()->admin()->create();
    $vote = Vote::factory()->create();
    $election = $vote->election;

    $this->actingAs($admin)
        ->delete(route('admin.elections.destroy', $election))
        ->assertRedirect(route('admin.elections.index'))
        ->assertSessionHasErrors('election');

    expect(Election::query()->find($election->id))->not->toBeNull();
});
