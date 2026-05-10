<?php

use App\Models\Candidate;
use App\Models\Course;
use App\Models\Election;
use App\Models\Party;
use App\Models\Position;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

test('admin can visit parties index', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->get(route('admin.parties.index'))
        ->assertOk();
});

test('student cannot visit parties index', function () {
    $student = User::factory()->student()->create();

    $this->actingAs($student)
        ->get(route('admin.parties.index'))
        ->assertForbidden();
});

test('admin can create a party for an election', function () {
    $admin = User::factory()->admin()->create();
    $election = Election::factory()->draft()->create();

    $this->actingAs($admin)
        ->post(route('admin.elections.parties.store', $election), [
            'name' => 'Unity Coalition',
            'short_name' => 'UC',
        ])
        ->assertRedirect(route('admin.parties.index'));

    expect(
        Party::query()
            ->where('election_id', $election->id)
            ->where('name', 'Unity Coalition')
            ->exists()
    )->toBeTrue();
});

test('duplicate party name within same election is rejected', function () {
    $admin = User::factory()->admin()->create();
    $election = Election::factory()->draft()->create();
    Party::factory()->create([
        'election_id' => $election->id,
        'name' => 'Blue Team',
    ]);

    $this->actingAs($admin)
        ->from(route('admin.parties.index'))
        ->post(route('admin.elections.parties.store', $election), [
            'name' => 'Blue Team',
        ])
        ->assertRedirect(route('admin.parties.index'))
        ->assertSessionHasErrors('name');

    expect(Party::query()->where('election_id', $election->id)->count())->toBe(1);
});

test('admin can update and delete a party', function () {
    $admin = User::factory()->admin()->create();
    $election = Election::factory()->draft()->create();
    $party = Party::factory()->create([
        'election_id' => $election->id,
        'name' => 'Old Name',
    ]);

    $this->actingAs($admin)
        ->patch(route('admin.elections.parties.update', [$election, $party]), [
            'name' => 'New Name',
        ])
        ->assertRedirect(route('admin.parties.index'));

    expect($party->fresh()->name)->toBe('New Name');

    $this->actingAs($admin)
        ->delete(route('admin.elections.parties.destroy', [$election, $party]))
        ->assertRedirect(route('admin.parties.index'));

    expect(Party::query()->find($party->id))->toBeNull();
});

test('program party nominee uses free-text role and creates dept ballot line', function () {
    $admin = User::factory()->admin()->create();
    $election = Election::factory()->draft()->create();
    $course = Course::factory()->create();
    $party = Party::factory()->create([
        'election_id' => $election->id,
        'course_id' => $course->id,
        'name' => 'Devs Slate',
    ]);

    $this->actingAs($admin)
        ->post(route('admin.elections.parties.candidates.store', [$election, $party]), [
            'position_name' => 'Chief student rep',
            'full_name' => 'John Doe',
            'platform' => 'Build better!',
        ])
        ->assertRedirect(route('admin.parties.index'));

    expect(
        Position::query()
            ->where('election_id', $election->id)
            ->where('name', 'Chief student rep')
            ->where('course_id', $course->id)
            ->exists()
    )->toBeTrue();

    $candidate = Candidate::query()
        ->where('party_id', $party->id)
        ->where('full_name', 'John Doe')
        ->first();

    expect($candidate)->not->toBeNull()
        ->and((int) $candidate->course_id)->toBe((int) $course->id)
        ->and((int) $candidate->party_id)->toBe((int) $party->id);
});

test('admin can add nominee with photo stored on public disk', function () {
    Storage::fake('public');

    $admin = User::factory()->admin()->create();
    $election = Election::factory()->draft()->create();
    $party = Party::factory()->create([
        'election_id' => $election->id,
        'course_id' => null,
        'name' => 'Vision Slate',
    ]);

    $photo = UploadedFile::fake()->image('nominee-portrait.jpg', 120, 120);

    $this->actingAs($admin)
        ->post(route('admin.elections.parties.candidates.store', [$election, $party]), [
            'position_name' => 'Secretary',
            'full_name' => 'Taylor Photo',
            'photo' => $photo,
        ])
        ->assertRedirect(route('admin.parties.index'));

    $candidate = Candidate::query()
        ->where('party_id', $party->id)
        ->where('full_name', 'Taylor Photo')
        ->first();

    expect($candidate)->not->toBeNull()
        ->and($candidate->photo_path)->not->toBeNull()
        ->and(Storage::disk('public')->exists((string) $candidate->photo_path))->toBeTrue();
});

test('admin can update nominee with file using post and method spoof so fields are readable', function () {
    Storage::fake('public');

    $admin = User::factory()->admin()->create();
    $election = Election::factory()->draft()->create();
    $party = Party::factory()->create([
        'election_id' => $election->id,
        'course_id' => null,
    ]);

    $position = Position::factory()->create([
        'election_id' => $election->id,
        'name' => 'President',
        'course_id' => null,
        'sort_order' => 0,
    ]);

    $candidate = Candidate::factory()->forBallot($election, $position)->create([
        'party_id' => $party->id,
        'full_name' => 'Althian James',
    ]);

    $photo = UploadedFile::fake()->image('nominee-photo.jpg');

    $this->actingAs($admin)
        ->post(route('admin.elections.parties.candidates.update', [$election, $party, $candidate]), [
            '_method' => 'PATCH',
            'position_name' => 'President',
            'full_name' => 'Althian James',
            'platform' => 'Updated platform text',
            'photo' => $photo,
        ])
        ->assertRedirect(route('admin.parties.index'));

    $fresh = $candidate->fresh();

    expect($fresh->platform)->toBe('Updated platform text')
        ->and($fresh->photo_path)->not->toBeNull()
        ->and(Storage::disk('public')->exists((string) $fresh->photo_path))->toBeTrue();
});

test('campus-wide party nominee creates campus ballot line from role text', function () {
    $admin = User::factory()->admin()->create();
    $election = Election::factory()->draft()->create();
    $party = Party::factory()->create([
        'election_id' => $election->id,
        'course_id' => null,
        'name' => 'For a Change',
    ]);

    $this->actingAs($admin)
        ->post(route('admin.elections.parties.candidates.store', [$election, $party]), [
            'position_name' => 'Head delegate',
            'full_name' => 'Jane Doe',
        ])
        ->assertRedirect(route('admin.parties.index'));

    expect(
        Position::query()
            ->where('election_id', $election->id)
            ->where('name', 'Head delegate')
            ->whereNull('course_id')
            ->exists()
    )->toBeTrue();
});
