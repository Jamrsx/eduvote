<?php

use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\CourseController;
use App\Http\Controllers\Admin\ElectionController;
use App\Http\Controllers\Admin\ImportController;
use App\Http\Controllers\Admin\StudentAccountController;
use App\Http\Controllers\Admin\VotingActivityController;
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
    Route::get('dashboard', AdminDashboardController::class)->name('dashboard');
    Route::get('courses', [CourseController::class, 'index'])->name('courses.index');
    Route::post('courses', [CourseController::class, 'store'])->name('courses.store');
    Route::patch('courses/{course}', [CourseController::class, 'update'])->name('courses.update');
    Route::delete('courses/{course}', [CourseController::class, 'destroy'])->name('courses.destroy');
    Route::get('elections', [ElectionController::class, 'index'])->name('elections.index');
    Route::get('students', [StudentAccountController::class, 'index'])->name('students.index');
    Route::get('imports', [ImportController::class, 'index'])->name('imports.index');
    Route::get('voting', [VotingActivityController::class, 'index'])->name('voting.index');
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
