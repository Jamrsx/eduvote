<?php

namespace App\Models;

use Database\Factories\SchoolRosterEntryFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SchoolRosterEntry extends Model
{
    /** @use HasFactory<SchoolRosterEntryFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'student_id',
        'email',
        'full_name',
    ];

    /**
     * Whether this roster row matches a student profile + account email for admin verification.
     */
    public static function matchesStudentVerification(string $studentId, ?string $accountEmail): bool
    {
        $studentId = trim($studentId);

        $byId = self::query()->where('student_id', $studentId)->exists();

        if ($byId) {
            return true;
        }

        if ($accountEmail === null || $accountEmail === '') {
            return false;
        }

        $normalized = strtolower(trim($accountEmail));

        return self::query()
            ->whereNotNull('email')
            ->whereRaw('LOWER(TRIM(email)) = ?', [$normalized])
            ->exists();
    }
}
