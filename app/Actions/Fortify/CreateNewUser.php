<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Enums\StudentAccountStatus;
use App\Enums\UserRole;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules, ProfileValidationRules;

    /**
     * Validate and create a newly registered student account (pending administrator approval).
     *
     * @param  array<string, mixed>  $input
     */
    public function create(array $input): User
    {
        Validator::make($input, [
            ...$this->profileRules(),
            'password' => $this->passwordRules(),
            'student_id' => ['required', 'string', 'max:255', Rule::unique('student_profiles', 'student_id')],
            'course_id' => ['required', 'integer', 'exists:courses,id'],
            'section' => ['nullable', 'string', 'max:255'],
            'year_level' => ['nullable', 'string', 'max:255'],
        ], [], [
            'student_id' => 'student ID',
            'course_id' => 'program',
            'year_level' => 'year level',
        ])->validate();

        return DB::transaction(function () use ($input): User {
            $user = User::query()->create([
                'name' => $input['name'],
                'email' => $input['email'],
                'password' => $input['password'],
                'role' => UserRole::Student,
                'student_account_status' => StudentAccountStatus::Pending,
                'email_verified_at' => now(),
            ]);

            StudentProfile::query()->create([
                'user_id' => $user->id,
                'student_id' => $input['student_id'],
                'course_id' => (int) $input['course_id'],
                'section' => $input['section'] ?? null,
                'year_level' => $input['year_level'] ?? null,
            ]);

            return $user;
        });
    }
}
