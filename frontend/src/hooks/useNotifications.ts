"use client";

import api from "@/lib/api";
import { queryOptions } from "@tanstack/react-query";

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: string;
  href: string | null;
  is_read: boolean;
  created_at: string;
}

export interface NotificationData {
  data: NotificationItem[];
  unread_count: number;
  next_page_url?: string | null;
  prev_page_url?: string | null;
}

export const notificationQueryKey = (userId?: number | null) =>
  ["notifications", userId] as const;

export const notificationQueryOptions = (userId?: number | null) => queryOptions({
  queryKey: notificationQueryKey(userId),
  queryFn: async (): Promise<NotificationData> => {
    const response = await api.get("/notifikasi?per_page=10");
    return response.data;
  },
  enabled: Boolean(userId),
  refetchInterval: 60_000,
  refetchIntervalInBackground: false,
  refetchOnWindowFocus: true,
  staleTime: 30_000,
});
