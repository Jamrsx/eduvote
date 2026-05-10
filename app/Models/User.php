<?php

namespace App\Models;

use App\Enums\StudentAccountStatus;
use App\Enums\UserRole;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;

#[Fillable(['name', 'email', 'password', 'role', 'student_account_status'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'role' => UserRole::class,
            'student_account_status' => StudentAccountStatus::class,
        ];
    }

    public function isApprovedStudent(): bool
    {
        if ($this->role !== UserRole::Student) {
            return false;
        }

        if ($this->student_account_status === StudentAccountStatus::Disabled) {
            return false;
        }

        return $this->student_account_status === null
            || $this->student_account_status === StudentAccountStatus::Active;
    }

    public function hasDisabledStudentAccount(): bool
    {
        return $this->role === UserRole::Student
            && $this->student_account_status === StudentAccountStatus::Disabled;
    }

    public function hasRejectedStudentRegistration(): bool
    {
        return $this->role === UserRole::Student
            && $this->student_account_status === StudentAccountStatus::Rejected;
    }

    public function hasPendingStudentRegistration(): bool
    {
        return $this->role === UserRole::Student
            && $this->student_account_status === StudentAccountStatus::Pending;
    }

    /**
     * @return HasOne<StudentProfile, $this>
     */
    public function studentProfile(): HasOne
    {
        return $this->hasOne(StudentProfile::class);
    }

    /**
     * @return HasMany<Vote, $this>
     */
    public function votes(): HasMany
    {
        return $this->hasMany(Vote::class);
    }

    /**
     * @return HasMany<StudentImportBatch, $this>
     */
    public function studentImportBatches(): HasMany
    {
        return $this->hasMany(StudentImportBatch::class);
    }
}
