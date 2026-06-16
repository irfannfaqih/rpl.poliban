<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AuditLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = AuditLog::with('user:id,nama,email,role');

        if ($request->filled('action')) {
            $query->where('action', $request->action);
        }
        if ($request->filled('module')) {
            $query->where('module', $request->module);
        }
        if ($request->filled('search')) {
            $search = trim((string) $request->search);

            if (DB::getDriverName() === 'mysql' && mb_strlen($search) >= 3) {
                $matches = DB::table('audit_log')
                    ->select('audit_log.id')
                    ->whereFullText('audit_log.detail', $search)
                    ->union(
                        DB::table('audit_log')
                            ->select('audit_log.id')
                            ->join('users', 'users.id', '=', 'audit_log.user_id')
                            ->where('users.nama', 'like', "%{$search}%"),
                    )
                    ->union(
                        DB::table('audit_log')
                            ->select('audit_log.id')
                            ->where('audit_log.module', 'like', "%{$search}%"),
                    );

                $query->whereIn('audit_log.id', $matches);
            } else {
                $query->where(
                    fn ($q) => $q
                        ->where('detail', 'like', "%{$search}%")
                        ->orWhere('module', 'like', "%{$search}%")
                        ->orWhereHas(
                            'user',
                            fn ($user) => $user->where('nama', 'like', "%{$search}%"),
                        ),
                );
            }
        }
        if ($request->filled('from')) {
            $query->where('created_at', '>=', $request->from);
        }
        if ($request->filled('to')) {
            $query->where('created_at', '<=', $request->to . ' 23:59:59');
        }

        $data = $query->orderByDesc('created_at')->paginate($request->get('per_page', 20));

        return response()->json($data);
    }
}
