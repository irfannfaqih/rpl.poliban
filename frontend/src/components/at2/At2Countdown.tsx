"use client";

import { AlertTriangle, Timer } from "lucide-react";
import { memo, useEffect, useRef, useState } from "react";

interface At2CountdownProps {
  targetIso: string | null;
  variant?: "exam" | "inline" | "large" | "expired";
  onExpire?: () => void;
}

function formatRemaining(remaining: number): string {
  const hours = Math.floor(remaining / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1_000);

  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

export const At2Countdown = memo(function At2Countdown({
  targetIso,
  variant = "inline",
  onExpire,
}: At2CountdownProps) {
  const [remaining, setRemaining] = useState<number | null>(null);
  const onExpireRef = useRef(onExpire);
  const expiredRef = useRef(false);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    expiredRef.current = false;
    if (!targetIso) {
      setRemaining(null);
      return;
    }

    const target = new Date(targetIso).getTime();
    const update = () => {
      const next = Math.max(0, target - Date.now());
      setRemaining(next);
      if (next === 0 && !expiredRef.current) {
        expiredRef.current = true;
        onExpireRef.current?.();
      }
    };

    update();
    const interval = window.setInterval(update, 1_000);
    return () => window.clearInterval(interval);
  }, [targetIso]);

  if (remaining === null) return null;

  if (variant === "expired") {
    if (remaining > 0) return null;

    return (
      <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-4 py-2.5 text-sm text-amber-800 dark:text-amber-300">
        Waktu pengerjaan telah berakhir. Menunggu pemohon mengirim jawaban...
      </div>
    );
  }

  if (variant === "exam") {
    if (remaining === 0) {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-red-500 text-white border-red-500 text-sm font-bold">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          Waktu Habis
        </div>
      );
    }

    const color = remaining < 300_000
      ? "bg-red-500 text-white border-red-500 animate-pulse"
      : remaining < 600_000
        ? "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700"
        : "bg-primary/5 text-foreground border-border";

    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border font-mono font-bold text-sm ${color}`}>
        <Timer className="h-3.5 w-3.5 shrink-0" />
        <span>{formatRemaining(remaining)}</span>
      </div>
    );
  }

  if (remaining === 0) return null;

  if (variant === "large") {
    return (
      <div className="ml-auto text-right">
        <p className="text-[10px] text-muted-foreground">Sisa waktu</p>
        <p className="font-mono text-xl font-bold text-emerald-700 dark:text-emerald-400">
          {formatRemaining(remaining)}
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-1.5">
      <Timer className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
      <span className="font-mono text-sm font-bold text-emerald-700 dark:text-emerald-300">
        {formatRemaining(remaining)}
      </span>
      <span className="text-xs text-emerald-600 dark:text-emerald-400">sisa</span>
    </div>
  );
});
