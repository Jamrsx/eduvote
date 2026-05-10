<?php

use App\Models\Course;
use App\Models\StudentProfile;
use App\Models\User;

test('admin can create a course', function () {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)->post(route('admin.courses.store'), [
        'code' => 'BSIT',
        'name' => 'BS Information Technology',
        'sort_order' => 10,
    ]);

    $response->assertRedirect(route('admin.courses.index'));
    $this->assertDatabaseHas('courses', [
        'code' => 'BSIT',
        'name' => 'BS Information Technology',
        'sort_order' => 10,
    ]);
});

test('admin can update a course', function () {
    $admin = User::factory()->admin()->create();
    $course = Course::factory()->create(['code' => 'OLD', 'name' => 'Old Name']);

    $response = $this->actingAs($admin)->patch(route('admin.courses.update', $course), [
        'code' => 'NEW',
        'name' => 'New Name',
        'sort_order' => 5,
    ]);

    $response->assertRedirect(route('admin.courses.index'));
    expect($course->fresh()->code)->toBe('NEW')
        ->and($course->fresh()->name)->toBe('New Name')
        ->and($course->fresh()->sort_order)->toBe(5);
});

test('admin cannot delete a course with enrolled students', function () {
    $admin = User::factory()->admin()->create();
    $course = Course::factory()->create();
    StudentProfile::factory()->create(['course_id' => $course->id]);

    $response = $this->actingAs($admin)->delete(route('admin.courses.destroy', $course));

    $response->assertRedirect(route('admin.courses.index'));
    $response->assertSessionHasErrors('course');
    $this->assertDatabaseHas('courses', ['id' => $course->id]);
});

test('admin can delete a course with no student profiles', function () {
    $admin = User::factory()->admin()->create();
    $course = Course::factory()->create();

    $response = $this->actingAs($admin)->delete(route('admin.courses.destroy', $course));

    $response->assertRedirect(route('admin.courses.index'));
    $this->assertDatabaseMissing('courses', ['id' => $course->id]);
});

test('course code must be unique on create', function () {
    $admin = User::factory()->admin()->create();
    Course::factory()->create(['code' => 'DUP']);

    $response = $this->actingAs($admin)->post(route('admin.courses.store'), [
        'code' => 'DUP',
        'name' => 'Duplicate',
        'sort_order' => 0,
    ]);

    $response->assertSessionHasErrors('code');
});
