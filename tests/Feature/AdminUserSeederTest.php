<?php

use App\Enums\UserRole;
use App\Models\User;
use Database\Seeders\AdminUserSeeder;
use Illuminate\Support\Facades\Hash;

test('admin user seeder creates or updates the default administrator', function () {
    $this->seed(AdminUserSeeder::class);

    $user = User::query()->where('email', 'admin@gmail.com')->first();

    expect($user)->not->toBeNull()
        ->and($user->role)->toBe(UserRole::Admin)
        ->and(Hash::check('admin123', $user->password))->toBeTrue();
});
