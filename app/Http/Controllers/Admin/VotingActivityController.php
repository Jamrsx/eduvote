<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class VotingActivityController extends Controller
{
    /**
     * Ballots cast and turnout — read-only reporting over votes.
     */
    public function index(): Response
    {
        return Inertia::render('admin/voting/index', [
            'breadcrumbs' => [
                ['title' => 'Admin', 'href' => route('admin.dashboard')],
                ['title' => 'Ballots', 'href' => route('admin.voting.index')],
            ],
        ]);
    }
}
