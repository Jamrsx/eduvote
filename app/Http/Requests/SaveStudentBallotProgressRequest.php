<?php

namespace App\Http\Requests;

use App\Enums\UserRole;
use App\Models\Election;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaveStudentBallotProgressRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === UserRole::Student;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var Election|null $election */
        $election = $this->route('election');
        if ($election === null) {
            return [];
        }

        $electionId = (int) $election->id;

        return [
            'phase' => ['sometimes', 'nullable', 'string', Rule::in(['campus', 'program'])],
            'selections' => ['required', 'array', 'min:1'],
            'selections.*.position_id' => [
                'required',
                'integer',
                Rule::exists('positions', 'id')->where(
                    static fn ($query) => $query->where('election_id', $electionId),
                ),
            ],
            'selections.*.candidate_id' => [
                'required',
                'integer',
                Rule::exists('candidates', 'id')->where(
                    static fn ($query) => $query->where('election_id', $electionId),
                ),
            ],
        ];
    }
}
