<?php

namespace App\Http\Controllers\Admin;

use App\Enums\StudentAccountStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;

class StudentRegistrationApprovalController extends Controller
{
    /**
     * Pending registrations are shown on the school roster page.
     */
    public function index(): RedirectResponse
    {
        return redirect()->route('admin.roster.index')->withFragment('pending');
    }

    public function approve(User $user): RedirectResponse
    {
        abort_unless(
            $user->role === UserRole::Student && $user->student_account_status === StudentAccountStatus::Pending,
            404,
        );

        $user->forceFill([
            'student_account_status' => StudentAccountStatus::Active,
        ])->save();

        return redirect()->route('admin.roster.index')
            ->withFragment('pending')
            ->with(
                'success',
                'Registration approved for '.$user->email.'.',
            );
    }

    public function reject(User $user): RedirectResponse
    {
        abort_unless(
            $user->role === UserRole::Student && $user->student_account_status === StudentAccountStatus::Pending,
            404,
        );

        $user->forceFill([
            'student_account_status' => StudentAccountStatus::Rejected,
        ])->save();

        return redirect()->route('admin.roster.index')
            ->withFragment('pending')
            ->with(
                'success',
                'Registration declined for '.$user->email.'.',
            );
    }
}
