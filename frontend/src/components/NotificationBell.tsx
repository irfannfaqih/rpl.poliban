"use client";

import api from "@/lib/api";
import {
    NotificationItem,
    notificationQueryKey,
    notificationQueryOptions,
} from "@/hooks/useNotifications";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    Bell,
    CheckCheck,
    Loader2,
    X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "Baru saja";
    if (m < 60) return `${m} menit lalu`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} jam lalu`;
    const d = Math.floor(h / 24);
    return `${d} hari lalu`;
}

function typeColor(type: string) {
    switch (type) {
        case "success": return "bg-emerald-500";
        case "warning": return "bg-amber-500";
        case "info": return "bg-blue-500";
        case "schedule": return "bg-violet-500";
        case "payment": return "bg-green-500";
        default: return "bg-primary";
    }
}

export function NotificationBell() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // Tutup dropdown saat klik di luar
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const { data, isLoading } = useQuery({
        ...notificationQueryOptions,
    });

    const notifs: NotificationItem[] = data?.data || [];
    const unreadCount: number = data?.unread_count ?? 0;

    const markReadMutation = useMutation({
        mutationFn: (id: number) => api.patch(`/notifikasi/${id}/read`),
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: notificationQueryKey });
            const previousData = queryClient.getQueryData(notificationQueryKey);
            queryClient.setQueryData(notificationQueryKey, (old: any) => {
                if (!old) return old;
                return {
                    ...old,
                    unread_count: Math.max(0, old.unread_count - 1),
                    data: (old.data || []).map((n: any) => n.id === id ? { ...n, is_read: true } : n)
                };
            });
            return { previousData };
        },
        onError: (err, id, context) => {
            queryClient.setQueryData(notificationQueryKey, context?.previousData);
        },
    });

    const markAllReadMutation = useMutation({
        mutationFn: () => api.patch("/notifikasi/read-all"),
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: notificationQueryKey });
            const previousData = queryClient.getQueryData(notificationQueryKey);
            queryClient.setQueryData(notificationQueryKey, (old: any) => {
                if (!old) return old;
                return {
                    ...old,
                    unread_count: 0,
                    data: (old.data || []).map((n: any) => ({ ...n, is_read: true }))
                };
            });
            return { previousData };
        },
        onError: (err, _, context) => {
            queryClient.setQueryData(notificationQueryKey, context?.previousData);
        },
    });

    const handleClick = (notif: NotificationItem) => {
        if (!notif.is_read) markReadMutation.mutate(notif.id);
        setOpen(false);
        if (notif.href) router.push(notif.href);
    };

    return (
        <div className="relative" ref={ref}>
            {/* Bell button */}
            <button
                onClick={() => setOpen((o) => !o)}
                className="relative flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted transition-colors"
                aria-label="Notifikasi"
            >
                <Bell className="h-5 w-5 text-muted-foreground" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white leading-none">
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute right-0 top-11 z-50 w-80 rounded-2xl border bg-card shadow-xl overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b">
                        <div className="flex items-center gap-2">
                            <Bell className="h-4 w-4 text-primary" />
                            <span className="text-sm font-bold">Notifikasi</span>
                            {unreadCount > 0 && (
                                <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                                    {unreadCount}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                            {unreadCount > 0 && (
                                <button
                                    onClick={() => markAllReadMutation.mutate()}
                                    disabled={markAllReadMutation.isPending}
                                    className="flex items-center gap-1 text-[11px] text-primary hover:underline font-medium"
                                    title="Tandai semua dibaca"
                                >
                                    <CheckCheck className="h-3.5 w-3.5" />
                                    Semua dibaca
                                </button>
                            )}
                            <button onClick={() => setOpen(false)} className="ml-2 rounded p-1 hover:bg-muted">
                                <X className="h-3.5 w-3.5 text-muted-foreground" />
                            </button>
                        </div>
                    </div>

                    {/* List */}
                    <div className="max-h-96 overflow-y-auto">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-10">
                                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            </div>
                        ) : notifs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                <Bell className="h-8 w-8 text-muted-foreground/30 mb-2" />
                                <p className="text-sm text-muted-foreground">Belum ada notifikasi</p>
                            </div>
                        ) : (
                            notifs.map((notif) => (
                                <button
                                    key={notif.id}
                                    onClick={() => handleClick(notif)}
                                    className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors border-b last:border-0 ${!notif.is_read ? "bg-primary/5" : ""
                                        }`}
                                >
                                    {/* Dot indikator tipe */}
                                    <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${typeColor(notif.type)}`} />
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-xs font-semibold text-foreground truncate ${!notif.is_read ? "font-bold" : ""}`}>
                                            {notif.title}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                                            {notif.message}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground/60 mt-1">
                                            {timeAgo(notif.created_at)}
                                        </p>
                                    </div>
                                    {!notif.is_read && (
                                        <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                                    )}
                                </button>
                            ))
                        )}
                    </div>

                    {/* Footer — semua notifikasi sudah tampil di dropdown (max 10) */}
                    {notifs.length > 0 && unreadCount > 0 && (
                        <div className="border-t px-4 py-2.5">
                            <button
                                onClick={() => markAllReadMutation.mutate()}
                                disabled={markAllReadMutation.isPending}
                                className="w-full text-xs text-muted-foreground hover:text-foreground py-1 transition-colors text-center"
                            >
                                Tandai semua sudah dibaca
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
