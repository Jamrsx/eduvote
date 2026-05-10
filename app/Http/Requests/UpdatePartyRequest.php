<?php

namespace App\Http\Requests;

use App\Enums\UserRole;
use App\Models\Election;
use App\Models\Party;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class UpdatePartyRequest extends FormRequest
{
    public function authorize(): bool
    {
        $election = $this->route('election');
        $party = $this->route('party');

        if (! $election instanceof Election || ! $party instanceof Party) {
            return false;
        }

        if ((int) $party->election_id !== (int) $election->id) {
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
        /** @var Election $election */
        $election = $this->route('election');
        /** @var Party $party */
        $party = $this->route('party');

        return [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('parties', 'name')
                    ->where(fn ($query) => $query->where('election_id', $election->id))
                    ->ignore($party->id),
            ],
            'short_name' => ['nullable', 'string', 'max:120'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:65535'],
            'course_id' => ['nullable', 'integer', 'exists:courses,id'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('course_id') && $this->input('course_id') === '') {
            $this->merge(['course_id' => null]);
        }

        if ($this->has('short_name') && $this->input('short_name') === '') {
            $this->merge(['short_name' => null]);
        }

        if ($this->has('sort_order') && $this->input('sort_order') === '') {
            $this->merge(['sort_order' => null]);
        }
    }
}
