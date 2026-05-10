<?php

namespace App\Models;

use App\Enums\ElectionStatus;
use Database\Factories\ElectionFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

class Election extends Model
{
    /** @use HasFactory<ElectionFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'title',
        'description',
        'opens_at',
        'closes_at',
        'status',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'opens_at' => 'datetime',
            'closes_at' => 'datetime',
            'status' => ElectionStatus::class,
        ];
    }

    /**
     * Whether students may browse the nominees directory (scheduled / open), independent of vote window.
     */
    public function allowsNomineeDirectoryListing(): bool
    {
        return ! in_array($this->status, [ElectionStatus::Draft, ElectionStatus::Closed], true);
    }

    /**
     * Whether voters may cast ballots at the given moment (status + time window).
     */
    public function isAcceptingVotes(?\DateTimeInterface $at = null): bool
    {
        $moment = $at !== null ? Carbon::parse($at) : now();

        if (in_array($this->status, [ElectionStatus::Draft, ElectionStatus::Closed], true)) {
            return false;
        }

        return $moment->greaterThanOrEqualTo($this->opens_at)
            && $moment->lessThanOrEqualTo($this->closes_at);
    }

    /**
     * @return HasMany<Position, $this>
     */
    public function positions(): HasMany
    {
        return $this->hasMany(Position::class);
    }

    /**
     * @return HasMany<Party, $this>
     */
    public function parties(): HasMany
    {
        return $this->hasMany(Party::class);
    }

    /**
     * @return HasMany<Candidate, $this>
     */
    public function candidates(): HasMany
    {
        return $this->hasMany(Candidate::class);
    }

    /**
     * @return HasMany<Vote, $this>
     */
    public function votes(): HasMany
    {
        return $this->hasMany(Vote::class);
    }
}
