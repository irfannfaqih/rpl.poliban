<?php

namespace App\Observers;

use App\Models\AuditLog;
use App\Support\RuntimeContext;
use Illuminate\Support\Facades\Log;
use Throwable;

class AuditObserver
{
    /**
     * Handle the model "created" event.
     */
    public function created($model): void
    {
        Log::info("AUDIT: Created " . class_basename($model) . " ID: " . $model->id, [
            'data' => $model->toArray(),
            'user_id' => RuntimeContext::userId() ?? 'system'
        ]);

        $this->writeAuditLog('CREATE', $model);
    }

    /**
     * Handle the model "updated" event.
     */
    public function updated($model): void
    {
        Log::info("AUDIT: Updated " . class_basename($model) . " ID: " . $model->id, [
            'changes' => $model->getChanges(),
            'original' => $model->getOriginal(),
            'user_id' => RuntimeContext::userId() ?? 'system'
        ]);

        $changedFields = collect(array_keys($model->getChanges()))
            ->reject(fn (string $field) => in_array($field, ['updated_at'], true))
            ->values()
            ->all();

        $this->writeAuditLog('UPDATE', $model, $changedFields);
    }

    /**
     * Handle the model "deleted" event.
     */
    public function deleted($model): void
    {
        Log::info("AUDIT: Deleted " . class_basename($model) . " ID: " . $model->id, [
            'data' => $model->toArray(),
            'user_id' => RuntimeContext::userId() ?? 'system'
        ]);

        $this->writeAuditLog('DELETE', $model);
    }

    /**
     * Persist audit entries for the Super Admin audit log UI.
     */
    private function writeAuditLog(string $action, $model, array $changedFields = []): void
    {
        try {
            $module = class_basename($model);
            $modelId = $model->getKey();
            $detail = match ($action) {
                'CREATE' => "Created {$module} ID: {$modelId}",
                'UPDATE' => empty($changedFields)
                    ? "Updated {$module} ID: {$modelId}"
                    : "Updated {$module} ID: {$modelId}; fields: ".implode(', ', $changedFields),
                'DELETE' => "Deleted {$module} ID: {$modelId}",
                default => "{$action} {$module} ID: {$modelId}",
            };

            AuditLog::create([
                'user_id' => RuntimeContext::userId(),
                'impersonated_by' => app()->bound('session')
                    ? session('impersonator_id')
                    : null,
                'action' => $action,
                'module' => $module,
                'detail' => $detail,
                'ip_address' => RuntimeContext::ipAddress(),
                'created_at' => now(),
            ]);
        } catch (Throwable $e) {
            Log::warning('AUDIT_DB_WRITE_FAILED: '.$e->getMessage(), [
                'action' => $action,
                'module' => class_basename($model),
                'model_id' => $model->getKey(),
            ]);
        }
    }
}
