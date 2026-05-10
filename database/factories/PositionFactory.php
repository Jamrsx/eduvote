<?php

namespace Database\Factories;

use App\Models\Election;
use App\Models\Position;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Position>
 */
class PositionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'election_id' => Election::factory(),
            'name' => fake()->jobTitle(),
            'sort_order' => fake()->numberBetween(0, 50),
            'max_selections' => 1,
            'course_id' => null,
        ];
    }

    public function forCampus(): static
    {
        return $this->state(fn (array $attributes) => [
            'course_id' => null,
        ]);
    }

    public function forDepartment(int $courseId): static
    {
        return $this->state(fn (array $attributes) => [
            'course_id' => $courseId,
        ]);
    }
}
