<?php

namespace Database\Factories;

use App\Models\SchoolRosterEntry;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SchoolRosterEntry>
 */
class SchoolRosterEntryFactory extends Factory
{
    protected $model = SchoolRosterEntry::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'student_id' => fake()->unique()->bothify('####-#####'),
            'email' => fake()->optional(0.7)->safeEmail(),
            'full_name' => fake()->optional()->name(),
        ];
    }
}
