"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

type LegalSection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

type LegalPageLayoutProps = {
  title: string;
  description: string;
  sections: LegalSection[];
};

const legalLinks = [
  { href: "/kebijakan-refund", label: "Kebijakan Refund" },
  { href: "/syarat-ketentuan", label: "Syarat & Ketentuan" },
  { href: "/kebijakan-privasi", label: "Kebijakan Privasi" },
];

export function LegalPageLayout({
  title,
  description,
  sections,
}: LegalPageLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="relative h-9 w-9">
              <Image
                src="/poliban.png"
                alt="Logo POLIBAN"
                fill
                className="object-contain"
              />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold uppercase tracking-tight">
                Sistem RPL
              </span>
              <span className="text-[11px] font-medium italic text-muted-foreground">
                POLIBAN
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/">
              <Button variant="outline" size="sm">
                Kembali ke Beranda
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 py-16 md:py-20">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            Informasi Layanan
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-5xl">
            {title}
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg">
            {description}
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            Terakhir diperbarui: 2026
          </p>

          <div className="mt-10 space-y-5">
            {sections.map((section) => (
              <section
                key={section.title}
                className="rounded-2xl border border-border/60 bg-card p-6 md:p-8"
              >
                <h2 className="text-lg font-semibold">{section.title}</h2>
                {section.paragraphs?.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="mt-3 text-sm leading-relaxed text-muted-foreground"
                  >
                    {paragraph}
                  </p>
                ))}
                {section.bullets && (
                  <ul className="mt-4 space-y-2 text-sm leading-relaxed text-muted-foreground">
                    {section.bullets.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t border-border/60 bg-card px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>
            &copy; {new Date().getFullYear()} Politeknik Negeri Banjarmasin.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/" className="transition-colors hover:text-foreground">
              Beranda
            </Link>
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
