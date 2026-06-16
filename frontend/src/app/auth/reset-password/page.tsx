"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      await api.post("/reset-password", {
        token,
        email,
        password,
        password_confirmation: confirmation,
      });
      setCompleted(true);
      toast.success("Password berhasil diubah");
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          "Tautan reset tidak valid atau sudah kedaluwarsa.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!token || !email) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-xl font-bold">Tautan Tidak Valid</h1>
        <p className="text-sm text-muted-foreground">
          Minta tautan reset baru dari halaman masuk.
        </p>
        <Link
          href="/auth/login"
          className={cn(buttonVariants({ variant: "default" }))}
        >
          Kembali ke Login
        </Link>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-xl font-bold">Password Berhasil Diubah</h1>
        <p className="text-sm text-muted-foreground">
          Silakan masuk menggunakan password baru Anda.
        </p>
        <Link
          href="/auth/login"
          className={cn(buttonVariants({ variant: "default" }))}
        >
          Masuk
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">Atur Password Baru</h1>
        <p className="mt-1 text-sm text-muted-foreground">{email}</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password Baru</Label>
        <Input
          id="password"
          type="password"
          minLength={8}
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmation">Konfirmasi Password</Label>
        <Input
          id="confirmation"
          type="password"
          minLength={8}
          required
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
        />
      </div>
      <Button
        type="submit"
        className="w-full"
        disabled={submitting || password !== confirmation}
      >
        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Simpan Password
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<Loader2 className="h-6 w-6 animate-spin" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
