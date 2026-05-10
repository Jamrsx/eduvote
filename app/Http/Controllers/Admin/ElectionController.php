<?php

namespace App\Http\Controllers\Admin;

use App\Enums\ElectionStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreElectionRequest;
use App\Http\Requests\UpdateElectionRequest;
use App\Models\Election;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ElectionController extends Controller
{
    /**
     * Elections — schedule windows, statuses, and ballot configuration.
     */
    public function index(): Response
    {
        $this->authorize('viewAny', Election::class);

        $elections = Election::query()
            ->withCount('votes')
            ->latest('closes_at')
            ->get()
            ->map(fn (Election $election): array => [
                'id' => $election->id,
                'title' => $election->title,
                'description' => $election->description,
                'status' => $election->status->value,
                'votes_count' => $election->votes_count,
                'opens_at_input' => $election->opens_at?->format('Y-m-d\TH:i'),
                'closes_at_input' => $election->closes_at?->format('Y-m-d\TH:i'),
                'opens_at_display' => $election->opens_at?->format('M j, Y g:i A'),
                'closes_at_display' => $election->closes_at?->format('M j, Y g:i A'),
            ])
            ->values()
            ->all();

        return Inertia::render('admin/elections/index', [
            'breadcrumbs' => [
                ['title' => 'Admin', 'href' => route('admin.dashboard')],
                ['title' => 'Elections', 'href' => route('admin.elections.index')],
            ],
            'elections' => $elections,
            'electionStatuses' => collect(ElectionStatus::cases())
                ->map(fn (ElectionStatus $s): array => [
                    'value' => $s->value,
                    'label' => match ($s) {
                        ElectionStatus::Draft => 'Draft',
                        ElectionStatus::Scheduled => 'Scheduled',
                        ElectionStatus::Open => 'Open',
                        ElectionStatus::Closed => 'Closed',
                    },
                ])
                ->values()
                ->all(),
            'appTimezone' => config('app.timezone'),
        ]);
    }

    public function store(StoreElectionRequest $request): RedirectResponse
    {
        $this->authorize('create', Election::class);

        Election::query()->create($request->validated());

        return redirect()->route('admin.elections.index')->with('success', 'Election created.');
    }

    public function update(UpdateElectionRequest $request, Election $election): RedirectResponse
    {
        $this->authorize('update', $election);

        $election->update($request->validated());

        return redirect()->route('admin.elections.index')->with('success', 'Election updated.');
    }

    public function destroy(Election $election): RedirectResponse
    {
        $this->authorize('delete', $election);

        if ($election->votes()->exists()) {
            return redirect()
                ->route('admin.elections.index')
                ->withErrors([
                    'election' => 'Cannot delete an election after votes have been recorded.',
                ]);
        }

        $election->delete();

        return redirect()->route('admin.elections.index')->with('success', 'Election removed.');
    }
}
