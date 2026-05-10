<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreBallotCandidateRequest;
use App\Http\Requests\StoreBallotPositionRequest;
use App\Http\Requests\UpdateBallotCandidateRequest;
use App\Http\Requests\UpdateBallotPositionRequest;
use App\Models\Candidate;
use App\Models\Course;
use App\Models\Election;
use App\Models\Position;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ElectionBallotController extends Controller
{
    /**
     * Ballot setup: positions and candidates grouped by election.
     */
    public function index(): Response
    {
        $this->authorize('viewAny', Election::class);

        $courses = Course::query()
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(fn (Course $course): array => [
                'id' => $course->id,
                'code' => $course->code,
                'name' => $course->name,
            ])
            ->values()
            ->all();

        $elections = Election::query()
            ->with([
                'positions' => function ($query): void {
                    $query->withCount(['votes'])->with([
                        'course:id,code,name',
                        'candidates' => function ($q): void {
                            $q->withCount(['votes'])
                                ->orderBy('sort_order')
                                ->orderBy('full_name');
                        },
                    ])
                        ->orderBy('sort_order')
                        ->orderBy('name');
                },
            ])
            ->orderByDesc('closes_at')
            ->get()
            ->map(fn (Election $election): array => [
                'id' => $election->id,
                'title' => $election->title,
                'status' => $election->status->value,
                'positions' => $election->positions->map(fn (Position $position): array => [
                    'id' => $position->id,
                    'name' => $position->name,
                    'sort_order' => $position->sort_order,
                    'max_selections' => $position->max_selections,
                    'course_id' => $position->course_id,
                    'course' => $position->course !== null ? [
                        'id' => $position->course->id,
                        'code' => $position->course->code,
                        'name' => $position->course->name,
                    ] : null,
                    'votes_count' => $position->votes_count,
                    'candidates' => $position->candidates->map(fn (Candidate $candidate): array => [
                        'id' => $candidate->id,
                        'full_name' => $candidate->full_name,
                        'platform' => $candidate->platform,
                        'sort_order' => $candidate->sort_order,
                        'votes_count' => $candidate->votes_count,
                        'course_id' => $candidate->course_id,
                    ])->values()->all(),
                ])->values()->all(),
            ])
            ->values()
            ->all();

        return Inertia::render('admin/candidates/index', [
            'breadcrumbs' => [
                ['title' => 'Admin', 'href' => route('admin.dashboard')],
                ['title' => 'Candidates', 'href' => route('admin.candidates.index')],
            ],
            'elections' => $elections,
            'courses' => $courses,
        ]);
    }

    public function storePosition(StoreBallotPositionRequest $request, Election $election): RedirectResponse
    {
        $this->authorize('update', $election);

        $data = $request->validated();
        if (($data['sort_order'] ?? null) === null) {
            $data['sort_order'] = (int) ($election->positions()->max('sort_order') ?? -1) + 1;
        }
        if (($data['max_selections'] ?? null) === null) {
            $data['max_selections'] = 1;
        }

        $election->positions()->create($data);

        return redirect()->route('admin.candidates.index')->with('success', 'Position added.');
    }

    public function updatePosition(UpdateBallotPositionRequest $request, Election $election, Position $position): RedirectResponse
    {
        $this->authorize('update', $election);
        abort_unless((int) $position->election_id === (int) $election->id, 404);

        $position->update($request->validated());

        return redirect()->route('admin.candidates.index')->with('success', 'Position updated.');
    }

    public function destroyPosition(Election $election, Position $position): RedirectResponse
    {
        $this->authorize('update', $election);
        abort_unless((int) $position->election_id === (int) $election->id, 404);

        if ($position->votes()->exists()) {
            return redirect()
                ->route('admin.candidates.index')
                ->withErrors([
                    'ballot' => 'Cannot remove a position after votes have been cast for it.',
                ]);
        }

        $position->delete();

        return redirect()->route('admin.candidates.index')->with('success', 'Position removed.');
    }

    public function storeCandidate(StoreBallotCandidateRequest $request, Election $election, Position $position): RedirectResponse
    {
        $this->authorize('update', $election);
        abort_unless((int) $position->election_id === (int) $election->id, 404);

        $data = $request->validated();
        if (! array_key_exists('sort_order', $data)) {
            $data['sort_order'] = (int) ($position->candidates()->max('sort_order') ?? -1) + 1;
        }

        $position->candidates()->create(array_merge($data, [
            'election_id' => $election->id,
        ]));

        return redirect()->route('admin.candidates.index')->with('success', 'Candidate added.');
    }

    public function updateCandidate(UpdateBallotCandidateRequest $request, Election $election, Candidate $candidate): RedirectResponse
    {
        $this->authorize('update', $election);
        abort_unless((int) $candidate->election_id === (int) $election->id, 404);

        $candidate->update($request->validated());

        return redirect()->route('admin.candidates.index')->with('success', 'Candidate updated.');
    }

    public function destroyCandidate(Election $election, Candidate $candidate): RedirectResponse
    {
        $this->authorize('update', $election);
        abort_unless((int) $candidate->election_id === (int) $election->id, 404);

        if ($candidate->votes()->exists()) {
            return redirect()
                ->route('admin.candidates.index')
                ->withErrors([
                    'ballot' => 'Cannot remove a candidate after votes have been recorded.',
                ]);
        }

        $candidate->delete();

        return redirect()->route('admin.candidates.index')->with('success', 'Candidate removed.');
    }
}
