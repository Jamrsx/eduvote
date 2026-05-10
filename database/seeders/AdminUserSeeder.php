<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Seeder;

class AdminUserSeeder extends Seeder
{
    /**
     * Ensure a default administrator account exists (idempotent).
     *
     * Override via ADMIN_EMAIL, ADMIN_PASSWORD, and ADMIN_NAME in the environment.
     */
    public function run(): void
    {
        $email = (string) env('ADMIN_EMAIL', 'admin@gmail.com');
        $password = (string) env('ADMIN_PASSWORD', 'admin123');
        $name = (string) env('ADMIN_NAME', 'Administrator');

        User::query()->updateOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'password' => $password,
                'role' => UserRole::Admin,
                'email_verified_at' => now(),
            ],
        );
    }
}
