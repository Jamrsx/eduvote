<?php

use App\Enums\ElectionStatus;
use App\Models\Course;
use App\Models\Election;
use App\Models\Position;
use App\Models\User;
use App\Models\Vote;
use App\Services\Voting\VoterEligibilityChecker;
use Illuminate\Database\QueryException;

test('duplicate vote for the same position and election is rejected', function () {
    $vote = Vote::factory()->create();

    expect(fn () => Vote::query()->create([
        'election_id' => $vote->election_id,
        'position_id' => $vote->position_id,
        'user_id' => $vote->user_id,
        'candidate_id' => $vote->candidate_id,
    ]))->toThrow(QueryException::class);
});

test('deleting an election removes dependent votes', function () {
    $vote = Vote::factory()->create();
    $electionId = $vote->election_id;

    expect(Vote::query()->where('election_id', $electionId)->count())->toBe(1);

    Election::query()->whereKey($electionId)->delete();

    expect(Vote::query()->count())->toBe(0);
});

test('campus-wide position allows any student with a profile when election is open', function () {
    $election = Election::factory()->acceptingNow()->create();
    $position = Position::factory()->for($election)->create(['course_id' => null]);

    $course = Course::factory()->create();
    $user = User::factory()->student()->create();
    $user->studentProfile()->create([
        'student_id' => 'S-10001',
        'course_id' => $course->id,
    ]);

    $checker = app(VoterEligibilityChecker::class);

    expect($checker->mayVoteForPosition($user, $position))->toBeTrue();
});

test('department position allows only students in that course', function () {
    $election = Election::factory()->acceptingNow()->create();
    $bsit = Course::factory()->create(['code' => 'BSIT', 'name' => 'BSIT']);
    $bsba = Course::factory()->create(['code' => 'BSBA', 'name' => 'BSBA']);

    $position = Position::factory()->for($election)->create([
        'course_id' => $bsit->id,
    ]);

    $bsitStudent = User::factory()->student()->create();
    $bsitStudent->studentProfile()->create([
        'student_id' => 'S-20001',
        'course_id' => $bsit->id,
    ]);

    $bsbaStudent = User::factory()->student()->create();
    $bsbaStudent->studentProfile()->create([
        'student_id' => 'S-20002',
        'course_id' => $bsba->id,
    ]);

    $checker = app(VoterEligibilityChecker::class);

    expect($checker->mayVoteForPosition($bsitStudent, $position))->toBeTrue();
    expect($checker->mayVoteForPosition($bsbaStudent, $position))->toBeFalse();
});

test('admins cannot use student ballot eligibility', function () {
    $election = Election::factory()->acceptingNow()->create();
    $position = Position::factory()->for($election)->create(['course_id' => null]);

    $admin = User::factory()->admin()->create();

    $checker = app(VoterEligibilityChecker::class);

    expect($checker->mayVoteForPosition($admin, $position))->toBeFalse();
});

test('elections sync command opens scheduled elections in the voting window', function () {
    $election = Election::query()->create([
        'title' => 'Student Government',
        'description' => null,
        'opens_at' => now()->subMinute(),
        'closes_at' => now()->addHour(),
        'status' => ElectionStatus::Scheduled,
    ]);

    $this->artisan('elections:sync-statuses');

    $election->refresh();

    expect($election->status)->toBe(ElectionStatus::Open);
});

test('vote policy allows students with a profile to create votes', function () {
    $user = User::factory()->student()->create();
    $user->studentProfile()->create([
        'student_id' => 'S-30001',
        'course_id' => Course::factory()->create()->id,
    ]);

    expect($user->can('create', Vote::class))->toBeTrue();
});

test('vote policy denies students without a profile', function () {
    $user = User::factory()->student()->create();

    expect($user->can('create', Vote::class))->toBeFalse();
});

test('election policy allows only admins to create elections', function () {
    $admin = User::factory()->admin()->create();
    $student = User::factory()->student()->create();

    expect($admin->can('create', Election::class))->toBeTrue();
    expect($student->can('create', Election::class))->toBeFalse();
});
