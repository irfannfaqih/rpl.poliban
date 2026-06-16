<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const INDEX = 'idx_audit_detail_fulltext';

    public function up(): void
    {
        if (
            DB::getDriverName() === 'mysql' &&
            ! Schema::hasIndex('audit_log', self::INDEX)
        ) {
            DB::statement(
                'ALTER TABLE audit_log ADD FULLTEXT INDEX '.self::INDEX.' (detail)',
            );
        }
    }

    public function down(): void
    {
        if (
            DB::getDriverName() === 'mysql' &&
            Schema::hasIndex('audit_log', self::INDEX)
        ) {
            DB::statement(
                'ALTER TABLE audit_log DROP INDEX '.self::INDEX,
            );
        }
    }
};
