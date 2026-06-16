"use client";

import { useState, useEffect } from "react";
import { 
  Activity, 
  Search, 
  Download, 
  Filter,
  MonitorSmartphone,
  Loader2
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import api from "@/lib/api";

interface AuditLogItem {
  id: number;
  action: string;
  module: string;
  detail: string;
  ip_address: string;
  created_at: string;
  user: { id: number; nama: string; email: string; role: string } | null;
}

export default function AuditLogPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: logs = [], isLoading: loading } = useQuery({
    queryKey: ['audit-logs', debouncedSearch, actionFilter],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (debouncedSearch) params.search = debouncedSearch;
      if (actionFilter !== 'all') params.action = actionFilter;
      const { data: res } = await api.get('/super-admin/audit-log', { params });
      return res.data as AuditLogItem[];
    }
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'CREATE': return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">CREATE</Badge>;
      case 'UPDATE': return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">UPDATE</Badge>;
      case 'DELETE': return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">DELETE</Badge>;
      default: return <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">{action}</Badge>;
    }
  };

  const ROLE_LABEL: Record<string, string> = {
    super_admin: 'Super Admin', admin_prodi: 'Admin Prodi',
    asesor: 'Asesor', pimpinan: 'Pimpinan', pemohon: 'Pemohon',
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-20">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Audit Log Sistem</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Pantau seluruh aktivitas pengguna di dalam sistem untuk keperluan keamanan, troubleshooting, dan kepatuhan.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex w-full sm:w-auto gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Cari user atau detail aktivitas..." className="pl-9 bg-background h-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <Select value={actionFilter} onValueChange={(val) => setActionFilter(val || "all")}>
            <SelectTrigger className="w-[150px] bg-background h-10">
              <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Tipe Aksi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Aksi</SelectItem>
              <SelectItem value="CREATE">CREATE</SelectItem>
              <SelectItem value="UPDATE">UPDATE</SelectItem>
              <SelectItem value="DELETE">DELETE</SelectItem>
              <SelectItem value="UPLOAD">UPLOAD</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button className="w-full sm:w-auto gap-2 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 border-transparent h-10">
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[11px] text-muted-foreground bg-muted/30 border-b uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold w-40">Waktu (WITA)</th>
                <th className="px-6 py-4 font-semibold">Pengguna & Role</th>
                <th className="px-6 py-4 font-semibold text-center">Tipe Aksi</th>
                <th className="px-6 py-4 font-semibold">Modul Target</th>
                <th className="px-6 py-4 font-semibold">Detail Aktivitas</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />Memuat data...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">Belum ada log aktivitas.</td></tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-4 text-xs font-mono text-muted-foreground whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-foreground">{log.user?.nama || 'System'}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{ROLE_LABEL[log.user?.role || ''] || log.user?.role}</div>
                    </td>
                    <td className="px-6 py-4 text-center">{getActionBadge(log.action)}</td>
                    <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">{log.module}</td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-muted-foreground leading-relaxed">{log.detail}</p>
                      {log.ip_address && (
                        <div className="flex items-center gap-1 mt-1.5 text-[10px] text-slate-400 font-mono">
                          <MonitorSmartphone className="h-3 w-3" />
                          <span>{log.ip_address}</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
