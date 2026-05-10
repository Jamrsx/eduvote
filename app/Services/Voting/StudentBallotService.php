<?php

namespace App\Services\Voting;

use App\Enums\ElectionStatus;
use App\Models\Candidate;
use App\Models\Election;
use App\Models\Position;
use App\Models\User;
use App\Models\Vote;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

final class StudentBallotService
{
    public function __construct(
        private VoterEligibilityChecker $eligibility,
    ) {}

    /** @return list<array<string, mixed>> */
    public function buildElectionCardsFor(User $user): array
    {
        /** @var list<array<string, mixed>> */
        return $this->openElectionsAcceptingVotes()
            ->map(fn (Election $election): array => $this->serializeElectionCard($user, $election))
            ->filter(static fn (array $card): bool => ($card['races'] !== []) || ($card['ballot_locked'] === true))
            ->values()
            ->all();
    }

    /**
     * Offices and nominees visible to the student (campus-wide + their program slates).
     *
     * @return list<array<string, mixed>>
     */
    public function buildOfficersDirectoryFor(User $user): array
    {
        $user->loadMissing(['studentProfile.course:id,code,name']);

        /** @var list<array<string, mixed>> */
        return $this->electionsVisibleForOfficersDirectory()
            ->map(fn (Election $election): array => $this->serializeElectionOfficersDirectory($user, $election))
            ->filter(static fn (array $card): bool => ($card['offices'] ?? []) !== [])
            ->values()
            ->all();
    }

    /**
     * Scheduled and open elections: students may browse nominee lists before the vote window opens.
     *
     * @return Collection<int, Election>
     */
    private function electionsVisibleForOfficersDirectory(): Collection
    {
        return Election::query()
            ->whereIn('status', [ElectionStatus::Scheduled, ElectionStatus::Open])
            ->with([
                'positions' => function ($query): void {
                    $query
                        ->with('course:id,code,name')
                        ->orderBy('sort_order')
                        ->orderBy('name')
                        ->with([
                            'candidates' => function ($cq): void {
                                $cq->with('party:id,name,short_name,course_id,election_id,sort_order')
                                    ->orderBy('sort_order')
                                    ->orderBy('full_name');
                            },
                        ]);
                },
            ])
            ->orderByDesc('closes_at')
            ->get()
            ->values();
    }

    /**
     * @return Collection<int, Election>
     */
    private function openElectionsAcceptingVotes(): Collection
    {
        return Election::query()
            ->where('status', ElectionStatus::Open)
            ->with([
                'positions' => function ($query): void {
                    $query
                        ->with('course:id,code,name')
                        ->orderBy('sort_order')
                        ->orderBy('name')
                        ->with([
                            'candidates' => function ($cq): void {
                                $cq->with('party:id,name,short_name,course_id,election_id,sort_order')
                                    ->orderBy('sort_order')
                                    ->orderBy('full_name');
                            },
                        ]);
                },
            ])
            ->orderByDesc('closes_at')
            ->get()
            ->filter(fn (Election $e): bool => $e->isAcceptingVotes())
            ->values();
    }

    /**
     * Short election rows for the student dashboard (reuse full ballot serialization).
     *
     * @return list<array<string, mixed>>
     */
    public function buildDashboardElectionSummariesFor(User $user): array
    {
        return array_values(array_map(
            static function (array $card): array {
                return [
                    'id' => $card['id'],
                    'title' => $card['title'],
                    'description' => $card['description'],
                    'opens_at_display' => $card['opens_at_display'] ?? null,
                    'closes_at_display' => $card['closes_at_display'],
                    'ballot_locked' => $card['ballot_locked'],
                    'status_label' => $card['ballot_locked'] === true
                        ? 'Ballot submitted'
                        : 'Needs your vote',
                    'status_detail' => $card['ballot_locked'] === true
                        ? 'Your choices are recorded. You cannot change them.'
                        : 'Open the Vote page to complete every office on your ballot.',
                ];
            },
            $this->buildElectionCardsFor($user),
        ));
    }

    /**
     * Public voting schedule rows for the student dashboard.
     *
     * Lists every {@see ElectionStatus::Scheduled} election plus any
     * {@see ElectionStatus::Open} election whose `opens_at` is in the future
     * (so the window is announced even before the time block actually starts).
     *
     * Independent of candidate visibility on purpose: the goal is to show
     * **when voting starts**, even if positions or nominees have not been
     * filed yet for that student's program.
     *
     * @return list<array<string, mixed>>
     */
    public function buildDashboardUpcomingElectionSummariesFor(User $user): array
    {
        $user->loadMissing(['studentProfile.course:id,code,name']);

        $elections = Election::query()
            ->whereIn('status', [ElectionStatus::Scheduled, ElectionStatus::Open])
            ->orderBy('opens_at')
            ->orderBy('id')
            ->get()
            ->filter(static fn (Election $election): bool => ! $election->isAcceptingVotes())
            ->values();

        /** @var list<array<string, mixed>> $rows */
        $rows = [];

        foreach ($elections as $election) {
            $rows[] = [
                'id' => (int) $election->id,
                'title' => $election->title,
                'description' => $election->description,
                'election_status' => $election->status->value,
                'opens_at_display' => $election->opens_at !== null
                    ? $election->opens_at->timezone(config('app.timezone'))->format('M j, Y g:i A')
                    : null,
                'closes_at_display' => $election->closes_at !== null
                    ? $election->closes_at->timezone(config('app.timezone'))->format('M j, Y g:i A')
                    : null,
                'status_label' => 'Voting not open yet',
                'status_detail' => 'Voting will open on the date shown. Review nominees and platforms on the Nominees page; cast your ballot on the Vote page once voting starts.',
            ];
        }

        return $rows;
    }

    /** @throws ValidationException */
    public function storeSelections(User $user, Election $election, array $selections): void
    {
        $allowedMap = $this->assertBallotIsEditableByVoter($user, $election);

        $this->assertSelectionsCoverEligibleOffices($selections, $allowedMap);

        foreach ($selections as $row) {
            if (! is_array($row)) {
                throw ValidationException::withMessages([
                    'selections' => 'Invalid ballot row.',
                ]);
            }

            $this->assertValidBallotRow($user, $election, $allowedMap, $row);
        }

        $this->persistBallotRows($user, $election, $selections);
    }

    /**
     * Saves one or more choices while the ballot is still incomplete so progress survives refresh.
     *
     * @param  list<array{position_id: mixed, candidate_id: mixed}>  $selections
     *
     * @throws ValidationException
     */
    public function saveBallotProgress(User $user, Election $election, array $selections): void
    {
        if ($selections === []) {
            throw ValidationException::withMessages([
                'selections' => 'Nothing to save.',
            ]);
        }

        $allowedMap = $this->assertBallotIsEditableByVoter($user, $election);

        foreach ($selections as $row) {
            if (! is_array($row)) {
                throw ValidationException::withMessages([
                    'selections' => 'Invalid ballot row.',
                ]);
            }

            $this->assertValidBallotRow($user, $election, $allowedMap, $row);
        }

        $this->persistBallotRows($user, $election, $selections);
    }

    /**
     * @return array<int, list<int>>
     *
     * @throws ValidationException
     */
    private function assertBallotIsEditableByVoter(User $user, Election $election): array
    {
        if ($election->status !== ElectionStatus::Open || ! $election->isAcceptingVotes()) {
            throw ValidationException::withMessages([
                'selections' => 'This election is not accepting votes.',
            ]);
        }

        $election->loadMissing([
            'positions.candidates.party:id,name,sort_order,course_id,election_id',
        ]);

        $allowedMap = $this->allowedCandidatesByPosition($user, $election);

        if ($this->ballotIsLocked($user, $election, $allowedMap)) {
            throw ValidationException::withMessages([
                'selections' => 'You already submitted your ballot for this election. Choices cannot be changed.',
            ]);
        }

        return $allowedMap;
    }

    /**
     * @param  array<int, list<int>>  $allowedMap
     * @param  array{position_id?: mixed, candidate_id?: mixed}  $row
     *
     * @throws ValidationException
     */
    private function assertValidBallotRow(User $user, Election $election, array $allowedMap, array $row): void
    {
        $positionId = (int) ($row['position_id'] ?? 0);
        $candidateId = (int) ($row['candidate_id'] ?? 0);

        if ($positionId <= 0 || $candidateId <= 0) {
            throw ValidationException::withMessages([
                'selections' => 'Invalid ballot row.',
            ]);
        }

        $allowedIds = $allowedMap[$positionId] ?? [];

        if (! in_array($candidateId, $allowedIds, true)) {
            throw ValidationException::withMessages([
                'selections' => 'This choice is not allowed for your account.',
            ]);
        }

        $candidate = Candidate::query()->find($candidateId);

        if ($candidate === null
            || (int) $candidate->election_id !== (int) $election->id
            || (int) $candidate->position_id !== $positionId) {
            throw ValidationException::withMessages([
                'selections' => 'Invalid candidate for this ballot line.',
            ]);
        }

        $positionModel = $election->positions->firstWhere('id', $positionId);
        if ($positionModel === null
            || ! $this->eligibility->candidateMatchesBallot($candidate, $positionModel)) {
            throw ValidationException::withMessages([
                'selections' => 'Invalid candidate.',
            ]);
        }
    }

    /**
     * @param  list<array{position_id: mixed, candidate_id: mixed}>  $selections
     */
    private function persistBallotRows(User $user, Election $election, array $selections): void
    {
        DB::transaction(function () use ($user, $election, $selections): void {
            foreach ($selections as $row) {
                Vote::query()->updateOrCreate(
                    [
                        'election_id' => $election->id,
                        'user_id' => $user->id,
                        'position_id' => (int) $row['position_id'],
                    ],
                    ['candidate_id' => (int) $row['candidate_id']],
                );
            }
        });
    }

    /**
     * True when the voter has a stored choice for every ballot line they are eligible for.
     *
     * @param  array<int, list<int>>  $allowedMap
     */
    public function ballotIsLocked(User $user, Election $election, ?array $allowedMap = null): bool
    {
        if ($allowedMap === null) {
            $allowedMap = $this->allowedCandidatesByPosition($user, $election);
        }

        /** @var list<int> $eligible */
        $eligible = array_values(array_map(
            static fn (int|string $positionId): int => (int) $positionId,
            array_keys($allowedMap),
        ));
        if ($eligible === []) {
            return false;
        }

        sort($eligible);

        /** @var list<int> $votedPositions */
        $votedPositions = Vote::query()
            ->where('election_id', $election->id)
            ->where('user_id', $user->id)
            ->whereIn('position_id', $eligible)
            ->pluck('position_id')
            ->map(static fn ($id): int => (int) $id)
            ->unique()
            ->sort()
            ->values()
            ->all();

        return $votedPositions === $eligible;
    }

    /**
     * @param  array<int, list<int>>  $allowedMap
     */
    private function assertSelectionsCoverEligibleOffices(array $selections, array $allowedMap): void
    {
        /** @var list<int> $eligible */
        $eligible = array_values(array_map(
            static fn (int|string $positionId): int => (int) $positionId,
            array_keys($allowedMap),
        ));
        sort($eligible);

        /** @var list<int> $submitted */
        $submitted = collect($selections)
            ->map(static fn (mixed $row): int => (int) (is_array($row) ? ($row['position_id'] ?? 0) : 0))
            ->sort()
            ->values()
            ->all();

        if ($submitted !== $eligible) {
            throw ValidationException::withMessages([
                'selections' => 'Submit a complete ballot: choose one nominee for every office on your ballot.',
            ]);
        }
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function committedRacesPayload(User $user, Election $election, array $allowedMap): array
    {
        $election->loadMissing(['positions.course']);

        $votes = Vote::query()
            ->where('election_id', $election->id)
            ->where('user_id', $user->id)
            ->with(['candidate.party:id,name,short_name,course_id'])
            ->whereIn('position_id', array_keys($allowedMap))
            ->get();

        /** @var list<array<string, mixed>> $rows */
        $rows = [];

        foreach ($votes as $vote) {
            $position = $election->positions->firstWhere('id', $vote->position_id);
            if ($position === null) {
                continue;
            }

            $candidate = $vote->candidate;
            if ($candidate === null) {
                continue;
            }

            $party = $candidate->party;
            $scopeLabel = $position->course_id === null
                ? 'Campus-wide'
                : ($position->course !== null
                    ? "{$position->course->code} — {$position->course->name}"
                    : 'Program race');

            $rows[] = [
                'position_id' => (int) $position->id,
                'name' => $position->name,
                'scope_label' => $scopeLabel,
                'full_name' => $candidate->full_name,
                'party_name' => $party?->name ?? 'Independent',
                'party_short_name' => $party?->short_name,
                'photo_url' => $candidate->photo_path !== null
                    ? Storage::disk('public')->url($candidate->photo_path)
                    : null,
                'platform' => $candidate->platform,
            ];
        }

        usort($rows, static function (array $a, array $b): int {
            $scope = strcmp($a['scope_label'], $b['scope_label']);
            if ($scope !== 0) {
                return $scope;
            }

            return strcmp($a['name'], $b['name']);
        });

        return $rows;
    }

    /**
     * @return array<int, list<int>> position id => ordered candidate IDs the voter may select
     */
    public function allowedCandidatesByPosition(User $user, Election $election, bool $forNomineeDirectoryListing = false): array
    {
        $election->loadMissing([
            'positions.course',
            'positions.candidates.party:id,name,short_name,course_id,election_id,sort_order',
        ]);

        $courseId = $user->studentProfile?->course_id;
        /** @var array<int, list<int>> $map */
        $map = [];

        foreach ($election->positions as $position) {
            $maySee = $forNomineeDirectoryListing
                ? $this->eligibility->mayViewNomineeDirectoryForPosition($user, $position)
                : $this->eligibility->mayVoteForPosition($user, $position);
            if (! $maySee) {
                continue;
            }

            $orderedIds = $position->candidates
                ->filter(fn (Candidate $c): bool => StudentBallotAccess::candidateNomineeIsVisibleToVoter($courseId, $c))
                ->sortBy([
                    fn (Candidate $c): int => $c->party?->course_id === null ? 0 : 1,
                    fn (Candidate $c): int => $c->party?->sort_order ?? 999_999,
                    fn (Candidate $c): string => strtolower($c->party?->name ?? "\u{FFFF}"),
                    fn (Candidate $c): int => $c->sort_order,
                    fn (Candidate $c): string => strtolower($c->full_name),
                ])
                ->pluck('id')
                ->map(static fn ($id): int => (int) $id)
                ->values()
                ->all();

            if ($orderedIds !== []) {
                $map[(int) $position->id] = $orderedIds;
            }
        }

        return $map;
    }

    /**
     * @param  list<int>  $allowedCandidateIds
     * @return list<array<string, mixed>>
     */
    private function buildSortedBallotNomineeOptions(Position $position, array $allowedCandidateIds): array
    {
        $byId = $position->candidates->keyBy('id');
        /** @var list<array<string, mixed>> $options */
        $options = [];

        foreach ($allowedCandidateIds as $candidateId) {
            /** @var Candidate|null $candidate */
            $candidate = $byId->get($candidateId);
            if ($candidate === null) {
                continue;
            }

            $party = $candidate->party;
            $partyScopeLabel = match (true) {
                $party === null => '—',
                $party->course_id === null => 'Campus-wide slate',
                default => 'Program slate',
            };

            $options[] = [
                'candidate_id' => $candidate->id,
                'full_name' => $candidate->full_name,
                'party_name' => $party?->name ?? 'Independent',
                'party_short_name' => $party?->short_name,
                'party_scope_label' => $partyScopeLabel,
                'party_sort_order' => $party?->sort_order ?? -1,
                'photo_url' => $candidate->photo_path !== null
                    ? Storage::disk('public')->url($candidate->photo_path)
                    : null,
                'platform' => $candidate->platform,
            ];
        }

        usort($options, static function (array $a, array $b): int {
            $campusRank = static function (array $row): int {
                return $row['party_scope_label'] === 'Campus-wide slate' ? 0 : 1;
            };

            $ra = $campusRank($a);
            $rb = $campusRank($b);
            if ($ra !== $rb) {
                return $ra <=> $rb;
            }

            if ($a['party_sort_order'] !== $b['party_sort_order']) {
                return $a['party_sort_order'] <=> $b['party_sort_order'];
            }

            $nameCmp = strcmp($a['party_name'], $b['party_name']);
            if ($nameCmp !== 0) {
                return $nameCmp;
            }

            return strcmp($a['full_name'], $b['full_name']);
        });

        return $options;
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeElectionOfficersDirectory(User $user, Election $election): array
    {
        $election->loadMissing([
            'positions.course',
            'positions.candidates.party:id,name,short_name,course_id,election_id,sort_order',
        ]);

        $allowedMap = $this->allowedCandidatesByPosition($user, $election, true);

        /** @var list<array<string, mixed>> $offices */
        $offices = [];

        foreach ($election->positions->sortBy([fn ($p): int => $p->sort_order, fn ($p): string => $p->name]) as $position) {
            $allowedIds = $allowedMap[$position->id] ?? null;
            if ($allowedIds === null) {
                continue;
            }

            $scopeLabel = $position->course_id === null
                ? 'Campus-wide'
                : ($position->course !== null
                    ? "{$position->course->code} — {$position->course->name}"
                    : 'Program race');

            $optionRows = $this->buildSortedBallotNomineeOptions($position, $allowedIds);

            $nominees = array_values(array_map(
                static function (array $row): array {
                    return [
                        'full_name' => $row['full_name'],
                        'party_scope_label' => $row['party_scope_label'],
                        'party_name' => $row['party_name'],
                        'party_short_name' => $row['party_short_name'],
                        'photo_url' => $row['photo_url'],
                        'platform' => $row['platform'],
                    ];
                },
                $optionRows,
            ));

            $offices[] = [
                'position_id' => $position->id,
                'name' => $position->name,
                'scope_label' => $scopeLabel,
                'nominees' => $nominees,
            ];
        }

        usort($offices, static function (array $a, array $b): int {
            $scope = strcmp($a['scope_label'], $b['scope_label']);
            if ($scope !== 0) {
                return $scope;
            }

            return strcmp($a['name'], $b['name']);
        });

        return [
            'id' => $election->id,
            'title' => $election->title,
            'description' => $election->description,
            'status' => $election->status->value,
            'accepting_votes' => $election->isAcceptingVotes(),
            'opens_at_display' => $election->opens_at !== null
                ? $election->opens_at->timezone(config('app.timezone'))->format('M j, Y g:i A')
                : null,
            'closes_at_display' => $election->closes_at !== null
                ? $election->closes_at->timezone(config('app.timezone'))->format('M j, Y g:i A')
                : null,
            'offices' => $offices,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeElectionCard(User $user, Election $election): array
    {
        $user->loadMissing(['studentProfile.course:id,code,name']);

        $election->loadMissing([
            'positions.course',
            'positions.candidates.party:id,name,short_name,course_id,election_id,sort_order',
        ]);

        $allowedMap = $this->allowedCandidatesByPosition($user, $election);

        $locked = $this->ballotIsLocked($user, $election, $allowedMap);

        if ($locked) {
            return [
                'id' => $election->id,
                'title' => $election->title,
                'description' => $election->description,
                'opens_at_display' => $election->opens_at !== null
                    ? $election->opens_at->timezone(config('app.timezone'))->format('M j, Y g:i A')
                    : null,
                'closes_at_display' => $election->closes_at !== null
                    ? $election->closes_at->timezone(config('app.timezone'))->format('M j, Y g:i A')
                    : null,
                'ballot_locked' => true,
                'races' => [],
                'committed_races' => $this->committedRacesPayload($user, $election, $allowedMap),
            ];
        }

        $voteRows = Vote::query()
            ->where('election_id', $election->id)
            ->where('user_id', $user->id)
            ->get()
            ->keyBy(static fn ($v): string => (string) $v->position_id);

        /** @var list<array<string, mixed>> $races */
        $races = [];

        foreach ($election->positions->sortBy([fn ($p): int => $p->sort_order, fn ($p): string => $p->name]) as $position) {
            $allowedIds = $allowedMap[$position->id] ?? null;
            if ($allowedIds === null) {
                continue;
            }

            $scopeLabel = $position->course_id === null
                ? 'Campus-wide'
                : ($position->course !== null
                    ? "{$position->course->code} — {$position->course->name}"
                    : 'Program race');

            $options = $this->buildSortedBallotNomineeOptions($position, $allowedIds);

            $voteRow = $voteRows->get((string) $position->id);
            $races[] = [
                'position_id' => $position->id,
                'name' => $position->name,
                'scope_label' => $scopeLabel,
                'max_selections' => $position->max_selections,
                'chosen_candidate_id' => $voteRow !== null ? (int) $voteRow->candidate_id : null,
                'options' => $options,
            ];
        }

        usort($races, static function (array $a, array $b): int {
            $scope = strcmp($a['scope_label'], $b['scope_label']);
            if ($scope !== 0) {
                return $scope;
            }

            return strcmp($a['name'], $b['name']);
        });

        return [
            'id' => $election->id,
            'title' => $election->title,
            'description' => $election->description,
            'opens_at_display' => $election->opens_at !== null
                ? $election->opens_at->timezone(config('app.timezone'))->format('M j, Y g:i A')
                : null,
            'closes_at_display' => $election->closes_at !== null
                ? $election->closes_at->timezone(config('app.timezone'))->format('M j, Y g:i A')
                : null,
            'ballot_locked' => false,
            'races' => $races,
            'committed_races' => [],
        ];
    }
}
