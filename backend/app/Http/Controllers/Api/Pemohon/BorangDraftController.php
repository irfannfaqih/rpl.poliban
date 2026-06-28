<?php

namespace App\Http\Controllers\Api\Pemohon;

use App\Http\Controllers\Controller;
use App\Models\BorangDraft;
use App\Models\Cpmk;
use App\Models\Dokumen;
use App\Models\Pendaftaran;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class BorangDraftController extends Controller
{
    private const EDITABLE_STATUSES = [
        'pre_submit',
        'waiting_payment',
        'payment_verified',
        'document_revision',
    ];

    private const MAX_PAYLOAD_BYTES = 262144;

    public function show(Request $request, Pendaftaran $pendaftaran): JsonResponse
    {
        $this->authorize('update', $pendaftaran);
        $this->ensureDraftEditable($pendaftaran);

        $draft = $pendaftaran->borangDraft()
            ->where('user_id', $request->user()->id)
            ->first();

        if (! $draft) {
            return response()->json(['data' => null]);
        }

        return response()->json([
            'data' => [
                'payload' => $draft->payload,
                'last_saved_at' => $draft->last_saved_at?->toIso8601String(),
            ],
        ]);
    }

    public function update(Request $request, Pendaftaran $pendaftaran): JsonResponse
    {
        $this->authorize('update', $pendaftaran);
        $this->ensureDraftEditable($pendaftaran);

        $validated = $request->validate([
            'payload' => ['required', 'array'],
            'payload.sectionA' => ['nullable', 'array'],
            'payload.sectionB' => ['nullable', 'array'],
            'payload.sectionC' => ['nullable', 'array'],
            'payload.sectionD' => ['nullable', 'array'],
            'payload.sectionE' => ['nullable', 'array'],
        ]);

        $payload = $validated['payload'];
        $this->validatePayloadShape($payload);
        $this->validatePayloadSize($payload);
        $this->validateBasicEnums($payload);
        $this->validateDocumentOwnership($payload, $pendaftaran);
        $this->validateCpmkOwnership($payload, $pendaftaran);

        $savedAt = now();
        $draft = BorangDraft::updateOrCreate(
            ['pendaftaran_id' => $pendaftaran->id],
            [
                'user_id' => $request->user()->id,
                'payload' => $payload,
                'last_saved_at' => $savedAt,
            ],
        );

        return response()->json([
            'message' => 'Draft borang tersimpan',
            'data' => [
                'payload' => $draft->payload,
                'last_saved_at' => $savedAt->toIso8601String(),
            ],
        ]);
    }

    public function destroy(Request $request, Pendaftaran $pendaftaran): JsonResponse
    {
        $this->authorize('update', $pendaftaran);
        $this->ensureDraftEditable($pendaftaran);

        $pendaftaran->borangDraft()
            ->where('user_id', $request->user()->id)
            ->delete();

        return response()->json(['message' => 'Draft borang dihapus']);
    }

    private function ensureDraftEditable(Pendaftaran $pendaftaran): void
    {
        abort_unless(
            in_array($pendaftaran->status_alur, self::EDITABLE_STATUSES, true),
            409,
            'Draft borang tidak dapat diubah pada tahap saat ini.',
        );
    }

    private function validatePayloadShape(array $payload): void
    {
        $allowedSections = ['sectionA', 'sectionB', 'sectionC', 'sectionD', 'sectionE'];
        $unknownSections = array_diff(array_keys($payload), $allowedSections);

        if ($unknownSections !== []) {
            throw ValidationException::withMessages([
                'payload' => ['Payload hanya boleh memuat sectionA sampai sectionE.'],
            ]);
        }
    }

    private function validatePayloadSize(array $payload): void
    {
        $encoded = json_encode($payload);

        if ($encoded === false || strlen($encoded) > self::MAX_PAYLOAD_BYTES) {
            throw ValidationException::withMessages([
                'payload' => ['Payload draft borang terlalu besar.'],
            ]);
        }
    }

    private function validateBasicEnums(array $payload): void
    {
        $jenisKelamin = data_get($payload, 'sectionA.jenisKelamin');
        if ($jenisKelamin !== null && $jenisKelamin !== '' && ! in_array($jenisKelamin, ['L', 'P'], true)) {
            throw ValidationException::withMessages([
                'payload.sectionA.jenisKelamin' => ['Jenis kelamin tidak valid.'],
            ]);
        }

        foreach (data_get($payload, 'sectionD.evaluasi', []) as $key => $item) {
            $profisiensi = is_array($item) ? ($item['profisiensi'] ?? null) : null;
            if ($profisiensi !== null && ! in_array((int) $profisiensi, [1, 2, 4, 5], true)) {
                throw ValidationException::withMessages([
                    "payload.sectionD.evaluasi.{$key}.profisiensi" => ['Profisiensi tidak valid.'],
                ]);
            }
        }
    }

    private function validateDocumentOwnership(array $payload, Pendaftaran $pendaftaran): void
    {
        $documentIds = $this->extractDocumentIds($payload);
        if ($documentIds === []) {
            return;
        }

        $ownedCount = Dokumen::where('pendaftaran_id', $pendaftaran->id)
            ->whereIn('id', $documentIds)
            ->count();

        if ($ownedCount !== count(array_unique($documentIds))) {
            throw ValidationException::withMessages([
                'payload' => ['Draft memuat dokumen yang tidak valid untuk pendaftaran ini.'],
            ]);
        }
    }

    private function validateCpmkOwnership(array $payload, Pendaftaran $pendaftaran): void
    {
        $evaluasi = data_get($payload, 'sectionD.evaluasi', []);
        if (! is_array($evaluasi) || $evaluasi === []) {
            return;
        }

        $cpmkIds = array_values(array_unique(array_filter(
            array_map(
                fn ($key) => is_numeric($key) ? (int) $key : null,
                array_keys($evaluasi),
            ),
        )));

        if ($cpmkIds === []) {
            return;
        }

        $validCount = Cpmk::whereIn('id', $cpmkIds)
            ->whereHas('mataKuliah', fn ($query) => $query
                ->where('prodi_id', $pendaftaran->prodi_id)
                ->where('is_active', true))
            ->count();

        if ($validCount !== count($cpmkIds)) {
            throw ValidationException::withMessages([
                'payload.sectionD.evaluasi' => ['Draft memuat CPMK yang tidak valid untuk prodi pendaftaran ini.'],
            ]);
        }
    }

    private function extractDocumentIds(array $payload): array
    {
        $ids = [];
        $wajib = data_get($payload, 'sectionE.dokumenWajib', []);
        if (is_array($wajib)) {
            foreach ($wajib as $key => $value) {
                if (str_ends_with((string) $key, 'Id') && is_numeric($value)) {
                    $ids[] = (int) $value;
                }
            }
        }

        $tambahan = data_get($payload, 'sectionE.dokumenTambahan', []);
        if (is_array($tambahan)) {
            foreach ($tambahan as $item) {
                if (is_array($item) && isset($item['dbId']) && is_numeric($item['dbId'])) {
                    $ids[] = (int) $item['dbId'];
                }
            }
        }

        $evaluasi = data_get($payload, 'sectionD.evaluasi', []);
        if (is_array($evaluasi)) {
            foreach ($evaluasi as $item) {
                foreach ((array) ($item['dokumenPendukung'] ?? []) as $dokumenId) {
                    if (is_numeric($dokumenId)) {
                        $ids[] = (int) $dokumenId;
                    }
                }
            }
        }

        return array_values(array_unique($ids));
    }
}
