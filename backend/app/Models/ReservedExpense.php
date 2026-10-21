<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ReservedExpense extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'cycle_id',
        'title',
        'category',
        'allocated_amount',
        'spent_amount',
        'is_optional',
    ];

    protected $casts = [
        'allocated_amount' => 'decimal:2',
        'spent_amount' => 'decimal:2',
        'is_optional' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function budgetCycle()
    {
        return $this->belongsTo(BudgetCycle::class, 'cycle_id');
    }

    public function expenses()
    {
        return $this->hasMany(Expense::class, 'reserve_id');
    }

    public function scheduledPayments()
    {
        return $this->hasMany(ScheduledPayment::class, 'reserve_id');
    }
}
