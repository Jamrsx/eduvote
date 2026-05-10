<?php

namespace Database\Factories;

use App\Enums\ElectionStatus;
use App\Models\Election;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Election>
 */
class ElectionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'title' => fake()->sentence(3),
            'description' => fake()->optional()->paragraph(),
            'opens_at' => now()->subHour(),
            'closes_at' => now()->addWeek(),
            'status' => ElectionStatus::Open,
        ];
    }

    public function draft(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => ElectionStatus::Draft,
            'opens_at' => now()->addWeek(),
            'closes_at' => now()->addWeeks(2),
        ]);
    }

    public function acceptingNow(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => ElectionStatus::Open,
            'opens_at' => now()->subHour(),
            'closes_at' => now()->addWeek(),
        ]);
    }

    public function scheduled(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => ElectionStatus::Scheduled,
            'opens_at' => now()->addDay(),
            'closes_at' => now()->addWeek(),
        ]);
    }

    public function closed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => ElectionStatus::Closed,
            'opens_at' => now()->subWeeks(2),
            'closes_at' => now()->subWeek(),
        ]);
    }
}
