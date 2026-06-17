<?php

namespace App\Providers;

use App\Contracts\ExternalErrorTracker;
use App\Services\Telemetry\Metrics;
use App\Services\Telemetry\NullExternalErrorTracker;
use App\Services\Telemetry\QueryTelemetry;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Mail\Events\MessageSending;
use Illuminate\Mail\Events\MessageSent;
use Illuminate\Queue\Events\JobFailed;
use Illuminate\Queue\Events\JobProcessed;
use Illuminate\Queue\Events\JobProcessing;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(QueryTelemetry::class);
        $this->app->singleton(Metrics::class);
        $this->app->singleton(ExternalErrorTracker::class, function () {
            $tracker = config('observability.external_error_tracker');

            if (
                is_string($tracker) &&
                class_exists($tracker) &&
                is_a($tracker, ExternalErrorTracker::class, true)
            ) {
                return app($tracker);
            }

            return new NullExternalErrorTracker();
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        \Carbon\Carbon::setLocale('id');

        ResetPassword::createUrlUsing(function ($user, string $token) {
            $frontendUrl = rtrim(config('app.frontend_url'), '/');

            return $frontendUrl.'/auth/reset-password?token='.
                urlencode($token).'&email='.urlencode($user->getEmailForPasswordReset());
        });

        DB::listen(fn ($query) => app(QueryTelemetry::class)->record($query));

        Queue::createPayloadUsing(fn () => [
            'sirpl_enqueued_at' => now()->getTimestampMs(),
        ]);
        Queue::looping(function (): void {
            Cache::put(
                config('observability.queue_heartbeat_key'),
                now(),
                config('observability.queue_heartbeat_ttl') * 2,
            );
        });

        $jobStartedAt = [];
        Event::listen(JobProcessing::class, function (JobProcessing $event) use (&$jobStartedAt): void {
            $jobId = $event->job->getJobId() ?? spl_object_id($event->job);
            $jobStartedAt[$jobId] = hrtime(true);
            $enqueuedAt = $event->job->payload()['sirpl_enqueued_at'] ?? null;

            if ($enqueuedAt) {
                app(Metrics::class)->timing(
                    'queue.duration',
                    now()->getTimestampMs() - $enqueuedAt,
                    ['job' => $event->job->resolveName()],
                );
            }
        });
        Event::listen(JobProcessed::class, function (JobProcessed $event) use (&$jobStartedAt): void {
            $jobId = $event->job->getJobId() ?? spl_object_id($event->job);
            $startedAt = $jobStartedAt[$jobId] ?? null;

            if ($startedAt) {
                app(Metrics::class)->timing(
                    'queue.job.processing_time',
                    (hrtime(true) - $startedAt) / 1_000_000,
                    ['job' => $event->job->resolveName()],
                );
                unset($jobStartedAt[$jobId]);
            }
        });
        Event::listen(JobFailed::class, function (JobFailed $event) use (&$jobStartedAt): void {
            $jobId = $event->job->getJobId() ?? spl_object_id($event->job);
            unset($jobStartedAt[$jobId]);
            app(Metrics::class)->increment('queue.failure', 1, [
                'job' => $event->job->resolveName(),
                'exception' => $event->exception::class,
            ]);
        });

        Event::listen(MessageSending::class, function (MessageSending $event): void {
            Log::info('mail.message.sending', $this->mailTelemetryPayload($event->message));
        });

        Event::listen(MessageSent::class, function (MessageSent $event): void {
            $payload = $this->mailTelemetryPayload($event->message);

            if (isset($event->sent) && is_callable([$event->sent, 'getMessageId'])) {
                $payload['message_id_hash'] = hash('sha256', (string) $event->sent->getMessageId());
            }

            Log::info('mail.message.sent', $payload);
        });

        \App\Models\Pendaftaran::observe(\App\Observers\AuditObserver::class);
        \App\Models\EvaluasiDiri::observe(\App\Observers\AuditObserver::class);
        \App\Models\VerifikasiBerkas::observe(\App\Observers\AuditObserver::class);
        \App\Models\PraAsesmen::observe(\App\Observers\AuditObserver::class);
        \App\Models\JadwalAsesmen::observe(\App\Observers\AuditObserver::class);
        \App\Models\PenilaianCpmk::observe(\App\Observers\AuditObserver::class);
        \App\Models\PlenoMk::observe(\App\Observers\AuditObserver::class);
    }

    /**
     * Build sanitized mail telemetry. Never log body, password, tokens, reset URLs,
     * or full recipient addresses.
     *
     * @return array<string, mixed>
     */
    private function mailTelemetryPayload(mixed $message): array
    {
        return [
            'mailer' => config('mail.default'),
            'from_domains' => $this->addressDomains($message->getFrom()),
            'to_domains' => $this->addressDomains($message->getTo()),
            'cc_count' => count($message->getCc()),
            'bcc_count' => count($message->getBcc()),
            'subject_hash' => hash('sha256', (string) $message->getSubject()),
            'subject_length' => strlen((string) $message->getSubject()),
        ];
    }

    /**
     * @param array<int, object> $addresses
     * @return array<int, string>
     */
    private function addressDomains(array $addresses): array
    {
        return collect($addresses)
            ->map(fn ($address) => method_exists($address, 'getAddress') ? $address->getAddress() : '')
            ->map(fn (string $email) => substr(strrchr($email, '@') ?: '', 1) ?: null)
            ->filter()
            ->unique()
            ->values()
            ->all();
    }
}
