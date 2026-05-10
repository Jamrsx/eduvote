<?php

use App\Models\Candidate;
use App\Models\Course;
use App\Models\Election;
use App\Models\Party;
use App\Models\Position;
use App\Models\StudentProfile;
use App\Models\User;
use App\Models\Vote;
use Inertia\Testing\AssertableInertia as Assert;

test('student sees only campus-wide nominees from other programs on a campus-wide ballot line', function (): void {
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
        ->get(route('student.voting.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('student/voting/index')
            ->has('elections', 1)
            ->where('elections.0.ballot_locked', false)
            ->has('elections.0.races', 1)
            ->has('elections.0.races.0.options', 1)
            ->where('elections.0.races.0.options.0.full_name', 'Campus Nominee'));
});

test('student sees campus-wide and matching program slate nominees on a campus-wide ballot line', function (): void {
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
        ->get(route('student.voting.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('student/voting/index')
            ->where('elections.0.ballot_locked', false)
            ->has('elections.0.races.0.options', 2)
            ->where('elections.0.races.0.options.0.full_name', 'Campus Nominee')
            ->where('elections.0.races.0.options.1.full_name', 'EDUC Program Nominee'));
});

test('student cannot submit another program slate nominee on a campus-wide ballot line', function (): void {
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
    ]);
    $educParty = Party::factory()->for($election)->create([
        'course_id' => $educ->id,
        'name' => 'EDUC Party',
    ]);

    $campusCand = Candidate::factory()->forBallot($election, $position)->create([
        'full_name' => 'Campus Nominee',
        'party_id' => $campusParty->id,
    ]);
    $educCand = Candidate::factory()->forBallot($election, $position)->create([
        'full_name' => 'EDUC Program Nominee',
        'party_id' => $educParty->id,
    ]);

    $bsitUser = User::factory()->student()->create();
    StudentProfile::factory()->create([
        'user_id' => $bsitUser->id,
        'course_id' => $bsit->id,
    ]);

    $this->actingAs($bsitUser)
        ->post(route('student.elections.ballot.store', $election), [
            'selections' => [
                [
                    'position_id' => $position->id,
                    'candidate_id' => $educCand->id,
                ],
            ],
        ])
        ->assertInvalid(['selections']);

    expect(Vote::query()->where('user_id', $bsitUser->id)->doesntExist())->toBeTrue();

    $this->actingAs($bsitUser)
        ->post(route('student.elections.ballot.store', $election), [
            'selections' => [
                [
                    'position_id' => $position->id,
                    'candidate_id' => $campusCand->id,
                ],
            ],
        ])
        ->assertRedirect(route('student.voting.index'));

    expect(Vote::query()->where([
        'user_id' => $bsitUser->id,
        'election_id' => $election->id,
        'position_id' => $position->id,
        'candidate_id' => $campusCand->id,
    ])->exists())->toBeTrue();

    $this->actingAs($bsitUser)
        ->get(route('student.voting.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->where('elections.0.ballot_locked', true)
            ->has('elections.0.committed_races', 1)
            ->where('elections.0.committed_races.0.full_name', 'Campus Nominee'));

    $this->actingAs($bsitUser)
        ->post(route('student.elections.ballot.store', $election), [
            'selections' => [
                [
                    'position_id' => $position->id,
                    'candidate_id' => $campusCand->id,
                ],
            ],
        ])
        ->assertInvalid(['selections']);
});

test('student autosave restores partial ballot choices after revisit', function (): void {
    $election = Election::factory()->acceptingNow()->create();
    $course = Course::factory()->create([
        'code' => 'BSIT',
        'name' => 'Information Technology',
    ]);

    $president = Position::factory()->for($election)->forCampus()->create([
        'name' => 'President',
        'sort_order' => 0,
    ]);
    $vice = Position::factory()->for($election)->forCampus()->create([
        'name' => 'Vice President',
        'sort_order' => 1,
    ]);

    $party = Party::factory()->for($election)->create([
        'course_id' => null,
        'name' => 'Unity Slate',
    ]);

    $presidentCand = Candidate::factory()->forBallot($election, $president)->create([
        'party_id' => $party->id,
    ]);
    $viceCand = Candidate::factory()->forBallot($election, $vice)->create([
        'party_id' => $party->id,
    ]);

    $student = User::factory()->student()->create();
    StudentProfile::factory()->create([
        'user_id' => $student->id,
        'course_id' => $course->id,
    ]);

    $this->actingAs($student)
        ->post(route('student.elections.ballot.progress', $election), [
            'selections' => [
                [
                    'position_id' => $president->id,
                    'candidate_id' => $presidentCand->id,
                ],
            ],
        ])
        ->assertRedirect(route('student.voting.index'));

    expect(Vote::query()->where([
        'user_id' => $student->id,
        'election_id' => $election->id,
        'position_id' => $president->id,
        'candidate_id' => $presidentCand->id,
    ])->exists())->toBeTrue();

    $this->actingAs($student)
        ->get(route('student.voting.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('student/voting/index')
            ->where('elections.0.ballot_locked', false)
            ->where('elections.0.id', $election->id)
            ->where('elections.0.races.0.chosen_candidate_id', $presidentCand->id));

    $this->actingAs($student)
        ->post(route('student.elections.ballot.store', $election), [
            'selections' => [
                [
                    'position_id' => $president->id,
                    'candidate_id' => $presidentCand->id,
                ],
                [
                    'position_id' => $vice->id,
                    'candidate_id' => $viceCand->id,
                ],
            ],
        ])
        ->assertRedirect(route('student.voting.index'));

    $this->actingAs($student)
        ->get(route('student.voting.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->where('elections.0.ballot_locked', true));
});
