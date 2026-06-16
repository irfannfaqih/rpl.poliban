<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Hapus token Sanctum yang sudah expired setiap hari tengah malam
// Jalankan: php artisan schedule:run (atau setup cron di production)
Schedule::command('sanctum:prune-expired --hours=8')->daily();
Schedule::command('queue:health')->everyMinute()->withoutOverlapping();
Schedule::command('sk:materialize-published')->everyTenMinutes()->withoutOverlapping();
Schedule::command('cache:prune-expired --execute')->daily()->withoutOverlapping();
Schedule::command('notifications:prune-read --execute')->dailyAt('01:30')->withoutOverlapping();
