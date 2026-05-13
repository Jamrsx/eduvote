<?php

namespace App\Console\Commands;

use App\Services\Elections\ElectionScheduleStatusSynchronizer;
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
    public function handle(ElectionScheduleStatusSynchronizer $synchronizer): int
    {
        $synchronizer->sync();

        return self::SUCCESS;
    }
}
