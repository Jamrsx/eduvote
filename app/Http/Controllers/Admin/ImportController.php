<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class ImportController extends Controller
{
    /**
     * Bulk student imports (batches) — CSV or structured uploads.
     */
    public function index(): Response
    {
        return Inertia::render('admin/imports/index', [
            'breadcrumbs' => [
                ['title' => 'Admin', 'href' => route('admin.dashboard')],
                ['title' => 'Imports', 'href' => route('admin.imports.index')],
            ],
        ]);
    }
}
