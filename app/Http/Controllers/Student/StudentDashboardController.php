<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Services\Voting\StudentBallotService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StudentDashboardController extends Controller
{
    /**
     * Student home: summaries of open elections and ballot completion state.
     */
    public function __invoke(Request $request, StudentBallotService $ballots): Response
    {
        $user = $request->user();
        $user->loadMissing(['studentProfile.course:id,code,name']);

        $profile = $user->studentProfile;

        return Inertia::render('student/dashboard', [
            'breadcrumbs' => [
                ['title' => 'Student', 'href' => route('student.dashboard')],
                ['title' => 'Dashboard', 'href' => route('student.dashboard')],
            ],
            'election_summaries' => $ballots->buildDashboardElectionSummariesFor($user),
            'upcoming_election_summaries' => $ballots->buildDashboardUpcomingElectionSummariesFor($user),
            'student_course_label' => $profile?->course !== null
                ? "{$profile->course->code} — {$profile->course->name}"
                : null,
        ]);
    }
}
