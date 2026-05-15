<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Facultad extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'facultades';

    protected $fillable = [
        'nombre',
    ];

    protected $casts = [];

    public function carreras(): HasMany
    {
        return $this->hasMany(Carrera::class, 'facultad_id');
    }

    public function usuarios(): HasMany
    {
        return $this->hasMany(Usuario::class, 'facultad_id');
    }

    public function rolesUsuario(): HasMany
    {
        return $this->hasMany(RolUsuario::class, 'facultad_id');
    }

    public function notificaciones(): HasMany
    {
        return $this->hasMany(Notificacion::class, 'facultad_id');
    }
}
