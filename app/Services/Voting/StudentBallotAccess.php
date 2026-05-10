<?php

namespace App\Services\Voting;

use App\Models\Candidate;
use App\Models\Party;

final class StudentBallotAccess
{
    /**
     * Campus-wide slates are visible to every voter; program slates only when the voter's course matches.
     *
     * @param  int|null  $studentCourseId  {@see StudentProfile::course_id}
     */
    public static function partyIsVisibleToVoter(?int $studentCourseId, Party $party): bool
    {
        if ($party->isCampusWide()) {
            return true;
        }

        return $studentCourseId !== null
            && (int) $party->course_id === (int) $studentCourseId;
    }

    /**
     * Nominees without a party are still shown if the race is otherwise open to the voter.
     */
    public static function candidateNomineeIsVisibleToVoter(?int $studentCourseId, Candidate $candidate): bool
    {
        if ($candidate->party_id === null) {
            return true;
        }

        $party = $candidate->party;

        return $party !== null && self::partyIsVisibleToVoter($studentCourseId, $party);
    }
}
