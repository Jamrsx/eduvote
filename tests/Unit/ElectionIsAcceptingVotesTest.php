<?php

use App\Enums\ElectionStatus;
use App\Models\Election;
use Illuminate\Support\Carbon;
use Tests\TestCase;

uses(TestCase::class);

afterEach(function (): void {
    Carbon::setTestNow();
});

test('open election accepts votes after opens_at when app timezone matches wall-clock intent', function (): void {
    config(['app.timezone' => 'Asia/Manila']);

    $election = Election::factory()->make([
        'status' => ElectionStatus::Open,
        'opens_at' => Carbon::parse('2026-05-11 08:00:00', 'Asia/Manila'),
        'closes_at' => Carbon::parse('2026-05-12 17:00:00', 'Asia/Manila'),
    ]);

    Carbon::setTestNow(Carbon::parse('2026-05-11 08:27:00', 'Asia/Manila'));

    expect($election->isAcceptingVotes())->toBeTrue();
});

test('open election does not accept votes before opens_at in app timezone', function (): void {
    config(['app.timezone' => 'Asia/Manila']);

    $election = Election::factory()->make([
        'status' => ElectionStatus::Open,
        'opens_at' => Carbon::parse('2026-05-11 08:00:00', 'Asia/Manila'),
        'closes_at' => Carbon::parse('2026-05-12 17:00:00', 'Asia/Manila'),
    ]);

    Carbon::setTestNow(Carbon::parse('2026-05-11 07:59:00', 'Asia/Manila'));

    expect($election->isAcceptingVotes())->toBeFalse();
});
