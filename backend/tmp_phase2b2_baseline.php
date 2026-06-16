<?php

require __DIR__.'/vendor/autoload.php';

$app = require __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

function requestFor(App\Models\User $user, array $query = []): Illuminate\Http\Request
{
    $request = Illuminate\Http\Request::create('/', 'GET', $query);
    $request->setUserResolver(fn () => $user);

    return $request;
}

function measure(string $name, callable $callback): array
{
    Illuminate\Support\Facades\DB::flushQueryLog();
    Illuminate\Support\Facades\DB::enableQueryLog();
    $start = hrtime(true);
    $response = $callback();
    $content = $response->getContent();
    $queries = Illuminate\Support\Facades\DB::getQueryLog();
    Illuminate\Support\Facades\DB::disableQueryLog();

    return [
        'name' => $name,
        'status' => $response->getStatusCode(),
        'queries' => count($queries),
        'bytes' => strlen($content),
        'ms' => round((hrtime(true) - $start) / 1_000_000, 2),
    ];
}

$results = [];
$pemohon = App\Models\User::where('role', 'pemohon')
    ->whereHas('pendaftaran')
    ->first();
if ($pemohon) {
    $results[] = measure(
        'pemohon.pendaftaran',
        fn () => app(App\Http\Controllers\Api\Pemohon\BorangController::class)
            ->getPendaftaran(requestFor($pemohon)),
    );
    $results[] = measure(
        'pemohon.notifications.10',
        fn () => app(App\Http\Controllers\Api\Pemohon\NotificationController::class)
            ->index(requestFor($pemohon, ['per_page' => 10])),
    );
}

$asesor = App\Models\User::where('role', 'asesor')
    ->whereHas('penugasanAsesor')
    ->first();
if ($asesor) {
    $results[] = measure(
        'asesor.tugas.index',
        fn () => app(App\Http\Controllers\Api\Asesor\TugasController::class)
            ->index(requestFor($asesor)),
    );
    $tugas = App\Models\PenugasanAsesor::where('asesor_id', $asesor->id)
        ->first();
    if ($tugas) {
        $results[] = measure(
            'asesor.tugas.show',
            fn () => app(App\Http\Controllers\Api\Asesor\TugasController::class)
                ->show(requestFor($asesor), $tugas),
        );
    }
}

echo json_encode($results, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
