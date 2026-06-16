<?php

namespace App\Support;

use Throwable;

class RuntimeContext
{
    public static function routeUri(): ?string
    {
        try {
            return self::request()?->route()?->uri();
        } catch (Throwable) {
            return null;
        }
    }

    public static function method(): ?string
    {
        try {
            return self::request()?->method();
        } catch (Throwable) {
            return null;
        }
    }

    public static function userId(): int|string|null
    {
        try {
            if (! app()->bound('auth')) {
                return null;
            }

            return auth()->id();
        } catch (Throwable) {
            return null;
        }
    }

    public static function ipAddress(): string
    {
        try {
            return self::request()?->ip() ?: '127.0.0.1';
        } catch (Throwable) {
            return '127.0.0.1';
        }
    }

    private static function request(): mixed
    {
        if (! app()->bound('request')) {
            return null;
        }

        return app('request');
    }
}
