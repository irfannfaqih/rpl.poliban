<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MatriksAsesmen extends Model
{
    use HasFactory;

    protected $table = 'matriks_asesmen';

    protected $fillable = [
        'mata_kuliah_id',
        'c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9', 'c10', 'c11'
    ];

    protected $casts = [
        'c1' => 'boolean',
        'c2' => 'boolean',
        'c3' => 'boolean',
        'c4' => 'boolean',
        'c5' => 'boolean',
        'c6' => 'boolean',
        'c7' => 'boolean',
        'c8' => 'boolean',
        'c9' => 'boolean',
        'c10' => 'boolean',
        'c11' => 'boolean',
    ];

    public function mataKuliah()
    {
        return $this->belongsTo(MataKuliah::class);
    }
}
