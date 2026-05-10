<?php

namespace App\Http\Requests;

use App\Enums\UserRole;
use App\Models\Election;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class UpdateBallotPositionRequest extends FormRequest
{
    public function authorize(): bool
    {
        $election = $this->route('election');

        return $election instanceof Election
            && $this->user()?->role === UserRole::Admin
            && Gate::allows('update', $election);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:65535'],
            'max_selections' => ['nullable', 'integer', 'min:1', 'max:50'],
            'course_id' => ['nullable', 'integer', 'exists:courses,id'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('course_id') && $this->input('course_id') === '') {
            $this->merge(['course_id' => null]);
        }

        foreach (['sort_order', 'max_selections'] as $field) {
            if ($this->has($field) && $this->input($field) === '') {
                $this->merge([$field => null]);
            }
        }
    }
}
