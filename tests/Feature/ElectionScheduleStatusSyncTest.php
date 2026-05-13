<?php

use App\Enums\ElectionStatus;
use App\Models\Election;
use App\Models\User;
use App\Services\Elections\ElectionScheduleStatusSynchronizer;
use Illuminate\Support\Carbon;

afterEach(function (): void {
    Carbon::setTestNow();
});

test('web middleware sync promotes scheduled election to open inside the window', function (): void {
    config(['app.timezone' => 'Asia/Manila']);

    Carbon::setTestNow(Carbon::parse('2026-05-15 10:00:00', 'Asia/Manila'));

    $election = Election::factory()->create([
        'status' => ElectionStatus::Scheduled,
        'opens_at' => Carbon::parse('2026-05-15 08:00:00', 'Asia/Manila'),
        'closes_at' => Carbon::parse('2026-05-15 17:00:00', 'Asia/Manila'),
    ]);

    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->get(route('admin.elections.index'))
        ->assertOk();

    expect($election->fresh()->status)->toBe(ElectionStatus::Open);
});

test('synchronizer closes election after closes_at', function (): void {
    config(['app.timezone' => 'Asia/Manila']);

    Carbon::setTestNow(Carbon::parse('2026-05-15 18:00:00', 'Asia/Manila'));

    $election = Election::factory()->create([
        'status' => ElectionStatus::Open,
        'opens_at' => Carbon::parse('2026-05-15 08:00:00', 'Asia/Manila'),
        'closes_at' => Carbon::parse('2026-05-15 17:00:00', 'Asia/Manila'),
    ]);

    app(ElectionScheduleStatusSynchronizer::class)->sync();

    expect($election->fresh()->status)->toBe(ElectionStatus::Closed);
});

test('synchronizer reopens closed status when still inside voting window', function (): void {
    config(['app.timezone' => 'Asia/Manila']);

    Carbon::setTestNow(Carbon::parse('2026-05-13 08:07:00', 'Asia/Manila'));

    $election = Election::factory()->create([
        'status' => ElectionStatus::Closed,
        'opens_at' => Carbon::parse('2026-05-13 08:06:00', 'Asia/Manila'),
        'closes_at' => Carbon::parse('2026-05-13 20:12:00', 'Asia/Manila'),
    ]);

    app(ElectionScheduleStatusSynchronizer::class)->sync();

    expect($election->fresh()->status)->toBe(ElectionStatus::Open);
});

test('synchronizer does not change draft elections', function (): void {
    config(['app.timezone' => 'Asia/Manila']);

    Carbon::setTestNow(Carbon::parse('2026-05-15 10:00:00', 'Asia/Manila'));

    $election = Election::factory()->draft()->create([
        'opens_at' => Carbon::parse('2026-05-15 08:00:00', 'Asia/Manila'),
        'closes_at' => Carbon::parse('2026-05-15 17:00:00', 'Asia/Manila'),
    ]);

    app(ElectionScheduleStatusSynchronizer::class)->sync();

    expect($election->fresh()->status)->toBe(ElectionStatus::Draft);
});
