<?php

namespace App\Console\Commands;

use App\Jobs\MailProbeJob;
use App\Services\Telemetry\Metrics;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Throwable;

class MailProbe extends Command
{
    protected $signature = 'mail:probe
        {email : Recipient email for the probe}
        {--queue : Dispatch through the configured queue worker}
        {--wait=15 : Seconds to wait for queued probe result}';

    protected $description = 'Send a lightweight email probe to validate SMTP delivery and, optionally, queue processing';

    public function handle(Metrics $metrics): int
    {
        $email = (string) $this->argument('email');

        if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->error('Recipient email is invalid.');

            return self::INVALID;
        }

        $this->components->info('Mail configuration');
        $this->table(
            ['Mailer', 'Host', 'Port', 'Timeout', 'Queue'],
            [[
                config('mail.default'),
                config('mail.mailers.smtp.host'),
                config('mail.mailers.smtp.port'),
                config('mail.mailers.smtp.timeout'),
                config('queue.default'),
            ]],
        );

        if ($this->option('queue')) {
            return $this->runQueuedProbe($email, $metrics);
        }

        return $this->runSmtpProbe($email, $metrics);
    }

    private function runSmtpProbe(string $email, Metrics $metrics): int
    {
        $startedAt = microtime(true);

        try {
            Mail::raw(
                'Email probe SIRPL berhasil dikirim pada '.now()->toIso8601String().'.',
                function ($message) use ($email): void {
                    $message
                        ->to($email)
                        ->subject('SIRPL Email Probe');
                },
            );
        } catch (Throwable $exception) {
            $metrics->increment('mail.probe.failure', 1, [
                'mode' => 'smtp',
                'exception' => $exception::class,
            ]);

            $this->error('SMTP probe failed: '.$exception->getMessage());

            return self::FAILURE;
        }

        $metrics->timing('mail.probe.duration', (microtime(true) - $startedAt) * 1000, [
            'mode' => 'smtp',
        ]);

        $this->info('SMTP probe sent successfully.');

        return self::SUCCESS;
    }

    private function runQueuedProbe(string $email, Metrics $metrics): int
    {
        if (config('queue.default') === 'sync') {
            $this->warn('Queue connection is sync; running direct SMTP probe instead.');

            return $this->runSmtpProbe($email, $metrics);
        }

        $cacheKey = 'mail:probe:'.Str::uuid();
        $startedAt = microtime(true);

        MailProbeJob::dispatch($cacheKey, $email);

        $deadline = microtime(true) + (float) $this->option('wait');
        do {
            $result = Cache::get($cacheKey);

            if (($result['status'] ?? null) === 'sent') {
                Cache::forget($cacheKey);
                $metrics->timing('mail.probe.duration', (microtime(true) - $startedAt) * 1000, [
                    'mode' => 'queue',
                ]);
                $this->info('Queued mail probe processed and sent successfully.');

                return self::SUCCESS;
            }

            if (($result['status'] ?? null) === 'failed') {
                Cache::forget($cacheKey);
                $metrics->increment('mail.probe.failure', 1, [
                    'mode' => 'queue',
                    'exception' => $result['exception'] ?? 'unknown',
                ]);
                $this->error('Queued mail probe failed: '.($result['message'] ?? 'unknown error'));

                return self::FAILURE;
            }

            usleep(250_000);
        } while (microtime(true) < $deadline);

        $metrics->increment('mail.probe.failure', 1, [
            'mode' => 'queue',
            'exception' => 'timeout',
        ]);
        $this->error('Queued mail probe was not processed before timeout. Check queue worker and failed_jobs.');

        return self::FAILURE;
    }
}
