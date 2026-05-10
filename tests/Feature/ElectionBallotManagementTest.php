<?php

use App\Models\Candidate;
use App\Models\Election;
use App\Models\Position;
use App\Models\StudentProfile;
use App\Models\User;
use App\Models\Vote;

test('admin can add a ballot position', function () {
    $admin = User::factory()->admin()->create();
    $election = Election::factory()->draft()->create();

    $this->actingAs($admin)
        ->post(route('admin.elections.positions.store', $election), [
            'name' => 'President',
            'max_selections' => 1,
        ])
        ->assertRedirect(route('admin.candidates.index'));

    expect(
        Position::query()
            ->where('election_id', $election->id)
            ->where('name', 'President')
            ->exists()
    )->toBeTrue();
});

test('admin can update a ballot position', function () {
    $admin = User::factory()->admin()->create();
    $election = Election::factory()->draft()->create();
    $position = Position::factory()->for($election)->create(['name' => 'VP']);

    $this->actingAs($admin)
        ->patch(route('admin.elections.positions.update', [$election, $position]), [
            'name' => 'Vice President',
            'max_selections' => 1,
        ])
        ->assertRedirect(route('admin.candidates.index'));

    expect($position->fresh()->name)->toBe('Vice President');
});

test('admin can remove an empty ballot position', function () {
    $admin = User::factory()->admin()->create();
    $election = Election::factory()->draft()->create();
    $position = Position::factory()->for($election)->create();

    $this->actingAs($admin)
        ->delete(route('admin.elections.positions.destroy', [$election, $position]))
        ->assertRedirect(route('admin.candidates.index'));

    expect(Position::query()->find($position->id))->toBeNull();
});

test('admin cannot remove a ballot position after votes exist', function () {
    $admin = User::factory()->admin()->create();
    $election = Election::factory()->acceptingNow()->create();
    $position = Position::factory()->for($election)->create();
    $candidate = Candidate::factory()->forBallot($election, $position)->create();

    $student = User::factory()->student()->create();
    StudentProfile::factory()->for($student)->create();

    Vote::query()->create([
        'election_id' => $election->id,
        'position_id' => $position->id,
        'user_id' => $student->id,
        'candidate_id' => $candidate->id,
    ]);

    $this->actingAs($admin)
        ->from(route('admin.candidates.index'))
        ->delete(route('admin.elections.positions.destroy', [$election, $position]))
        ->assertRedirect(route('admin.candidates.index'))
        ->assertSessionHasErrors('ballot');

    expect(Position::query()->find($position->id))->not->toBeNull();
});

test('admin can add a candidate to a position', function () {
    $admin = User::factory()->admin()->create();
    $election = Election::factory()->draft()->create();
    $position = Position::factory()->for($election)->create();

    $this->actingAs($admin)
        ->post(route('admin.elections.positions.candidates.store', [$election, $position]), [
            'full_name' => 'Jane Doe',
            'platform' => 'Focus on representation.',
        ])
        ->assertRedirect(route('admin.candidates.index'));

    expect(
        Candidate::query()
            ->where('election_id', $election->id)
            ->where('position_id', $position->id)
            ->where('full_name', 'Jane Doe')
            ->exists()
    )->toBeTrue();
});

test('admin can update a candidate', function () {
    $admin = User::factory()->admin()->create();
    $election = Election::factory()->draft()->create();
    $position = Position::factory()->for($election)->create();
    $candidate = Candidate::factory()->forBallot($election, $position)->create([
        'full_name' => 'Old',
    ]);

    $this->actingAs($admin)
        ->patch(route('admin.elections.candidates.update', [$election, $candidate]), [
            'full_name' => 'New Name',
            'platform' => null,
        ])
        ->assertRedirect(route('admin.candidates.index'));

    expect($candidate->fresh()->full_name)->toBe('New Name');
});

test('admin cannot remove a candidate after votes exist', function () {
    $admin = User::factory()->admin()->create();
    $election = Election::factory()->acceptingNow()->create();
    $position = Position::factory()->for($election)->create();
    $candidate = Candidate::factory()->forBallot($election, $position)->create();

    $student = User::factory()->student()->create();
    StudentProfile::factory()->for($student)->create();

    Vote::query()->create([
        'election_id' => $election->id,
        'position_id' => $position->id,
        'user_id' => $student->id,
        'candidate_id' => $candidate->id,
    ]);

    $this->actingAs($admin)
        ->from(route('admin.candidates.index'))
        ->delete(route('admin.elections.candidates.destroy', [$election, $candidate]))
        ->assertRedirect(route('admin.candidates.index'))
        ->assertSessionHasErrors('ballot');

    expect(Candidate::query()->find($candidate->id))->not->toBeNull();
});

test('student cannot manage ballot positions', function () {
    $student = User::factory()->student()->create();
    $election = Election::factory()->draft()->create();

    $this->actingAs($student)
        ->post(route('admin.elections.positions.store', $election), [
            'name' => 'President',
        ])
        ->assertForbidden();
});

test('cannot target a position that does not belong to the election', function () {
    $admin = User::factory()->admin()->create();
    $electionA = Election::factory()->draft()->create();
    $electionB = Election::factory()->draft()->create();
    $positionOnA = Position::factory()->for($electionA)->create();

    $this->actingAs($admin)
        ->delete(route('admin.elections.positions.destroy', [$electionB, $positionOnA]))
        ->assertNotFound();
});
