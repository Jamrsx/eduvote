<?php

use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function (): RedirectResponse {
    if (auth()->check()) {
        return redirect()->route('dashboard');
    }

    return redirect()->route('login');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', fn () => Inertia::render('dashboard', [
        'breadcrumbs' => [
            ['title' => 'Dashboard', 'href' => route('dashboard')],
        ],
    ]))->name('dashboard');
});

Route::middleware(['auth', 'verified', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('dashboard', fn () => Inertia::render('admin/dashboard', [
        'breadcrumbs' => [
            ['title' => 'Admin', 'href' => route('admin.dashboard')],
            ['title' => 'Dashboard', 'href' => route('admin.dashboard')],
        ],
    ]))->name('dashboard');
});

Route::middleware(['auth', 'verified', 'student'])->prefix('student')->name('student.')->group(function () {
    Route::get('dashboard', fn () => Inertia::render('student/dashboard', [
        'breadcrumbs' => [
            ['title' => 'Student', 'href' => route('student.dashboard')],
            ['title' => 'Dashboard', 'href' => route('student.dashboard')],
        ],
    ]))->name('dashboard');
});

require __DIR__.'/settings.php';
