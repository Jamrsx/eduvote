<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class StudentAccountController extends Controller
{
    /**
     * Student accounts and profiles — accounts are created here (no public registration).
     */
    public function index(): Response
    {
        return Inertia::render('admin/students/index', [
            'breadcrumbs' => [
                ['title' => 'Admin', 'href' => route('admin.dashboard')],
                ['title' => 'Students', 'href' => route('admin.students.index')],
            ],
        ]);
    }
}
