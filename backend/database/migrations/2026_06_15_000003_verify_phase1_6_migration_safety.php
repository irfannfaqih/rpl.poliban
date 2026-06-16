<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        foreach ([
            ['sk_keputusan', 'document_snapshot'],
            ['sk_keputusan', 'pdf_path'],
            ['sk_keputusan', 'pdf_hash'],
        ] as [$table, $column]) {
            if (! Schema::hasColumn($table, $column)) {
                throw new RuntimeException(
                    "Migration Phase 1.6 tidak lengkap: {$table}.{$column}.",
                );
            }
        }

        if (
            DB::table('sk_keputusan')
                ->where('status', 'sk_terbit')
                ->where(function ($query) {
                    $query->whereNull('document_snapshot')
                        ->orWhereNull('content_hash');
                })
                ->exists()
        ) {
            throw new RuntimeException(
                'SK terbit tanpa snapshot ditemukan setelah migration.',
            );
        }
    }

    public function down(): void
    {
        // Verification-only migration: no schema mutation to roll back.
    }
};
