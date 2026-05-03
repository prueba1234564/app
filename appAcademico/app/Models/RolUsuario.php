<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RolUsuario extends Model
{
    use HasFactory;

    protected $table = 'roles_usuario';

    protected $fillable = [
        'usuario_id',
        'rol',
        'carrera_id',
        'facultad_id',
    ];

    protected $casts = [
        'rol' => 'string',
    ];

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }

    public function carrera(): BelongsTo
    {
        return $this->belongsTo(Carrera::class, 'carrera_id');
    }

    public function facultad(): BelongsTo
    {
        return $this->belongsTo(Facultad::class, 'facultad_id');
    }
}
