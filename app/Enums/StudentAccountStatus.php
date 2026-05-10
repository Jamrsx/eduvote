<?php

namespace App\Enums;

enum StudentAccountStatus: string
{
    case Pending = 'pending';
    case Active = 'active';
    case Rejected = 'rejected';
    case Disabled = 'disabled';
}
