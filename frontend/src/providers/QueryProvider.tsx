"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // Instansiasi di dalam state agar tidak share cache antar-user di server
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // Data dianggap fresh selama 1 menit (tidak fetch ulang saat ganti tab)
            refetchOnWindowFocus: true, // Fetch ulang saat user kembali ke tab web (baik untuk data real-time)
            retry: 1, // Hanya retry 1 kali jika request gagal
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
