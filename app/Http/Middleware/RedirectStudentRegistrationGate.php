<?php

namespace App\Http\Middleware;

use App\Enums\StudentAccountStatus;
use App\Enums\UserRole;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RedirectStudentRegistrationGate
{
    /**
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user === null || $user->role !== UserRole::Student) {
            return $next($request);
        }

        $status = $user->student_account_status;

        if ($status === StudentAccountStatus::Disabled) {
            if ($request->routeIs(['student.account-disabled', 'logout'])) {
                return $next($request);
            }

            return redirect()->route('student.account-disabled');
        }

        if ($status === null || $status === StudentAccountStatus::Active) {
            return $next($request);
        }

        if ($status === StudentAccountStatus::Rejected) {
            if ($request->routeIs(['student.registration-rejected', 'logout'])) {
                return $next($request);
            }

            return redirect()->route('student.registration-rejected');
        }

        if ($status === StudentAccountStatus::Pending) {
            if ($request->routeIs(['student.registration-pending', 'logout'])) {
                return $next($request);
            }

            return redirect()->route('student.registration-pending');
        }

        return $next($request);
    }
}
