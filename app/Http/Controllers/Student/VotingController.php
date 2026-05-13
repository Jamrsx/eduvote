<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Http\Requests\SaveStudentBallotProgressRequest;
use App\Http\Requests\StoreStudentBallotRequest;
use App\Models\Election;
use App\Services\Voting\StudentBallotService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class VotingController extends Controller
{
    /**
     * Open elections and ballot lines scoped to the student's program (plus campus-wide slates).
     */
    public function index(Request $request, StudentBallotService $ballots): Response|RedirectResponse
    {
        $user = $request->user();
        $user->loadMissing(['studentProfile.course:id,code,name']);

        $profile = $user->studentProfile;

        $electionCards = $ballots->buildElectionCardsFor($user);
        $ballotSplit = $ballots->ballotSplitEnabledForCards($electionCards);

        $requestedPhase = strtolower((string) $request->query('phase', 'campus'));
        $phase = $requestedPhase === 'program' ? 'program' : 'campus';

        if ($ballotSplit && $phase === 'program' && ! $ballots->allSplitBallotCampusSectionsComplete($electionCards)) {
            return redirect()->route('student.voting.index', [
                'phase' => 'campus',
            ]);
        }

        if (! $ballotSplit) {
            $phase = 'campus';
        }

        return Inertia::render('student/voting/index', [
            'breadcrumbs' => [
                ['title' => 'Student', 'href' => route('student.dashboard')],
                ['title' => 'Vote', 'href' => route('student.voting.index')],
            ],
            'elections' => $electionCards,
            'ballot_split' => $ballotSplit,
            'ballot_phase' => $phase,
            'student_course_label' => $profile?->course !== null
                ? "{$profile->course->code} — {$profile->course->name}"
                : null,
            'voter_scope_notice' => $profile !== null && $profile->course_id === null
                ? 'Campus-wide ballot lines only. Assign your program on your profile to see your department slate (e.g. BSIT, BSBA).'
                : null,
        ]);
    }

    public function store(
        StoreStudentBallotRequest $request,
        Election $election,
        StudentBallotService $ballots,
    ): RedirectResponse {
        /** @var array<int, array{position_id: int, candidate_id: int}> $selections */
        $selections = $request->validated('selections');

        $ballots->storeSelections($request->user(), $election, $selections);

        return redirect()
            ->route('student.voting.index')
            ->with('success', 'Your ballot was saved.');
    }

    /**
     * Autosave one or more ballot lines before the student submits a complete ballot.
     */
    public function saveProgress(
        SaveStudentBallotProgressRequest $request,
        Election $election,
        StudentBallotService $ballots,
    ): RedirectResponse {
        /** @var array<int, array{position_id: int, candidate_id: int}> $selections */
        $selections = $request->validated('selections');

        $ballots->saveBallotProgress($request->user(), $election, $selections);

        /** @var string|null $phase */
        $phase = $request->validated('phase');

        return redirect()->route('student.voting.index', [
            'phase' => in_array($phase, ['campus', 'program'], true) ? $phase : 'campus',
        ]);
    }
}
