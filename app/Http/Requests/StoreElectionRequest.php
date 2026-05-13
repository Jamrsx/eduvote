<?php

namespace App\Http\Requests;

use App\Enums\ElectionStatus;
use App\Enums\UserRole;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreElectionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === UserRole::Admin;
    }

    protected function prepareForValidation(): void
    {
        if ($this->input('lifecycle') === 'draft') {
            $this->merge(['status' => ElectionStatus::Draft->value]);

            return;
        }

        if ($this->input('lifecycle') === 'published') {
            $this->merge(['status' => ElectionStatus::Scheduled->value]);
        }
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'opens_at' => ['required', 'date'],
            'closes_at' => ['required', 'date', 'after:opens_at'],
            'lifecycle' => ['required', Rule::in(['draft', 'published'])],
            'status' => ['required', Rule::enum(ElectionStatus::class)],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'title' => 'title',
            'opens_at' => 'open date and time',
            'closes_at' => 'close date and time',
            'lifecycle' => 'election mode',
        ];
    }
}
