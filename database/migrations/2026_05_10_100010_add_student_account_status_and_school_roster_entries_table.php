<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('student_account_status', 32)->nullable()->after('role')->index();
        });

        Schema::create('school_roster_entries', function (Blueprint $table) {
            $table->id();
            $table->string('student_id');
            $table->string('email')->nullable();
            $table->string('full_name')->nullable();
            $table->timestamps();

            $table->unique('student_id');
            $table->index('email');
        });

        DB::table('users')
            ->where('role', 'student')
            ->whereNull('student_account_status')
            ->update(['student_account_status' => 'active']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('school_roster_entries');

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('student_account_status');
        });
    }
};
