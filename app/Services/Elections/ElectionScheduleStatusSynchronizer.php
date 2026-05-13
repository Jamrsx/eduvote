<?php

namespace App\Services\Elections;

use App\Enums\ElectionStatus;
use App\Models\Election;

final class ElectionScheduleStatusSynchronizer
{
    /**
     * Align stored election status with opens_at / closes_at for every election
     * except drafts. Includes rows currently marked closed so a corrected schedule
     * or an earlier mistaken close can move back to scheduled/open when appropriate.
     */
    public function sync(): void
    {
        $now = now();

        Election::query()
            ->where('status', '!=', ElectionStatus::Draft)
            ->whereNotNull('opens_at')
            ->whereNotNull('closes_at')
            ->each(function (Election $election) use ($now): void {
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
    }
}
