<?php

namespace App\Http\Responses;

use App\Enums\StudentAccountStatus;
use App\Enums\UserRole;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;
use Symfony\Component\HttpFoundation\Response;

class LoginResponse implements LoginResponseContract
{
    public function toResponse($request): Response
    {
        $user = $request->user();

        if ($user === null) {
            return redirect()->intended(route('dashboard'));
        }

        if ($user->role === UserRole::Admin) {
            return redirect()->intended(route('admin.dashboard'));
        }

        if ($user->role === UserRole::Student) {
            if ($user->student_account_status === StudentAccountStatus::Disabled) {
                return redirect()->intended(route('student.account-disabled'));
            }

            if ($user->student_account_status === StudentAccountStatus::Pending) {
                return redirect()->intended(route('student.registration-pending'));
            }

            if ($user->student_account_status === StudentAccountStatus::Rejected) {
                return redirect()->intended(route('student.registration-rejected'));
            }

            return redirect()->intended(route('student.dashboard'));
        }

        return redirect()->intended(route('dashboard'));
    }
}
