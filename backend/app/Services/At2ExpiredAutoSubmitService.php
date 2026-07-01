<?php

namespace App\Services;

use App\Models\Pendaftaran;
use App\Models\UjiLanjutan;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class At2ExpiredAutoSubmitService
{
    public const OUTCOME_PROCESSED = 'processed';
    public const OUTCOME_ALREADY_FINAL = 'already_final';
    public const OUTCOME_NOT_EXPIRED = 'not_expired';
    public const OUTCOME_SKIPPED = 'skipped';

    public function finalizeExpired(): array
    {
        $result = [
            'processed' => 0,
            'skipped' => 0,
        ];

        UjiLanjutan::query()
            ->where('fase_tulis', 'menunggu_jawaban')
            ->whereNotNull('ujian_dimulai_at')
            ->whereNotNull('durasi_menit')
            ->whereHas('pendaftaran', fn ($query) => $query->where('status_alur', 'asesmen_tahap2'))
            ->orderBy('id')
            ->chunkById(100, function ($records) use (&$result) {
                foreach ($records as $record) {
                    $outcome = $this->finalizeIfExpired($record->id);

                    if ($outcome === self::OUTCOME_PROCESSED) {
                        $result['processed']++;
                    } else {
                        $result['skipped']++;
                    }
                }
            });

        return $result;
    }

    public function finalizeOwnedExpired(int $ujiLanjutanId, int $userId, array $answers = []): string
    {
        return $this->finalizeIfExpired($ujiLanjutanId, $userId, $answers);
    }

    public function finalizeIfExpired(int $ujiLanjutanId, ?int $userId = null, array $answers = []): string
    {
        return DB::transaction(function () use ($ujiLanjutanId, $userId, $answers): string {
            $uji = UjiLanjutan::query()
                ->whereKey($ujiLanjutanId)
                ->lockForUpdate()
                ->first();

            if (! $uji) {
                throw (new ModelNotFoundException)->setModel(UjiLanjutan::class, [$ujiLanjutanId]);
            }

            $pendaftaranQuery = Pendaftaran::query()
                ->whereKey($uji->pendaftaran_id);

            if ($userId !== null) {
                $pendaftaranQuery->where('user_id', $userId);
            }

            $pendaftaran = $pendaftaranQuery
                ->lockForUpdate()
                ->first();

            if (! $pendaftaran) {
                if ($userId !== null) {
                    throw (new ModelNotFoundException)->setModel(Pendaftaran::class, [$uji->pendaftaran_id]);
                }

                return self::OUTCOME_SKIPPED;
            }

            if ($pendaftaran->status_alur !== 'asesmen_tahap2') {
                if ($userId !== null) {
                    abort(409, 'Pendaftaran tidak lagi berada pada tahap AT2.');
                }

                return self::OUTCOME_SKIPPED;
            }

            if (in_array($uji->fase_tulis, ['koreksi', 'selesai'], true)) {
                return self::OUTCOME_ALREADY_FINAL;
            }

            if ($uji->fase_tulis !== 'menunggu_jawaban') {
                return self::OUTCOME_SKIPPED;
            }

            if (! $this->isExpired($uji)) {
                return self::OUTCOME_NOT_EXPIRED;
            }

            $this->finalizeWrittenItems($uji, collect($answers));
            $uji->forceFill(['fase_tulis' => 'koreksi'])->save();

            return self::OUTCOME_PROCESSED;
        });
    }

    private function isExpired(UjiLanjutan $uji): bool
    {
        if (! $uji->ujian_dimulai_at || ! $uji->durasi_menit) {
            return false;
        }

        return now()->gt($uji->ujian_dimulai_at->copy()->addMinutes((int) $uji->durasi_menit));
    }

    private function finalizeWrittenItems(UjiLanjutan $uji, Collection $answers): void
    {
        $submittedAt = now();
        $answersById = $answers->keyBy('id');

        $uji->items()
            ->where('tipe', 'c3')
            ->lockForUpdate()
            ->get(['id', 'submitted_at'])
            ->each(function ($item) use ($answersById, $submittedAt) {
                $updates = [
                    'submitted_at' => $item->submitted_at ?? $submittedAt,
                    'updated_at' => $submittedAt,
                ];

                if ($answersById->has($item->id)) {
                    $answer = $answersById->get($item->id);
                    $updates['jawaban_pemohon'] = $answer['jawaban_pemohon'] ?? '';
                }

                DB::table('uji_lanjutan_item')
                    ->where('id', $item->id)
                    ->update($updates);
            });
    }
}
