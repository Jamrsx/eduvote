<?php

namespace Database\Factories;

use App\Models\Course;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<StudentProfile>
 */
class StudentProfileFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory()->student(),
            'student_id' => fake()->unique()->numerify('########'),
            'course_id' => Course::factory(),
            'section' => fake()->optional()->bothify('?##'),
            'year_level' => fake()->optional()->randomElement(['1', '2', '3', '4']),
        ];
    }
}
