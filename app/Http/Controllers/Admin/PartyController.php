<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePartyRequest;
use App\Http\Requests\StorePartySlateCandidateRequest;
use App\Http\Requests\UpdatePartyRequest;
use App\Http\Requests\UpdatePartySlateCandidateRequest;
use App\Models\Candidate;
use App\Models\Course;
use App\Models\Election;
use App\Models\Party;
use App\Models\Position;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class PartyController extends Controller
{
    /**
     * Political / organizational groups per election, with nominees listed on each slate.
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
                'parties' => function ($query): void {
                    $query
                        ->with('course:id,code,name')
                        ->orderBy('sort_order')
                        ->orderBy('name')
                        ->with([
                            'candidates' => function ($cq): void {
                                $cq->with(['position.course', 'course'])
                                    ->orderBy('sort_order')
                                    ->orderBy('full_name');
                            },
                        ]);
                },
            ])
            ->orderByDesc('closes_at')
            ->get()
            ->map(fn (Election $election): array => [
                'id' => $election->id,
                'title' => $election->title,
                'status' => $election->status->value,
                'parties' => $election->parties->map(fn (Party $party): array => [
                    'id' => $party->id,
                    'name' => $party->name,
                    'short_name' => $party->short_name,
                    'sort_order' => $party->sort_order,
                    'course_id' => $party->course_id,
                    'course' => $party->course !== null ? [
                        'id' => $party->course->id,
                        'code' => $party->course->code,
                        'name' => $party->course->name,
                    ] : null,
                    'scope_label' => $party->course !== null
                        ? "{$party->course->code} — {$party->course->name}"
                        : 'Campus-wide',
                    'candidates' => $party->candidates->map(fn (Candidate $candidate): array => [
                        'id' => $candidate->id,
                        'full_name' => $candidate->full_name,
                        'position_name' => $candidate->position->name,
                        'department' => self::formatDepartment(
                            $candidate->course,
                            $candidate->position->course,
                        ),
                        'platform' => $candidate->platform,
                        'candidate_course_id' => $candidate->course_id,
                    ])->values()->all(),
                ])->values()->all(),
            ])
            ->values()
            ->all();

        return Inertia::render('admin/parties/index', [
            'breadcrumbs' => [
                ['title' => 'Admin', 'href' => route('admin.dashboard')],
                ['title' => 'Parties', 'href' => route('admin.parties.index')],
            ],
            'courses' => $courses,
            'elections' => $elections,
        ]);
    }

    public function store(StorePartyRequest $request, Election $election): RedirectResponse
    {
        $this->authorize('update', $election);

        $data = $request->validated();
        if (($data['sort_order'] ?? null) === null) {
            $data['sort_order'] = (int) ($election->parties()->max('sort_order') ?? -1) + 1;
        }

        $election->parties()->create($data);

        return redirect()->route('admin.parties.index')->with('success', 'Party added.');
    }

    public function update(UpdatePartyRequest $request, Election $election, Party $party): RedirectResponse
    {
        $this->authorize('update', $election);
        abort_unless((int) $party->election_id === (int) $election->id, 404);

        $party->update($request->validated());

        return redirect()->route('admin.parties.index')->with('success', 'Party updated.');
    }

    public function destroy(Election $election, Party $party): RedirectResponse
    {
        $this->authorize('update', $election);
        abort_unless((int) $party->election_id === (int) $election->id, 404);

        $party->delete();

        return redirect()->route('admin.parties.index')->with('success', 'Party removed.');
    }

    public function storeSlateCandidate(StorePartySlateCandidateRequest $request, Election $election, Party $party): RedirectResponse
    {
        $this->authorize('update', $election);
        abort_unless((int) $party->election_id === (int) $election->id, 404);

        $data = $request->validated();
        $position = $this->findOrCreatePositionForPartySlate(
            $election,
            $party,
            $data['position_name'],
        );

        $courseId = $data['course_id'] ?? null;
        if ($party->course_id !== null) {
            $courseId = $party->course_id;
        }

        $sortOrder = (int) ($position->candidates()->max('sort_order') ?? -1) + 1;

        $position->candidates()->create([
            'election_id' => $election->id,
            'full_name' => $data['full_name'],
            'platform' => $data['platform'] ?? null,
            'course_id' => $courseId,
            'party_id' => $party->id,
            'sort_order' => $sortOrder,
        ]);

        return redirect()->route('admin.parties.index')->with('success', 'Nominee added to this party slate.');
    }

    public function updateSlateCandidate(UpdatePartySlateCandidateRequest $request, Election $election, Party $party, Candidate $candidate): RedirectResponse
    {
        $this->authorize('update', $election);
        abort_unless((int) $party->election_id === (int) $election->id, 404);
        abort_unless((int) $candidate->election_id === (int) $election->id, 404);
        abort_unless((int) ($candidate->party_id ?? 0) === (int) $party->id, 404);

        $data = $request->validated();
        $position = $this->findOrCreatePositionForPartySlate(
            $election,
            $party,
            $data['position_name'],
        );

        $courseId = $data['course_id'] ?? null;
        if ($party->course_id !== null) {
            $courseId = $party->course_id;
        }

        $candidate->update([
            'position_id' => $position->id,
            'full_name' => $data['full_name'],
            'platform' => $data['platform'] ?? null,
            'course_id' => $courseId,
        ]);

        return redirect()->route('admin.parties.index')->with('success', 'Nominee updated.');
    }

    public function destroySlateCandidate(Election $election, Party $party, Candidate $candidate): RedirectResponse
    {
        $this->authorize('update', $election);
        abort_unless((int) $party->election_id === (int) $election->id, 404);
        abort_unless((int) $candidate->election_id === (int) $election->id, 404);
        abort_unless((int) ($candidate->party_id ?? 0) === (int) $party->id, 404);

        if ($candidate->votes()->exists()) {
            return redirect()
                ->route('admin.parties.index')
                ->withErrors([
                    'ballot' => 'Cannot remove a nominee after votes have been recorded for them.',
                ]);
        }

        $candidate->delete();

        return redirect()->route('admin.parties.index')->with('success', 'Nominee removed.');
    }

    /**
     * Match an existing ballot line or create one so nominees stay tied to the {@see Position} table.
     * Name + election + program scope (same as the party) defines uniqueness.
     */
    private function findOrCreatePositionForPartySlate(
        Election $election,
        Party $party,
        string $positionName,
    ): Position {
        return Position::query()->firstOrCreate(
            [
                'election_id' => $election->id,
                'name' => $positionName,
                'course_id' => $party->course_id,
            ],
            [
                'sort_order' => (int) ($election->positions()->max('sort_order') ?? -1) + 1,
                'max_selections' => 1,
            ],
        );
    }

    private static function formatDepartment(?Course $candidateCourse, ?Course $positionCourse): string
    {
        $course = $candidateCourse ?? $positionCourse;
        if ($course === null) {
            return 'Campus-wide';
        }

        return "{$course->code} — {$course->name}";
    }
}
