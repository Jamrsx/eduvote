<?php

namespace App\Http\Requests;

use App\Enums\UserRole;
use App\Models\Candidate;
use App\Models\Election;
use App\Models\Party;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class UpdatePartySlateCandidateRequest extends FormRequest
{
    public function authorize(): bool
    {
        $election = $this->route('election');
        $party = $this->route('party');
        $candidate = $this->route('candidate');

        if (! $election instanceof Election || ! $party instanceof Party || ! $candidate instanceof Candidate) {
            return false;
        }

        if ((int) $party->election_id !== (int) $election->id) {
            return false;
        }

        if ((int) $candidate->election_id !== (int) $election->id) {
            return false;
        }

        if ((int) ($candidate->party_id ?? 0) !== (int) $party->id) {
            return false;
        }

        return $this->user()?->role === UserRole::Admin
            && Gate::allows('update', $election);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'position_name' => ['required', 'string', 'max:255'],
            'full_name' => ['required', 'string', 'max:255'],
            'platform' => ['nullable', 'string', 'max:5000'],
            'course_id' => ['nullable', 'integer', 'exists:courses,id'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('position_name')) {
            $this->merge([
                'position_name' => trim((string) $this->input('position_name')),
            ]);
        }

        if ($this->has('course_id') && $this->input('course_id') === '') {
            $this->merge(['course_id' => null]);
        }
    }
}
