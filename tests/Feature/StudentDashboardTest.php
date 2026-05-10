<?php

use App\Models\Candidate;
use App\Models\Course;
use App\Models\Election;
use App\Models\Party;
use App\Models\Position;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;

test('student dashboard shows election summaries and program label', function (): void {
    $user = User::factory()->student()->create();

    $this->actingAs($user)
        ->get(route('student.dashboard'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('student/dashboard')
            ->has('election_summaries')
            ->has('upcoming_election_summaries')
            ->where('student_course_label', null));
});

test('student dashboard includes voting opens at for visible ballots', function (): void {
    $opensAt = Carbon::parse('2026-05-11 09:00:00', config('app.timezone'));

    $election = Election::factory()->acceptingNow()->create([
        'title' => 'Spring election',
        'opens_at' => $opensAt,
        'closes_at' => $opensAt->copy()->addDay()->setHour(17),
    ]);

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
        'sort_order' => 0,
    ]);

    Candidate::factory()->forBallot($election, $position)->create([
        'full_name' => 'Jane Campus',
        'party_id' => $party->id,
        'sort_order' => 0,
    ]);

    $user = User::factory()->student()->create();
    StudentProfile::factory()->create([
        'user_id' => $user->id,
        'course_id' => $bsit->id,
    ]);

    $expectedOpens = $opensAt->timezone(config('app.timezone'))->format('M j, Y g:i A');

    $this->actingAs($user)
        ->get(route('student.dashboard'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('student/dashboard')
            ->has('election_summaries', 1)
            ->where('election_summaries.0.opens_at_display', $expectedOpens));
});

test('student dashboard shows upcoming summaries before voting window opens', function (): void {
    $opensAt = Carbon::parse('2026-05-11 09:00:00', config('app.timezone'));

    $election = Election::factory()->scheduled()->create([
        'title' => 'May election',
        'opens_at' => $opensAt,
        'closes_at' => $opensAt->copy()->addDay()->setHour(17),
    ]);

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
        'full_name' => 'Candidate One',
        'party_id' => $party->id,
        'sort_order' => 0,
    ]);

    $user = User::factory()->student()->create();
    StudentProfile::factory()->create([
        'user_id' => $user->id,
        'course_id' => $bsit->id,
    ]);

    Carbon::setTestNow(Carbon::parse('2026-05-10 12:00:00', config('app.timezone')));

    try {
        $expectedOpens = $opensAt->timezone(config('app.timezone'))->format('M j, Y g:i A');

        $this->actingAs($user)
            ->get(route('student.dashboard'))
            ->assertSuccessful()
            ->assertInertia(fn (Assert $page) => $page
                ->component('student/dashboard')
                ->has('election_summaries', 0)
                ->has('upcoming_election_summaries', 1)
                ->where('upcoming_election_summaries.0.title', 'May election')
                ->where('upcoming_election_summaries.0.election_status', 'scheduled')
                ->where('upcoming_election_summaries.0.opens_at_display', $expectedOpens));
    } finally {
        Carbon::setTestNow();
    }
});
