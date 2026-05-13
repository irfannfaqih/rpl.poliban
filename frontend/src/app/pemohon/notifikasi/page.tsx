"use client";

import { usePendaftaranStore } from "@/store/usePendaftaranStore";
import { Bell, Clock, Info, CalendarDays, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

const notifications = [
  {
    id: 1,
    title: "Jadwal Asesmen Ditetapkan",
    message: "Admin Program Studi telah menetapkan jadwal Asesmen Tahap 2 (Wawancara) Anda. Silakan lihat detail di Dashboard atau menu Jadwal.",
    time: "Hari ini, 09:42",
    type: "schedule",
    icon: CalendarDays,
    color: "border-amber-500/20 bg-amber-500/[0.03]",
    iconColor: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30",
    href: "/pemohon/jadwal"
  },
  {
    id: 2,
    title: "Berkas Terverifikasi",
    message: "Pendaftaran Anda telah lolos tahap verifikasi berkas awal. Tahap selanjutnya adalah Konsultasi Pra Asesmen.",
    time: "Kemarin, 14:20",
    type: "status",
    icon: CheckCircle2,
    color: "border-border bg-card",
    iconColor: "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30",
  },
  {
    id: 3,
    title: "Pembayaran Berhasil",
    message: "Pembayaran pendaftaran RPL Anda telah dikonfirmasi oleh sistem. Terima kasih.",
    time: "2 hari yang lalu",
    type: "payment",
    icon: Info,
    color: "border-border bg-card",
    iconColor: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30",
  },
];

export default function NotifikasiPage() {
  const namaLengkap = usePendaftaranStore((s) => s.namaLengkap);

  return (
    <div className="p-6 pb-20 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight">Pemberitahuan</h1>
        <p className="mt-1 text-xs text-muted-foreground italic">
          Pantau update terbaru mengenai pendaftaran RPL Anda di sini.
        </p>
      </div>

      <div className="space-y-4">
        {notifications.map((notif, i) => {
          const Content = (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`group rounded-2xl border p-5 transition-shadow hover:shadow-md ${notif.color} ${notif.href ? "cursor-pointer" : ""}`}
            >
              <div className="flex gap-5 items-start">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border shadow-sm shadow-black/5 ${notif.iconColor}`}>
                  <notif.icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                    <h3 className="font-bold text-foreground text-base">{notif.title}</h3>
                    <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {notif.time}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {notif.message}
                  </p>
                </div>
              </div>
            </motion.div>
          );

          return notif.href ? (
            <Link key={notif.id} href={notif.href} className="block">
              {Content}
            </Link>
          ) : (
            <div key={notif.id} className="block">
              {Content}
            </div>
          );
        })}
      </div>

      {notifications.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
            <Bell className="h-10 w-10 text-muted-foreground/50" />
          </div>
          <h3 className="text-xl font-semibold">Belum Ada Pemberitahuan</h3>
          <p className="text-muted-foreground max-w-xs mx-auto mt-2">
            Pemberitahuan mengenai jadwal dan status pendaftaran Anda akan muncul di sini.
          </p>
        </div>
      )}
    </div>
  );
}
