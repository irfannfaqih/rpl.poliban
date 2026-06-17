<?php

namespace App\Notifications;

use App\Mail\ResetPasswordMail;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;

class QueuedResetPassword extends ResetPassword implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $timeout = 60;

    public function toMail($notifiable): ResetPasswordMail
    {
        return (new ResetPasswordMail($this->resetUrl($notifiable), $notifiable))
            ->to($notifiable->getEmailForPasswordReset());
    }

    /**
     * @return array<int, int>
     */
    public function backoff(): array
    {
        return [10, 60, 300];
    }
}
