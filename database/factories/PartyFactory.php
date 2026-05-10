<?php

namespace Database\Factories;

use App\Models\Election;
use App\Models\Party;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Party>
 */
class PartyFactory extends Factory
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
            'course_id' => null,
            'name' => fake()->company(),
            'short_name' => fake()->optional()->lexify('???'),
            'sort_order' => fake()->numberBetween(0, 20),
            'logo_path' => null,
        ];
    }
}
