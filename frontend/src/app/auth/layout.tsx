import { ThemeToggle } from "@/components/theme-toggle";
import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Masuk - Sistem RPL POLIBAN",
  description: "Masuk ke akun RPL POLIBAN Anda untuk melanjutkan pendaftaran.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Left - Decorative Panel */}
      <div className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-primary via-blue-600 to-blue-500 lg:flex lg:flex-col lg:justify-between p-12">
        {/* Floating shapes */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -right-24 h-[400px] w-[400px] rounded-full bg-white/5" />
          <div className="absolute bottom-20 -left-16 h-[300px] w-[300px] rounded-full bg-white/5" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[200px] w-[200px] rounded-full bg-white/5" />
        </div>

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10">
              <Image
                src="/poliban.png"
                alt="Logo POLIBAN"
                fill
                className="object-contain"
              />
            </div>
            <div className="flex flex-col leading-tight text-white">
              <span className="text-sm font-semibold uppercase tracking-tight">Sistem RPL</span>
              <span className="text-[11px] font-medium text-blue-100 italic">POLIBAN</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-md">
          <h2 className="text-3xl font-bold leading-tight text-white">
            Wujudkan Pengalaman Kerja Anda Menjadi Kredit Akademik
          </h2>
          <p className="mt-4 text-blue-100 leading-relaxed">
            Sistem Rekognisi Pembelajaran Lampau (RPL) Politeknik Negeri
            Banjarmasin membantu Anda mengkonversi pengalaman profesional
            menjadi pengakuan akademik resmi.
          </p>
        </div>

        <div className="relative z-10 text-xs text-blue-200">
          © {new Date().getFullYear()} Politeknik Negeri Banjarmasin
        </div>
      </div>

      {/* Right - Form Area */}
      <div className="relative flex flex-1 items-center justify-center px-6 py-12">
        <div className="absolute top-6 right-6">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
