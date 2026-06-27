<?php

return [
    'default' => env('PAYMENT_GATEWAY', 'midtrans'),

    'midtrans' => [
        'is_production' => env('MIDTRANS_IS_PRODUCTION', false),
        'merchant_id' => env('MIDTRANS_MERCHANT_ID'),
        'client_key' => env('MIDTRANS_CLIENT_KEY'),
        'server_key' => env('MIDTRANS_SERVER_KEY'),
        'sanitize' => env('MIDTRANS_SANITIZE', true),
        'three_ds' => env('MIDTRANS_3DS', true),
        'notification_url' => env('MIDTRANS_NOTIFICATION_URL'),
        'finish_redirect_url' => env('MIDTRANS_FINISH_REDIRECT_URL'),
        'unfinish_redirect_url' => env('MIDTRANS_UNFINISH_REDIRECT_URL'),
        'error_redirect_url' => env('MIDTRANS_ERROR_REDIRECT_URL'),
    ],
];
