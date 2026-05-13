<?php

namespace App\Http\Controllers\Admin;

use App\Enums\ElectionStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\BallotSubmission;
use App\Models\Candidate;
use App\Models\Course;
use App\Models\Election;
use App\Models\Position;
use App\Models\StudentProfile;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class AdminDashboardController extends Controller
{
    /**
     * Admin overview: counts and recently updated elections.
     */
    public function __invoke(): Response
    {
        $electionStatusCounts = Election::query()
            ->selectRaw('status, count(*) as aggregate')
            ->groupBy('status')
            ->pluck('aggregate', 'status')
            ->all();

        $electionsByStatus = collect(ElectionStatus::cases())
            ->mapWithKeys(fn (ElectionStatus $status): array => [
                $status->value => (int) ($electionStatusCounts[$status->value] ?? 0),
            ])
            ->all();

        return Inertia::render('admin/dashboard', [
            'breadcrumbs' => [
                ['title' => 'Admin', 'href' => route('admin.dashboard')],
                ['title' => 'Dashboard', 'href' => route('admin.dashboard')],
            ],
            'stats' => [
                'elections' => [
                    'total' => Election::query()->count(),
                    'byStatus' => $electionsByStatus,
                ],
                'students' => [
                    'accounts' => User::query()->where('role', UserRole::Student)->count(),
                    'withProfile' => StudentProfile::query()->count(),
                ],
                'votesCast' => BallotSubmission::query()->count(),
                'courses' => Course::query()->count(),
                'candidates' => Candidate::query()->count(),
                'positions' => Position::query()->count(),
            ],
            'recentElections' => Election::query()
                ->latest('updated_at')
                ->limit(5)
                ->get()
                ->map(fn (Election $election): array => [
                    'id' => $election->id,
                    'title' => $election->title,
                    'status' => $election->status->value,
                    'opens_at_display' => $election->opens_at?->format('M j, Y g:i A'),
                    'closes_at_display' => $election->closes_at?->format('M j, Y g:i A'),
                ])
                ->values()
                ->all(),
        ]);
    }
}
