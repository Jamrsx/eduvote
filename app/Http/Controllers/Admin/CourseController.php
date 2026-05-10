<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCourseRequest;
use App\Http\Requests\UpdateCourseRequest;
use App\Models\Course;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class CourseController extends Controller
{
    /**
     * Academic programs (courses) — used for student enrollment, candidates, and department-scoped positions.
     */
    public function index(): Response
    {
        $this->authorize('viewAny', Course::class);

        $courses = Course::query()
            ->withCount('studentProfiles')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(fn (Course $course): array => [
                'id' => $course->id,
                'code' => $course->code,
                'name' => $course->name,
                'sort_order' => $course->sort_order,
                'student_profiles_count' => $course->student_profiles_count,
            ]);

        return Inertia::render('admin/courses/index', [
            'breadcrumbs' => [
                ['title' => 'Admin', 'href' => route('admin.dashboard')],
                ['title' => 'Programs', 'href' => route('admin.courses.index')],
            ],
            'courses' => $courses,
        ]);
    }

    public function store(StoreCourseRequest $request): RedirectResponse
    {
        $this->authorize('create', Course::class);

        $data = $request->validated();
        if (! array_key_exists('sort_order', $data)) {
            $data['sort_order'] = 0;
        }

        Course::query()->create($data);

        return redirect()->route('admin.courses.index')->with('success', 'Program added.');
    }

    public function update(UpdateCourseRequest $request, Course $course): RedirectResponse
    {
        $this->authorize('update', $course);

        $data = $request->validated();
        if (! array_key_exists('sort_order', $data)) {
            $data['sort_order'] = $course->sort_order;
        }

        $course->update($data);

        return redirect()->route('admin.courses.index')->with('success', 'Program updated.');
    }

    public function destroy(Course $course): RedirectResponse
    {
        $this->authorize('delete', $course);

        if ($course->studentProfiles()->exists()) {
            return redirect()
                ->route('admin.courses.index')
                ->withErrors([
                    'course' => 'Cannot delete this program while students are enrolled in it.',
                ]);
        }

        $course->delete();

        return redirect()->route('admin.courses.index')->with('success', 'Program removed.');
    }
}
