<?php

use App\Enums\ElectionStatus;
use App\Models\BallotSubmission;
use App\Models\Candidate;
use App\Models\Course;
use App\Models\Election;
use App\Models\Position;
use App\Models\User;
use App\Models\Vote;
use Inertia\Testing\AssertableInertia as Assert;

test('admin can view election results page', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->get(route('admin.result.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/result/index')
            ->has('elections')
            ->has('appTimezone'));
});

test('students cannot view election results page', function () {
    $student = User::factory()->student()->create();

    $this->actingAs($student)
        ->get(route('admin.result.index'))
        ->assertForbidden();
});

test('legacy admin voting url redirects to election results', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->get(route('admin.voting.index'))
        ->assertRedirect(route('admin.result.index'));
});

test('closed election exposes vote tallies in inertia props', function () {
    $admin = User::factory()->admin()->create();
    $election = Election::factory()->closed()->create();

    $position = Position::factory()->for($election)->create([
        'name' => 'President',
        'course_id' => null,
        'sort_order' => 0,
    ]);

    $candA = Candidate::factory()->forBallot($election, $position)->create([
        'full_name' => 'Alpha',
        'sort_order' => 0,
    ]);
    $candB = Candidate::factory()->forBallot($election, $position)->create([
        'full_name' => 'Beta',
        'sort_order' => 1,
    ]);

    $voter1 = User::factory()->student()->create();
    $voter2 = User::factory()->student()->create();
    $voter3 = User::factory()->student()->create();

    Vote::query()->create([
        'election_id' => $election->id,
        'position_id' => $position->id,
        'user_id' => $voter1->id,
        'candidate_id' => $candA->id,
    ]);
    Vote::query()->create([
        'election_id' => $election->id,
        'position_id' => $position->id,
        'user_id' => $voter2->id,
        'candidate_id' => $candA->id,
    ]);
    Vote::query()->create([
        'election_id' => $election->id,
        'position_id' => $position->id,
        'user_id' => $voter3->id,
        'candidate_id' => $candB->id,
    ]);

    foreach ([$voter1, $voter2, $voter3] as $voter) {
        BallotSubmission::query()->create([
            'election_id' => $election->id,
            'user_id' => $voter->id,
        ]);
    }

    $response = $this->actingAs($admin)->get(route('admin.result.index'));

    $response->assertOk()->assertInertia(fn (Assert $page) => $page
        ->component('admin/result/index')
        ->where('elections.0.results_visible', true)
        ->where('elections.0.distinct_voters', 3)
        ->where('elections.0.total_selections', 3)
        ->where('elections.0.positions.0.lines.0.full_name', 'Alpha')
        ->where('elections.0.positions.0.lines.0.votes', 2)
        ->where('elections.0.positions.0.lines.0.percent', 66.7)
        ->where('elections.0.positions.0.lines.1.full_name', 'Beta')
        ->where('elections.0.positions.0.lines.1.votes', 1)
        ->where('elections.0.positions.0.lines.1.percent', 33.3)
        ->where('elections.0.positions.0.course_id', null)
        ->where('elections.0.positions.0.department_code', null));
});

test('election result positions include campus and department scope metadata', function () {
    $admin = User::factory()->admin()->create();
    $election = Election::factory()->closed()->create();

    $bsit = Course::factory()->create([
        'code' => 'BSIT',
        'name' => 'Information Technology',
    ]);

    Position::factory()->for($election)->forCampus()->create([
        'name' => 'President',
        'sort_order' => 0,
    ]);
    Position::factory()->for($election)->forDepartment($bsit->id)->create([
        'name' => 'Governor — BSIT',
        'sort_order' => 1,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.result.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('elections.0.positions.0.course_id', null)
            ->where('elections.0.positions.0.department_code', null)
            ->where('elections.0.positions.1.course_id', $bsit->id)
            ->where('elections.0.positions.1.department_code', 'BSIT')
            ->where('elections.0.positions.1.department_name', 'Information Technology'));
});

test('non-closed election hides vote counts in results payload', function () {
    $admin = User::factory()->admin()->create();
    $election = Election::factory()->create([
        'status' => ElectionStatus::Open,
    ]);
    $position = Position::factory()->for($election)->create(['course_id' => null]);
    $candidate = Candidate::factory()->forBallot($election, $position)->create([
        'full_name' => 'Soon',
    ]);

    $voter = User::factory()->student()->create();
    Vote::query()->create([
        'election_id' => $election->id,
        'position_id' => $position->id,
        'user_id' => $voter->id,
        'candidate_id' => $candidate->id,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.result.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/result/index')
            ->where('elections.0.results_visible', false)
            ->where('elections.0.positions.0.lines.0.votes', 0)
            ->where('elections.0.positions.0.lines.0.percent', null));
});
