<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    protected $table = 'payments';

    protected $fillable = [
        'pendaftaran_id',
        'gateway',
        'order_id',
        'amount',
        'currency',
        'status',
        'snap_token',
        'redirect_url',
        'payment_type',
        'va_number',
        'qr_string',
        'paid_at',
        'expired_at',
        'raw_response',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'integer',
            'raw_response' => 'array',
            'paid_at' => 'datetime',
            'expired_at' => 'datetime',
        ];
    }

    public function pendaftaran()
    {
        return $this->belongsTo(Pendaftaran::class);
    }

    public function events()
    {
        return $this->hasMany(PaymentGatewayEvent::class);
    }

    public function isPaid(): bool
    {
        return in_array($this->status, ['settlement', 'capture'], true);
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isExpiredOrFailed(): bool
    {
        return in_array($this->status, ['expire', 'cancel', 'deny', 'failure'], true);
    }
}
