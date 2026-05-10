<?php

namespace Database\Factories;

use App\Models\Candidate;
use App\Models\Election;
use App\Models\Position;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Candidate>
 */
class CandidateFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $election = Election::factory()->create();
        $position = Position::factory()->for($election)->create();

        return [
            'election_id' => $election->id,
            'position_id' => $position->id,
            'full_name' => fake()->name(),
            'platform' => fake()->optional()->paragraph(),
            'course_id' => null,
            'party_id' => null,
            'sort_order' => fake()->numberBetween(0, 20),
            'photo_path' => null,
        ];
    }

    public function forBallot(Election $election, Position $position): static
    {
        return $this->state(fn (array $attributes) => [
            'election_id' => $election->id,
            'position_id' => $position->id,
        ]);
    }
}
