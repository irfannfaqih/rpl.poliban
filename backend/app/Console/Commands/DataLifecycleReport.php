<?php

namespace App\Console\Commands;

use App\Models\AuditLog;
use App\Models\Dokumen;
use App\Models\Notification;
use App\Models\Pendaftaran;
use App\Models\SkKeputusan;
use App\Services\PrivateDocumentStorage;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

class DataLifecycleReport extends Command
{
    protected $signature = 'lifecycle:report';

    protected $description = 'Report lifecycle growth indicators for audit logs, notifications, cache, and storage';

    public function handle(): int
    {
        $this->info('Database lifecycle');
        $this->table(['Area', 'Rows', 'Oldest', 'Newest'], [
            $this->rowSummary('audit_log', AuditLog::query()),
            $this->rowSummary('notifications', Notification::query()),
            $this->rowSummary('dokumen', Dokumen::query()),
            $this->rowSummary('pendaftaran', Pendaftaran::query()),
        ]);

        $cacheRows = Schema::hasTable('cache') ? DB::table('cache')->count() : 0;
        $expiredCacheRows = Schema::hasTable('cache')
            ? DB::table('cache')->where('expiration', '<=', now()->getTimestamp())->count()
            : 0;
        $cacheBytes = Schema::hasTable('cache')
            ? DB::table('cache')->sum(DB::raw('CHAR_LENGTH(value)'))
            : 0;
        $this->table(['Cache rows', 'Expired rows', 'Approx bytes'], [[$cacheRows, $expiredCacheRows, $cacheBytes]]);

        $private = Storage::disk(PrivateDocumentStorage::DISK);
        $privateFiles = collect(['dokumen', 'sanggah', 'arsip', 'sk'])
            ->flatMap(fn (string $directory) => $private->allFiles($directory))
            ->unique();
        $privateBytes = $privateFiles->sum(fn (string $path) => $private->size($path));

        $public = Storage::disk('public');
        $qrFiles = collect($public->allFiles('qrcode/sk'))->unique();
        $qrBytes = $qrFiles->sum(fn (string $path) => $public->size($path));

        $referencedPrivate = Dokumen::whereNotNull('file_path')->pluck('file_path')
            ->merge(DB::table('arsip_dokumen')->whereNotNull('file_path')->pluck('file_path'))
            ->merge(DB::table('sanggah')->whereNotNull('bukti_path')->pluck('bukti_path'))
            ->merge(SkKeputusan::whereNotNull('pdf_path')->pluck('pdf_path'))
            ->filter()
            ->unique()
            ->flip();
        $referencedQr = SkKeputusan::whereNotNull('qr_code_path')->pluck('qr_code_path')
            ->filter()
            ->unique()
            ->flip();

        $this->info('Storage lifecycle');
        $this->table(['Area', 'Files', 'Approx bytes', 'Orphans'], [
            [
                'private-documents',
                $privateFiles->count(),
                $privateBytes,
                $privateFiles->reject(fn (string $path) => $referencedPrivate->has($path))->count(),
            ],
            [
                'public-sk-qr',
                $qrFiles->count(),
                $qrBytes,
                $qrFiles->reject(fn (string $path) => $referencedQr->has($path))->count(),
            ],
        ]);

        return self::SUCCESS;
    }

    private function rowSummary(string $label, $query): array
    {
        return [
            $label,
            (clone $query)->count(),
            (clone $query)->min('created_at') ?: '-',
            (clone $query)->max('created_at') ?: '-',
        ];
    }
}
