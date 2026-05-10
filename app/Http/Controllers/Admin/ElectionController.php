<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class ElectionController extends Controller
{
    /**
     * Elections — schedule windows, statuses, and ballot configuration.
     */
    public function index(): Response
    {
        return Inertia::render('admin/elections/index', [
            'breadcrumbs' => [
                ['title' => 'Admin', 'href' => route('admin.dashboard')],
                ['title' => 'Elections', 'href' => route('admin.elections.index')],
            ],
        ]);
    }
}
