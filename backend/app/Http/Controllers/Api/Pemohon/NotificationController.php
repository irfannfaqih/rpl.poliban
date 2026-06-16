<?php

namespace App\Http\Controllers\Api\Pemohon;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class NotificationController extends Controller
{
    /**
     * Get all notifications for the authenticated user
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = min(max($request->integer('per_page', 10), 1), 50);
        $notifications = $request->user()->notifications()
            ->select([
                'id',
                'user_id',
                'title',
                'message',
                'type',
                'href',
                'is_read',
                'created_at',
            ])
            ->orderBy('created_at', 'desc')
            ->simplePaginate($perPage);

        $data = $notifications->toArray();
        $data['unread_count'] = $request->user()
            ->notifications()
            ->where('is_read', false)
            ->count();

        return response()->json($data);
    }

    /**
     * Mark a specific notification as read
     */
    public function markRead(Request $request, $id): JsonResponse
    {
        $notification = $request->user()->notifications()->findOrFail($id);
        
        $notification->update(['is_read' => true]);

        return response()->json(['message' => 'Notifikasi ditandai sudah dibaca']);
    }

    /**
     * Mark all notifications as read
     */
    public function markAllRead(Request $request): JsonResponse
    {
        $request->user()->notifications()->update(['is_read' => true]);

        return response()->json(['message' => 'Semua notifikasi ditandai sudah dibaca']);
    }
}
