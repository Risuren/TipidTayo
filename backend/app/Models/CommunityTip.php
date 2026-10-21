<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CommunityTip extends Model
{
    use HasFactory;

    protected $table = 'community_tips';

    protected $fillable = [
        'user_id',
        'author_pseudonym',
        'category',
        'tip_text',
        'saves_estimate',
        'upvotes_count',
    ];

    protected $casts = [
        'upvotes_count' => 'integer',
        'user_id' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
