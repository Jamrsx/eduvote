<?php

use App\Models\User;

test('admin can view admin section index pages', function () {
    $admin = User::factory()->admin()->create();
    $this->actingAs($admin);

    foreach ([
        'admin.courses.index',
        'admin.elections.index',
        'admin.students.index',
        'admin.imports.index',
        'admin.voting.index',
    ] as $routeName) {
        $this->get(route($routeName))->assertOk();
    }
});

test('students cannot view admin section index pages', function () {
    $student = User::factory()->student()->create();
    $this->actingAs($student);

    foreach ([
        'admin.courses.index',
        'admin.elections.index',
        'admin.students.index',
        'admin.imports.index',
        'admin.voting.index',
    ] as $routeName) {
        $this->get(route($routeName))->assertForbidden();
    }
});
