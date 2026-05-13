<?php

namespace App\Http\Middleware;

use App\Services\Elections\ElectionScheduleStatusSynchronizer;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class SynchronizeElectionStatusesFromSchedule
{
    public function __construct(
        private ElectionScheduleStatusSynchronizer $electionScheduleStatusSynchronizer,
    ) {}

    /**
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $this->electionScheduleStatusSynchronizer->sync();

        return $next($request);
    }
}
