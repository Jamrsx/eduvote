<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Services\Voting\StudentBallotService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StudentOfficersController extends Controller
{
    /**
     * Read-only nominees and platforms scoped to campus-wide seats plus the student's program.
     */
    public function index(Request $request, StudentBallotService $ballots): Response
    {
        $user = $request->user();
        $user->loadMissing(['studentProfile.course:id,code,name']);

        $profile = $user->studentProfile;

        return Inertia::render('student/officers/index', [
            'breadcrumbs' => [
                ['title' => 'Student', 'href' => route('student.dashboard')],
                ['title' => 'Nominees', 'href' => route('student.officers.index')],
            ],
            'elections' => $ballots->buildOfficersDirectoryFor($user),
            'student_course_label' => $profile?->course !== null
                ? "{$profile->course->code} — {$profile->course->name}"
                : null,
            'voter_scope_notice' => $profile !== null && $profile->course_id === null
                ? 'Only campus-wide slates appear until your profile lists a program (e.g. BSIT).'
                : null,
        ]);
    }
}
