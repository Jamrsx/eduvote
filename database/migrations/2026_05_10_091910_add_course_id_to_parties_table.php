<?php

use App\Models\Party;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Adds {@see Party::$course_id} for existing databases that ran
     * `create_parties_table` before that column existed. Skips if already present
     * (e.g. fresh migrate after the create migration was updated).
     */
    public function up(): void
    {
        if (Schema::hasColumn('parties', 'course_id')) {
            return;
        }

        Schema::table('parties', function (Blueprint $table): void {
            $table->foreignId('course_id')
                ->nullable()
                ->after('election_id')
                ->constrained()
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (! Schema::hasColumn('parties', 'course_id')) {
            return;
        }

        Schema::table('parties', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('course_id');
        });
    }
};
