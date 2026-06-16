<?php

namespace App\Console\Commands;

use App\Models\AuditLog;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ArchiveAuditLog extends Command
{
    protected $signature = 'audit-log:archive
        {--days= : Archive rows older than this many days}
        {--disk= : Storage disk for archive output}
        {--path= : Archive directory}
        {--delete-after-archive : Delete archived rows after checksum verification}
        {--dry-run : Report eligible rows without writing an archive}';

    protected $description = 'Archive old audit log rows with checksum verification and optional safe deletion';

    public function handle(): int
    {
        $days = (int) ($this->option('days') ?: config('retention.audit_log_days'));
        $diskName = (string) ($this->option('disk') ?: config('retention.archive_disk'));
        $directory = trim((string) ($this->option('path') ?: config('retention.archive_path')), '/');
        $cutoff = now()->subDays($days);

        $baseQuery = AuditLog::query()
            ->where('created_at', '<', $cutoff)
            ->orderBy('id');

        $count = (clone $baseQuery)->count();
        $this->table(
            ['Cutoff', 'Eligible rows', 'Delete after archive'],
            [[$cutoff->toDateTimeString(), $count, $this->option('delete-after-archive') ? 'yes' : 'no']],
        );

        if ($count === 0 || $this->option('dry-run')) {
            $this->info($this->option('dry-run') ? 'Dry run complete. No archive was written.' : 'No audit log rows are eligible.');

            return self::SUCCESS;
        }

        $filename = sprintf(
            '%s/audit-log-%s-older-than-%sd.jsonl',
            $directory,
            now()->format('YmdHis'),
            $days,
        );
        $tmp = fopen('php://temp', 'w+b');
        $hashContext = hash_init('sha256');
        $firstId = null;
        $lastId = null;

        (clone $baseQuery)->chunkById(500, function ($rows) use ($tmp, $hashContext, &$firstId, &$lastId): void {
            foreach ($rows as $row) {
                $firstId ??= $row->id;
                $lastId = $row->id;
                $line = json_encode($row->getAttributes(), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)."\n";
                fwrite($tmp, $line);
                hash_update($hashContext, $line);
            }
        });

        $checksum = hash_final($hashContext);
        rewind($tmp);
        Storage::disk($diskName)->put($filename, stream_get_contents($tmp));
        fclose($tmp);

        $stored = Storage::disk($diskName)->get($filename);
        $storedChecksum = hash('sha256', $stored);
        if (! hash_equals($checksum, $storedChecksum)) {
            $this->error('Archive checksum verification failed. No rows were deleted.');

            return self::FAILURE;
        }

        $manifest = [
            'archive' => $filename,
            'checksum_sha256' => $checksum,
            'rows' => $count,
            'first_id' => $firstId,
            'last_id' => $lastId,
            'cutoff' => $cutoff->toIso8601String(),
            'created_at' => now()->toIso8601String(),
        ];
        Storage::disk($diskName)->put(
            $filename.'.manifest.json',
            json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES),
        );

        if ($this->option('delete-after-archive')) {
            DB::transaction(function () use ($cutoff): void {
                AuditLog::where('created_at', '<', $cutoff)->delete();
            });
        }

        $this->info("Archive verified: {$filename}");
        $this->line("SHA256: {$checksum}");

        return self::SUCCESS;
    }
}
