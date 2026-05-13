<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    protected $table = 'audit_log';
    public $timestamps = false;

    protected $fillable = ['user_id', 'action', 'module', 'detail', 'ip_address', 'created_at'];
    protected function casts(): array { return ['created_at' => 'datetime']; }

    public function user() { return $this->belongsTo(User::class); }
}
