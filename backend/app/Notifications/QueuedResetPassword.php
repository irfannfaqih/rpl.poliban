<?php

namespace App\Notifications;

use App\Mail\ResetPasswordMail;
use App\Services\Telemetry\Metrics;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;
use Throwable;

class QueuedResetPassword extends ResetPassword implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $timeout = 60;

    public function toMail($notifiable): ResetPasswordMail
    {
        // Use $notifiable->email (property) instead of getEmailForPasswordReset() (method)
        // Property access works on serialized stdClass, method calls don't
        return (new ResetPasswordMail($this->resetUrl($notifiable), $notifiable))
            ->to($notifiable->email);
    }

    /**
     * @return array<int, int>
     */
    public function backoff(): array
    {
        return [10, 60, 300];
    }

    public function failed(Throwable $exception): void
    {
        app(Metrics::class)->increment('mail.failure', 1, [
            'notification' => static::class,
            'exception' => $exception::class,
        ]);

        Log::warning('password.reset.notification.failed', [
            'notification' => static::class,
            'exception' => $exception::class,
            'message' => $exception->getMessage(),
        ]);
    }
}
