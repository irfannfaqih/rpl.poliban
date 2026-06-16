<?php

namespace App\Contracts;

use Throwable;

interface ExternalErrorTracker
{
    public function report(Throwable $exception, array $context = []): void;
}
