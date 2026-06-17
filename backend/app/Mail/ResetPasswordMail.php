<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ResetPasswordMail extends QueuedMailable
{
    use Queueable, SerializesModels;

    public string $url;

    public mixed $user;

    public int $expiresInMinutes;

    public function __construct(string $url, mixed $user)
    {
        $this->url = $url;
        $this->user = $user;
        $this->expiresInMinutes = (int) config('auth.passwords.'.config('auth.defaults.passwords').'.expire', 60);
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Reset Password Akun SIRPL Poliban',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.reset_password',
        );
    }

    /**
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
