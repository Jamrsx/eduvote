<?php

namespace App\Enums;

enum UserRole: string
{
    case Admin = 'admin';
    case Student = 'student';

    public function isAdmin(): bool
    {
        return $this === self::Admin;
    }

    public function isStudent(): bool
    {
        return $this === self::Student;
    }
}
