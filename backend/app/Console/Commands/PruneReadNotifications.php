<?php

namespace App\Console\Commands;

use App\Models\Notification;
use Illuminate\Console\Command;

class PruneReadNotifications extends Command
{
    protected $signature = 'notifications:prune-read
        {--days= : Delete read notifications older than this many days}
        {--execute : Actually delete matching rows}';

    protected $description = 'Prune old read notifications with dry-run safety by default';

    public function handle(): int
    {
        $days = (int) ($this->option('days') ?: config('retention.notification_read_days'));
        $cutoff = now()->subDays($days);
        $query = Notification::query()
            ->where('is_read', true)
            ->where('created_at', '<', $cutoff);
        $count = (clone $query)->count();

        $this->table(
            ['Cutoff', 'Read notifications eligible', 'Mode'],
            [[$cutoff->toDateTimeString(), $count, $this->option('execute') ? 'execute' : 'dry-run']],
        );

        if (! $this->option('execute')) {
            $this->info('Dry run complete. No notifications were deleted.');

            return self::SUCCESS;
        }

        $deleted = $query->delete();
        $this->info("Deleted {$deleted} old read notifications.");

        return self::SUCCESS;
    }
}
