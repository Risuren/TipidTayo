<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ScheduledPayment extends Model
{
    use HasFactory;

    protected $table = 'scheduled_payments';

    protected $fillable = [
        'user_id',
        'cycle_id',
        'reserve_id',
        'title',
        'category',
        'amount',
        'target_day',
        'due_date',
        'status',
        'paid_expense_id',
        'notes',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'target_day' => 'integer',
        'due_date' => 'date',
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

    public function paidExpense()
    {
        return $this->belongsTo(Expense::class, 'paid_expense_id');
    }
}
