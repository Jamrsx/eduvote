<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BallotSubmission extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'election_id',
        'user_id',
    ];

    /**
     * @return BelongsTo<Election, $this>
     */
    public function election(): BelongsTo
    {
        return $this->belongsTo(Election::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
