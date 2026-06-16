<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class PruneExpiredCache extends Command
{
    protected $signature = 'cache:prune-expired {--execute : Actually delete expired database cache rows}';

    protected $description = 'Prune expired rows from the database cache table with dry-run safety by default';

    public function handle(): int
    {
        if (! Schema::hasTable('cache')) {
            $this->warn('Cache table does not exist.');

            return self::SUCCESS;
        }

        $now = now()->getTimestamp();
        $query = DB::table('cache')->where('expiration', '<=', $now);
        $count = (clone $query)->count();
        $bytes = (clone $query)->sum(DB::raw('CHAR_LENGTH(value)'));

        $this->table(
            ['Expired rows', 'Approx bytes', 'Mode'],
            [[$count, $bytes, $this->option('execute') ? 'execute' : 'dry-run']],
        );

        if (! $this->option('execute')) {
            $this->info('Dry run complete. No cache rows were deleted.');

            return self::SUCCESS;
        }

        $deleted = $query->delete();
        $this->info("Deleted {$deleted} expired cache rows.");

        return self::SUCCESS;
    }
}
