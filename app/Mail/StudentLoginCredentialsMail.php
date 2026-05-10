<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class StudentLoginCredentialsMail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * @param  non-empty-string  $plainPassword
     * @param  non-empty-string  $loginUrl
     */
    public function __construct(
        public User $user,
        public string $plainPassword,
        public string $loginUrl,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your '.config('app.name').' login credentials',
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.student-login-credentials',
            with: [
                'userName' => $this->user->name,
                'email' => $this->user->email,
                'plainPassword' => $this->plainPassword,
                'loginUrl' => $this->loginUrl,
                'appName' => config('app.name'),
            ],
        );
    }
}
