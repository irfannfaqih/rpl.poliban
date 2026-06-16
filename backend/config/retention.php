<?php

return [
    'audit_log_days' => (int) env('RETENTION_AUDIT_LOG_DAYS', 730),
    'notification_read_days' => (int) env('RETENTION_NOTIFICATION_READ_DAYS', 365),
    'archive_disk' => env('RETENTION_ARCHIVE_DISK', 'local'),
    'archive_path' => env('RETENTION_ARCHIVE_PATH', 'retention-archives'),
];
