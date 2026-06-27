<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentGatewayEvent extends Model
{
    protected $table = 'payment_gateway_events';

    protected $fillable = [
        'payment_id',
        'gateway',
        'event_type',
        'order_id',
        'transaction_status',
        'fraud_status',
        'signature_valid',
        'payload',
        'received_at',
        'processed_at',
        'processing_result',
    ];

    protected function casts(): array
    {
        return [
            'signature_valid' => 'boolean',
            'payload' => 'array',
            'received_at' => 'datetime',
            'processed_at' => 'datetime',
        ];
    }

    public function payment()
    {
        return $this->belongsTo(Payment::class);
    }
}
