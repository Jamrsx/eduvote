<?php

namespace Database\Factories;

use App\Models\StudentImportBatch;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<StudentImportBatch>
 */
class StudentImportBatchFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory()->admin(),
            'filename' => fake()->word().'.csv',
            'row_count' => fake()->numberBetween(1, 500),
        ];
    }
}
