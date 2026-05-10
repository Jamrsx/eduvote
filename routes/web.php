<?php

use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\CourseController;
use App\Http\Controllers\Admin\ElectionController;
use App\Http\Controllers\Admin\ElectionResultController;
use App\Http\Controllers\Admin\PartyController;
use App\Http\Controllers\Admin\SchoolRosterController;
use App\Http\Controllers\Admin\StudentAccountController;
use App\Http\Controllers\Admin\StudentRegistrationApprovalController;
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
    Route::post('elections', [ElectionController::class, 'store'])->name('elections.store');
    Route::patch('elections/{election}', [ElectionController::class, 'update'])->name('elections.update');
    Route::delete('elections/{election}', [ElectionController::class, 'destroy'])->name('elections.destroy');
    Route::get('parties', [PartyController::class, 'index'])->name('parties.index');
    Route::post('elections/{election}/parties', [PartyController::class, 'store'])->name('elections.parties.store');
    Route::patch('elections/{election}/parties/{party}', [PartyController::class, 'update'])->name('elections.parties.update');
    Route::delete('elections/{election}/parties/{party}', [PartyController::class, 'destroy'])->name('elections.parties.destroy');
    Route::post('elections/{election}/parties/{party}/candidates', [PartyController::class, 'storeSlateCandidate'])->name('elections.parties.candidates.store');
    Route::patch('elections/{election}/parties/{party}/candidates/{candidate}', [PartyController::class, 'updateSlateCandidate'])->name('elections.parties.candidates.update');
    Route::delete('elections/{election}/parties/{party}/candidates/{candidate}', [PartyController::class, 'destroySlateCandidate'])->name('elections.parties.candidates.destroy');
    Route::get('students', [StudentAccountController::class, 'index'])->name('students.index');
    Route::post('students', [StudentAccountController::class, 'store'])->name('students.store');
    Route::get('students/accounts', [StudentAccountController::class, 'accounts'])->name('students.accounts');
    Route::post('students/accounts/email-all', [StudentAccountController::class, 'emailCredentialsToAll'])->name('students.accounts.email-all');
    Route::post('students/accounts/{user}/email-credentials', [StudentAccountController::class, 'emailStudentCredentials'])->name('students.accounts.email-credentials');
    Route::post('students/{user}/disable-account', [StudentAccountController::class, 'disableStudentAccount'])->name('students.disable-account');
    Route::post('students/{user}/enable-account', [StudentAccountController::class, 'enableStudentAccount'])->name('students.enable-account');
    Route::get('students/imports/template', [StudentAccountController::class, 'downloadTemplate'])->name('students.imports.template');
    Route::post('students/import', [StudentAccountController::class, 'importStudents'])->name('students.import');
    Route::get('students/pending', [StudentRegistrationApprovalController::class, 'index'])->name('students.pending');
    Route::post('students/pending/{user}/approve', [StudentRegistrationApprovalController::class, 'approve'])->name('students.pending.approve');
    Route::post('students/pending/{user}/reject', [StudentRegistrationApprovalController::class, 'reject'])->name('students.pending.reject');
    Route::get('roster', [SchoolRosterController::class, 'index'])->name('roster.index');
    Route::get('roster/master-list', [SchoolRosterController::class, 'masterList'])->name('roster.master-list');
    Route::get('roster/template', [SchoolRosterController::class, 'downloadTemplate'])->name('roster.template');
    Route::post('roster/import', [SchoolRosterController::class, 'import'])->name('roster.import');
    Route::delete('roster/{school_roster_entry}', [SchoolRosterController::class, 'destroy'])->name('roster.destroy');
    Route::get('imports', fn (): RedirectResponse => redirect()->route('admin.students.index'));
    Route::get('result', [ElectionResultController::class, 'index'])->name('result.index');
    Route::get('voting', fn (): RedirectResponse => redirect()->route('admin.result.index'))->name('voting.index');
});

Route::middleware(['auth', 'verified', 'student'])->prefix('student')->name('student.')->group(function () {
    Route::get('pending-registration', fn () => Inertia::render('student/pending-registration', [
        'breadcrumbs' => [
            ['title' => 'Approval pending', 'href' => route('student.registration-pending')],
        ],
    ]))->name('registration-pending');

    Route::get('registration-rejected', fn () => Inertia::render('student/registration-rejected', [
        'breadcrumbs' => [
            ['title' => 'Not approved', 'href' => route('student.registration-rejected')],
        ],
    ]))->name('registration-rejected');

    Route::get('account-disabled', fn () => Inertia::render('student/account-disabled', [
        'breadcrumbs' => [
            ['title' => 'Account disabled', 'href' => route('student.account-disabled')],
        ],
    ]))->name('account-disabled');

    Route::get('dashboard', fn () => Inertia::render('student/dashboard', [
        'breadcrumbs' => [
            ['title' => 'Student', 'href' => route('student.dashboard')],
            ['title' => 'Dashboard', 'href' => route('student.dashboard')],
        ],
    ]))->name('dashboard');
});

require __DIR__.'/settings.php';
