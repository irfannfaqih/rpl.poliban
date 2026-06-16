"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import { useMutation } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Eye, EyeOff, KeyRound, Loader2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ChangePasswordModalProps {
    open: boolean;
    onClose: () => void;
}

export function ChangePasswordModal({ open, onClose }: ChangePasswordModalProps) {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [newPasswordConfirmation, setNewPasswordConfirmation] = useState("");
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const mutation = useMutation({
        mutationFn: async () => {
            const { data } = await api.post("/update-password", {
                current_password: currentPassword,
                new_password: newPassword,
                new_password_confirmation: newPasswordConfirmation,
            });
            return data;
        },
        onSuccess: (data) => {
            toast.success(data.message || "Kata sandi berhasil diubah!");
            handleClose();
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || "Gagal mengubah kata sandi.");
        },
    });

    const handleClose = () => {
        setCurrentPassword("");
        setNewPassword("");
        setNewPasswordConfirmation("");
        setShowCurrent(false);
        setShowNew(false);
        setShowConfirm(false);
        onClose();
    };

    const isValid =
        currentPassword.length > 0 &&
        newPassword.length >= 8 &&
        newPassword === newPasswordConfirmation;

    const mismatch = newPasswordConfirmation.length > 0 && newPassword !== newPasswordConfirmation;

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 16 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 16 }}
                        transition={{ duration: 0.2 }}
                        className="bg-background border rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                    <KeyRound className="h-4.5 w-4.5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-foreground">Ganti Kata Sandi</h3>
                                    <p className="text-xs text-muted-foreground">Pastikan minimal 8 karakter</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleClose}
                                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Form */}
                        <div className="space-y-3">
                            {/* Kata sandi saat ini */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                    Kata Sandi Saat Ini
                                </Label>
                                <div className="relative">
                                    <Input
                                        type={showCurrent ? "text" : "password"}
                                        placeholder="Masukkan kata sandi saat ini"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="h-10 pr-10 bg-background"
                                    />
                                    <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                        {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Kata sandi baru */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                    Kata Sandi Baru
                                </Label>
                                <div className="relative">
                                    <Input
                                        type={showNew ? "text" : "password"}
                                        placeholder="Minimal 8 karakter"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="h-10 pr-10 bg-background"
                                    />
                                    <button type="button" onClick={() => setShowNew(!showNew)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                        {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {newPassword.length > 0 && newPassword.length < 8 && (
                                    <p className="text-[11px] text-amber-600">Minimal 8 karakter</p>
                                )}
                            </div>

                            {/* Konfirmasi */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                    Konfirmasi Kata Sandi Baru
                                </Label>
                                <div className="relative">
                                    <Input
                                        type={showConfirm ? "text" : "password"}
                                        placeholder="Ulangi kata sandi baru"
                                        value={newPasswordConfirmation}
                                        onChange={(e) => setNewPasswordConfirmation(e.target.value)}
                                        className={`h-10 pr-10 bg-background ${mismatch ? "border-red-400 focus-visible:ring-red-400" : newPasswordConfirmation && !mismatch ? "border-emerald-400" : ""}`}
                                    />
                                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {mismatch && (
                                    <p className="text-[11px] text-red-600">Kata sandi tidak cocok</p>
                                )}
                                {!mismatch && newPasswordConfirmation && newPassword === newPasswordConfirmation && (
                                    <p className="text-[11px] text-emerald-600 flex items-center gap-1">
                                        <CheckCircle2 className="h-3 w-3" /> Kata sandi cocok
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Tombol */}
                        <div className="flex gap-3 pt-1">
                            <Button variant="outline" className="flex-1 h-10" onClick={handleClose}
                                disabled={mutation.isPending}>
                                Batal
                            </Button>
                            <Button className="flex-1 h-10 gap-2" disabled={!isValid || mutation.isPending}
                                onClick={() => mutation.mutate()}>
                                {mutation.isPending
                                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...</>
                                    : "Simpan"}
                            </Button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
