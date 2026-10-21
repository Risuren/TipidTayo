<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Expense extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'cycle_id',
        'reserve_id',
        'title',
        'category',
        'amount',
        'is_from_reserved',
        'logged_via',
        'logged_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'is_from_reserved' => 'boolean',
        'logged_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function budgetCycle()
    {
        return $this->belongsTo(BudgetCycle::class, 'cycle_id');
    }

    public function reservedExpense()
    {
        return $this->belongsTo(ReservedExpense::class, 'reserve_id');
    }
}
