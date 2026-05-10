<?php

namespace App\Http\Controllers\Admin;

use App\Enums\ElectionStatus;
use App\Http\Controllers\Controller;
use App\Models\Election;
use App\Models\Vote;
use Inertia\Inertia;
use Inertia\Response;

class ElectionResultController extends Controller
{
    /**
     * Official tallies for closed elections (read-only).
     */
    public function index(): Response
    {
        $this->authorize('viewAny', Election::class);

        $elections = Election::query()
            ->with([
                'positions' => function ($query): void {
                    $query
                        ->with('course:id,code,name')
                        ->orderBy('sort_order')
                        ->orderBy('name')
                        ->with([
                            'candidates' => function ($cq): void {
                                $cq->with('party:id,name')
                                    ->orderBy('sort_order')
                                    ->orderBy('full_name');
                            },
                        ]);
                },
            ])
            ->latest('closes_at')
            ->get();

        $electionIds = $elections->pluck('id')->all();

        $distinctVotersByElection = [];
        $totalSelectionsByElection = [];
        $tallyByElectionPositionCandidate = [];

        if ($electionIds !== []) {
            $distinctVotersByElection = Vote::query()
                ->whereIn('election_id', $electionIds)
                ->selectRaw('election_id, COUNT(DISTINCT user_id) as c')
                ->groupBy('election_id')
                ->pluck('c', 'election_id')
                ->mapWithKeys(fn ($count, $id): array => [(int) $id => (int) $count])
                ->all();

            $totalSelectionsByElection = Vote::query()
                ->whereIn('election_id', $electionIds)
                ->selectRaw('election_id, COUNT(*) as c')
                ->groupBy('election_id')
                ->pluck('c', 'election_id')
                ->mapWithKeys(fn ($count, $id): array => [(int) $id => (int) $count])
                ->all();

            $rows = Vote::query()
                ->whereIn('election_id', $electionIds)
                ->selectRaw('election_id, position_id, candidate_id, COUNT(*) as vote_count')
                ->groupBy('election_id', 'position_id', 'candidate_id')
                ->get();

            foreach ($rows as $row) {
                $eid = (int) $row->election_id;
                $pid = (int) $row->position_id;
                $cid = (int) $row->candidate_id;
                $tallyByElectionPositionCandidate[$eid][$pid][$cid] = (int) $row->vote_count;
            }
        }

        $payload = $elections->map(function (Election $election) use ($distinctVotersByElection, $totalSelectionsByElection, $tallyByElectionPositionCandidate): array {
            $eid = $election->id;
            $resultsVisible = $election->status === ElectionStatus::Closed;

            $positions = $election->positions->map(function ($position) use ($eid, $resultsVisible, $tallyByElectionPositionCandidate): array {
                $scopeLabel = $position->course_id === null
                    ? 'Campus-wide'
                    : ($position->course !== null
                        ? "{$position->course->code} — {$position->course->name}"
                        : 'Program race');

                $lines = [];
                $sumVotes = 0;
                $votesByCandidateId = [];

                foreach ($position->candidates as $candidate) {
                    $v = $resultsVisible
                        ? ($tallyByElectionPositionCandidate[$eid][$position->id][$candidate->id] ?? 0)
                        : 0;
                    $votesByCandidateId[$candidate->id] = $v;
                    $sumVotes += $v;
                }

                $maxVotes = $votesByCandidateId === [] ? 0 : max($votesByCandidateId);

                foreach ($position->candidates as $candidate) {
                    $voteCount = $votesByCandidateId[$candidate->id] ?? 0;
                    $pct = $resultsVisible && $sumVotes > 0
                        ? round(100 * ($voteCount / $sumVotes), 1)
                        : null;

                    $lines[] = [
                        'candidate_id' => $candidate->id,
                        'full_name' => $candidate->full_name,
                        'party_name' => $candidate->party?->name ?? null,
                        'photo_url' => $candidate->photoPublicUrl(),
                        'votes' => $voteCount,
                        'percent' => $pct,
                        'leading' => $resultsVisible && $maxVotes > 0 && $voteCount === $maxVotes,
                    ];
                }

                usort($lines, function (array $a, array $b): int {
                    if ($a['votes'] !== $b['votes']) {
                        return $b['votes'] <=> $a['votes'];
                    }

                    return strcmp($a['full_name'], $b['full_name']);
                });

                return [
                    'id' => $position->id,
                    'name' => $position->name,
                    'scope_label' => $scopeLabel,
                    'course_id' => $position->course_id !== null ? (int) $position->course_id : null,
                    'department_code' => $position->course?->code,
                    'department_name' => $position->course?->name,
                    'total_votes' => $resultsVisible ? $sumVotes : null,
                    'lines' => $lines,
                ];
            })->values()->all();

            return [
                'id' => $election->id,
                'title' => $election->title,
                'status' => $election->status->value,
                'closes_at_display' => $election->closes_at?->format('M j, Y g:i A'),
                'results_visible' => $resultsVisible,
                'distinct_voters' => (int) ($distinctVotersByElection[$eid] ?? 0),
                'total_selections' => (int) ($totalSelectionsByElection[$eid] ?? 0),
                'positions' => $positions,
            ];
        })->values()->all();

        return Inertia::render('admin/result/index', [
            'breadcrumbs' => [
                ['title' => 'Admin', 'href' => route('admin.dashboard')],
                ['title' => 'Election results', 'href' => route('admin.result.index')],
            ],
            'elections' => $payload,
            'appTimezone' => config('app.timezone'),
        ]);
    }
}
