import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

const INACTIVITY_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 jam dalam milidetik
const WARNING_BEFORE_MS = 5 * 60 * 1000;           // Peringatan 5 menit sebelum logout

/**
 * Hook yang memantau aktivitas user.
 * Jika tidak ada aktivitas selama 2 jam, logout otomatis.
 * Peringatan muncul 5 menit sebelum logout.
 *
 * Event yang dianggap "aktivitas": mouse move, click, scroll, keypress.
 */
export function useInactivityLogout() {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const logout = useAuthStore((state) => state.logout);
    const router = useRouter();
    const timerLogout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const timerWarning = useRef<ReturnType<typeof setTimeout> | null>(null);
    const warningToastId = useRef<string | number | null>(null);

    useEffect(() => {
        // Hanya aktif jika user sedang login
        if (!isAuthenticated) return;

        const resetTimer = () => {
            // Batalkan timer sebelumnya
            if (timerLogout.current) clearTimeout(timerLogout.current);
            if (timerWarning.current) clearTimeout(timerWarning.current);

            // Dismiss peringatan jika masih tampil
            if (warningToastId.current) {
                toast.dismiss(warningToastId.current);
                warningToastId.current = null;
            }

            // Set timer peringatan (5 menit sebelum logout)
            timerWarning.current = setTimeout(() => {
                warningToastId.current = toast.warning("Sesi hampir berakhir", {
                    description: "Anda akan dikeluarkan dalam 5 menit karena tidak ada aktivitas.",
                    duration: WARNING_BEFORE_MS,
                });
            }, INACTIVITY_TIMEOUT_MS - WARNING_BEFORE_MS);

            // Set timer logout
            timerLogout.current = setTimeout(async () => {
                toast.dismiss(warningToastId.current ?? undefined);
                await logout();
                toast.info("Sesi berakhir", {
                    description: "Anda telah dikeluarkan karena tidak ada aktivitas selama 2 jam.",
                });
                router.replace("/auth/login?reason=inactivity");
            }, INACTIVITY_TIMEOUT_MS);
        };

        // Event yang dianggap aktivitas
        const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart", "click"];

        // Pasang event listener
        events.forEach((event) => window.addEventListener(event, resetTimer, { passive: true }));

        // Mulai timer pertama kali
        resetTimer();

        // Cleanup saat unmount atau isAuthenticated berubah
        return () => {
            events.forEach((event) => window.removeEventListener(event, resetTimer));
            if (timerLogout.current) clearTimeout(timerLogout.current);
            if (timerWarning.current) clearTimeout(timerWarning.current);
        };
    }, [isAuthenticated, logout, router]);
}
