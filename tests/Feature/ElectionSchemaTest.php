<?php

use Illuminate\Support\Facades\Schema;

test('election domain tables exist after migrations', function () {
    expect(Schema::hasTable('courses'))->toBeTrue();
    expect(Schema::hasTable('student_profiles'))->toBeTrue();
    expect(Schema::hasTable('elections'))->toBeTrue();
    expect(Schema::hasTable('positions'))->toBeTrue();
    expect(Schema::hasTable('parties'))->toBeTrue();
    expect(Schema::hasTable('candidates'))->toBeTrue();
    expect(Schema::hasTable('votes'))->toBeTrue();
    expect(Schema::hasTable('student_import_batches'))->toBeTrue();
});

test('users table has role column', function () {
    expect(Schema::hasColumn('users', 'role'))->toBeTrue();
});
