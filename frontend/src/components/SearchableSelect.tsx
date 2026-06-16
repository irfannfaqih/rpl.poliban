"use client";

import { Input } from "@/components/ui/input";
import { ChevronDown, Loader2, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export interface SearchableSelectOption {
    value: string;
    label: string;
    sublabel?: string;
}

interface SearchableSelectProps {
    options: SearchableSelectOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    loading?: boolean;
    disabled?: boolean;
    className?: string;
}

export function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = "Pilih...",
    searchPlaceholder = "Cari...",
    loading = false,
    disabled = false,
    className = "",
}: SearchableSelectProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const ref = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Tutup saat klik di luar
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
                setSearch("");
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // Fokus input saat dropdown buka
    useEffect(() => {
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [open]);

    const filtered = options.filter((o) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return o.label.toLowerCase().includes(q) || (o.sublabel || "").toLowerCase().includes(q);
    });

    const selected = options.find((o) => o.value === value);

    const handleSelect = (val: string) => {
        onChange(val);
        setOpen(false);
        setSearch("");
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange("");
    };

    if (loading) {
        return (
            <div className={`flex items-center gap-2 h-10 px-3 border rounded-lg bg-muted/20 ${className}`}>
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Memuat data...</span>
            </div>
        );
    }

    return (
        <div ref={ref} className={`relative ${className}`}>
            {/* Trigger */}
            <button
                type="button"
                disabled={disabled}
                onClick={() => !disabled && setOpen(!open)}
                className={`w-full h-10 flex items-center justify-between px-3 border rounded-lg bg-background text-sm transition-colors
          ${disabled ? "opacity-50 cursor-not-allowed" : "hover:border-primary/50 cursor-pointer"}
          focus:outline-none focus:ring-2 focus:ring-primary/20`}
            >
                {selected ? (
                    <span className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="font-medium text-foreground truncate">{selected.label}</span>
                        {selected.sublabel && (
                            <span className="text-xs text-muted-foreground font-mono shrink-0">{selected.sublabel}</span>
                        )}
                    </span>
                ) : (
                    <span className="text-muted-foreground flex-1 text-left">{placeholder}</span>
                )}

                <div className="flex items-center gap-1 ml-2 shrink-0">
                    {value && !disabled && (
                        <span
                            role="button"
                            tabIndex={0}
                            onClick={handleClear}
                            onKeyDown={(e) => e.key === "Enter" && handleClear(e as any)}
                            className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X className="h-3.5 w-3.5" />
                        </span>
                    )}
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
                </div>
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute z-50 mt-1 w-full bg-background border rounded-xl shadow-lg overflow-hidden">
                    {/* Search */}
                    <div className="p-2 border-b">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                            <Input
                                ref={inputRef}
                                placeholder={searchPlaceholder}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-8 h-8 text-sm bg-muted/30 border-0 focus-visible:ring-1"
                            />
                        </div>
                    </div>

                    {/* Options */}
                    <div className="max-h-60 overflow-y-auto">
                        {filtered.length === 0 ? (
                            <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                                {search ? `Tidak ada hasil untuk "${search}"` : "Tidak ada pilihan tersedia"}
                            </div>
                        ) : (
                            filtered.map((o) => (
                                <button
                                    key={o.value}
                                    type="button"
                                    onClick={() => handleSelect(o.value)}
                                    className={`w-full flex items-center justify-between px-3 py-2.5 text-left text-sm hover:bg-muted/50 transition-colors
                    ${value === o.value ? "bg-primary/5" : ""}`}
                                >
                                    <span className="min-w-0 flex-1">
                                        <span className={`font-medium block truncate ${value === o.value ? "text-primary" : "text-foreground"}`}>
                                            {o.label}
                                        </span>
                                        {o.sublabel && (
                                            <span className="text-xs text-muted-foreground font-mono">{o.sublabel}</span>
                                        )}
                                    </span>
                                    {value === o.value && (
                                        <span className="w-2 h-2 rounded-full bg-primary shrink-0 ml-3" />
                                    )}
                                </button>
                            ))
                        )}
                    </div>

                    {/* Footer stats */}
                    {options.length > 0 && (
                        <div className="px-3 py-1.5 border-t bg-muted/20">
                            <span className="text-[10px] text-muted-foreground">
                                {search
                                    ? `${filtered.length} dari ${options.length} pilihan`
                                    : `${options.length} pilihan tersedia`}
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
