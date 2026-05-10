<?php

namespace App\Console\Commands;

use App\Enums\ElectionStatus;
use App\Models\Election;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('elections:sync-statuses')]
#[Description('Update election status from opens_at / closes_at (skips draft and closed records).')]
class SyncElectionStatusesCommand extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        Election::query()
            ->whereNotIn('status', [ElectionStatus::Draft, ElectionStatus::Closed])
            ->each(function (Election $election): void {
                $now = now();

                if ($now->greaterThan($election->closes_at)) {
                    $election->update(['status' => ElectionStatus::Closed]);

                    return;
                }

                if ($now->greaterThanOrEqualTo($election->opens_at) && $now->lessThanOrEqualTo($election->closes_at)) {
                    $election->update(['status' => ElectionStatus::Open]);

                    return;
                }

                if ($now->lessThan($election->opens_at)) {
                    $election->update(['status' => ElectionStatus::Scheduled]);
                }
            });

        return self::SUCCESS;
    }
}
