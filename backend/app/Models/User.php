<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'google_id',
        'avatar_url',
        'onboarding_completed',
        'has_seen_tutorial',
        'email_verified_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'onboarding_completed' => 'boolean',
            'has_seen_tutorial' => 'boolean',
        ];
    }

    public function budgetCycles()
    {
        return $this->hasMany(BudgetCycle::class);
    }

    public function activeCycle()
    {
        return $this->hasOne(BudgetCycle::class)->where('is_active', true)->latest('id');
    }

    public function reservedExpenses()
    {
        return $this->hasMany(ReservedExpense::class);
    }

    public function expenses()
    {
        return $this->hasMany(Expense::class);
    }
}
