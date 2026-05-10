<?php

use App\Models\Candidate;
use App\Models\Course;
use App\Models\Election;
use App\Models\Party;
use App\Models\Position;
use App\Models\StudentProfile;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('student officers directory only lists campus-wide and own-program slates', function (): void {
    $election = Election::factory()->acceptingNow()->create();

    $educ = Course::factory()->create([
        'code' => 'EDUC',
        'name' => 'Education',
    ]);
    $bsit = Course::factory()->create([
        'code' => 'BSIT',
        'name' => 'Information Technology',
    ]);

    $position = Position::factory()->for($election)->forCampus()->create([
        'name' => 'President',
        'sort_order' => 0,
    ]);

    $campusParty = Party::factory()->for($election)->create([
        'course_id' => null,
        'name' => 'Unity Slate',
        'sort_order' => 0,
    ]);
    $educParty = Party::factory()->for($election)->create([
        'course_id' => $educ->id,
        'name' => 'EDUC Party',
        'sort_order' => 1,
    ]);

    Candidate::factory()->forBallot($election, $position)->create([
        'full_name' => 'Campus Nominee',
        'party_id' => $campusParty->id,
        'sort_order' => 0,
    ]);
    Candidate::factory()->forBallot($election, $position)->create([
        'full_name' => 'EDUC Program Nominee',
        'party_id' => $educParty->id,
        'sort_order' => 1,
    ]);

    $bsitUser = User::factory()->student()->create();
    StudentProfile::factory()->create([
        'user_id' => $bsitUser->id,
        'course_id' => $bsit->id,
    ]);

    $this->actingAs($bsitUser)
        ->get(route('student.officers.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('student/officers/index')
            ->has('elections', 1)
            ->has('elections.0.offices', 1)
            ->has('elections.0.offices.0.nominees', 1)
            ->where('elections.0.offices.0.nominees.0.full_name', 'Campus Nominee'));
});

test('student sees own program slate nominees on a campus-wide office', function (): void {
    $election = Election::factory()->acceptingNow()->create();

    $educ = Course::factory()->create([
        'code' => 'EDUC',
        'name' => 'Education',
    ]);

    $position = Position::factory()->for($election)->forCampus()->create([
        'name' => 'President',
        'sort_order' => 0,
    ]);

    $campusParty = Party::factory()->for($election)->create([
        'course_id' => null,
        'name' => 'Unity Slate',
        'sort_order' => 0,
    ]);
    $educParty = Party::factory()->for($election)->create([
        'course_id' => $educ->id,
        'name' => 'EDUC Party',
        'sort_order' => 1,
    ]);

    Candidate::factory()->forBallot($election, $position)->create([
        'full_name' => 'Campus Nominee',
        'party_id' => $campusParty->id,
        'sort_order' => 0,
    ]);
    Candidate::factory()->forBallot($election, $position)->create([
        'full_name' => 'EDUC Program Nominee',
        'party_id' => $educParty->id,
        'sort_order' => 1,
    ]);

    $educUser = User::factory()->student()->create();
    StudentProfile::factory()->create([
        'user_id' => $educUser->id,
        'course_id' => $educ->id,
    ]);

    $this->actingAs($educUser)
        ->get(route('student.officers.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('student/officers/index')
            ->has('elections.0.offices.0.nominees', 2));
});

test('student officers directory lists nominees and platforms for scheduled elections', function (): void {
    $election = Election::factory()->scheduled()->create();

    $bsit = Course::factory()->create([
        'code' => 'BSIT',
        'name' => 'Information Technology',
    ]);

    $position = Position::factory()->for($election)->forCampus()->create([
        'name' => 'President',
        'sort_order' => 0,
    ]);

    $party = Party::factory()->for($election)->create([
        'course_id' => null,
        'name' => 'Unity Slate',
    ]);

    Candidate::factory()->forBallot($election, $position)->create([
        'full_name' => 'Preview Candidate',
        'party_id' => $party->id,
        'platform' => 'Lower fees and more study space.',
        'sort_order' => 0,
    ]);

    $student = User::factory()->student()->create();
    StudentProfile::factory()->create([
        'user_id' => $student->id,
        'course_id' => $bsit->id,
    ]);

    $this->actingAs($student)
        ->get(route('student.officers.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('student/officers/index')
            ->has('elections', 1)
            ->where('elections.0.status', 'scheduled')
            ->where('elections.0.accepting_votes', false)
            ->has('elections.0.opens_at_display')
            ->has('elections.0.closes_at_display')
            ->where('elections.0.offices.0.nominees.0.full_name', 'Preview Candidate')
            ->where(
                'elections.0.offices.0.nominees.0.platform',
                'Lower fees and more study space.',
            ));
});
