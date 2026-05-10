<?php

namespace Database\Factories;

use App\Enums\ElectionStatus;
use App\Models\Candidate;
use App\Models\Election;
use App\Models\Position;
use App\Models\StudentProfile;
use App\Models\User;
use App\Models\Vote;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Vote>
 */
class VoteFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $election = Election::factory()->create([
            'opens_at' => now()->subHour(),
            'closes_at' => now()->addWeek(),
            'status' => ElectionStatus::Open,
        ]);

        $position = Position::factory()->for($election)->create([
            'course_id' => null,
        ]);

        $candidate = Candidate::query()->create([
            'election_id' => $election->id,
            'position_id' => $position->id,
            'full_name' => fake()->name(),
            'platform' => null,
            'course_id' => null,
            'party_id' => null,
            'sort_order' => 0,
            'photo_path' => null,
        ]);

        $user = User::factory()->student()->create();

        StudentProfile::factory()->for($user)->create();

        return [
            'election_id' => $election->id,
            'position_id' => $position->id,
            'user_id' => $user->id,
            'candidate_id' => $candidate->id,
        ];
    }
}
