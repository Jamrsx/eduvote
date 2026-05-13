<?php

namespace App\Http\Middleware;

use App\Enums\UserRole;
use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\View;
use Symfony\Component\HttpFoundation\Response;

class HandleAppearance
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        $studentForcedDark = $user instanceof User && $user->role === UserRole::Student;

        $appearance = $studentForcedDark
            ? 'dark'
            : ($request->cookie('appearance') ?? 'system');

        View::share('appearance', $appearance);
        View::share('studentForcedDark', $studentForcedDark);

        return $next($request);
    }
}
