<?php

namespace App\Services\Voting;

use App\Enums\UserRole;
use App\Models\Candidate;
use App\Models\Position;
use App\Models\User;

final class VoterEligibilityChecker
{
    /**
     * Whether the voter may cast a ballot for this position (campus vs department rules).
     */
    public function mayVoteForPosition(User $voter, Position $position): bool
    {
        if ($voter->role !== UserRole::Student) {
            return false;
        }

        $election = $position->election;
        if (! $election->isAcceptingVotes()) {
            return false;
        }

        $profile = $voter->studentProfile;
        if ($profile === null) {
            return false;
        }

        if ($position->isCampusWide()) {
            return true;
        }

        return (int) $profile->course_id === (int) $position->course_id;
    }

    /**
     * Candidate must belong to the same election as the position; party (if any) must match election.
     */
    public function candidateMatchesBallot(Candidate $candidate, Position $position): bool
    {
        if ((int) $candidate->election_id !== (int) $position->election_id) {
            return false;
        }

        if ((int) $candidate->position_id !== (int) $position->id) {
            return false;
        }

        if ($candidate->party_id !== null) {
            $party = $candidate->party;
            if ($party === null || (int) $party->election_id !== (int) $position->election_id) {
                return false;
            }
        }

        return true;
    }
}
