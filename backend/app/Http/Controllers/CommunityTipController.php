<?php

namespace App\Http\Controllers;

use App\Models\CommunityTip;
use Illuminate\Http\Request;

class CommunityTipController extends Controller
{
    /**
     * Retrieve list of community tips with optional category filter.
     */
    public function index(Request $request)
    {
        $query = CommunityTip::query();

        if ($request->filled('category') && $request->category !== 'All') {
            $query->where('category', $request->category);
        }

        // Default sort by most upvoted, then newest
        $tips = $query->orderByDesc('upvotes_count')
            ->orderByDesc('id')
            ->limit(50)
            ->get();

        return response()->json($tips);
    }

    /**
     * Submit a new student diskarte tip.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'tip_text' => ['required', 'string', 'min:8', 'max:500'],
            'category' => ['required', 'string', 'in:Food & Meals,Commute & Fare,Academics & Printing,Tight Budget Survival'],
            'author_pseudonym' => ['nullable', 'string', 'max:100'],
            'saves_estimate' => ['nullable', 'string', 'max:60'],
        ]);

        $pseudonym = trim($validated['author_pseudonym'] ?? '');
        if (empty($pseudonym)) {
            $user = $request->user();
            $pseudonym = $user && $user->name ? $user->name : 'Anonymous Student';
        }

        $tip = CommunityTip::create([
            'user_id' => $request->user() ? $request->user()->id : null,
            'author_pseudonym' => $pseudonym,
            'category' => $validated['category'],
            'tip_text' => trim($validated['tip_text']),
            'saves_estimate' => $validated['saves_estimate'] ?: 'Saves daily baon',
            'upvotes_count' => 1, // Author's initial like
        ]);

        return response()->json([
            'message' => 'Nai-share na ang iyong tipid tip sa komunidad!',
            'tip' => $tip,
        ], 201);
    }

    /**
     * Upvote a community tip ("Nakatipid Ako Dito").
     */
    public function upvote(Request $request, $id)
    {
        $tip = CommunityTip::findOrFail($id);
        $tip->increment('upvotes_count');

        return response()->json([
            'message' => 'Salamat sa pagboto! Nakatulong ito sa ibang estudyante.',
            'tip' => $tip->fresh(),
        ]);
    }
}
