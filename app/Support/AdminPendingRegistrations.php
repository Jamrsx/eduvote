<?php

namespace App\Support;

use App\Enums\StudentAccountStatus;
use App\Enums\UserRole;
use App\Models\SchoolRosterEntry;
use App\Models\User;

final class AdminPendingRegistrations
{
    /**
     * Self-registered students awaiting administrator approval (for roster UI).
     *
     * @return list<array<string, mixed>>
     */
    public static function rows(): array
    {
        return User::query()
            ->where('role', UserRole::Student)
            ->where('student_account_status', StudentAccountStatus::Pending)
            ->with(['studentProfile.course'])
            ->orderBy('created_at')
            ->get()
            ->map(fn (User $user): array => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'created_at' => $user->created_at?->format('M j, Y g:i A'),
                'student_id' => $user->studentProfile?->student_id,
                'course' => $user->studentProfile?->course !== null ? [
                    'code' => $user->studentProfile->course->code,
                    'name' => $user->studentProfile->course->name,
                ] : null,
                'section' => $user->studentProfile?->section,
                'year_level' => $user->studentProfile?->year_level,
                'matches_roster' => $user->studentProfile !== null
                    && SchoolRosterEntry::matchesStudentVerification(
                        $user->studentProfile->student_id,
                        $user->email,
                    ),
            ])
            ->values()
            ->all();
    }
}
