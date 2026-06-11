import { useState } from "react";
import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  checkIsAdmin,
  bulkImportBusinesses,
  adminListBusinesses,
  seedDemoAccounts,
} from "@/lib/admin.functions";
import { parseCSV, BULK_CSV_TEMPLATE } from "@/lib/csv";
import { DashboardShell } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import {
  Shield, Upload, Download, CheckCircle2, AlertCircle,
  Users, Pencil, ExternalLink, Sparkles, Copy,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/login" });
  },
  component: AdminPage,
  head: () => ({ meta: [{ title: "Quản trị — GlobalBiz.Connect" }] }),
});

function AdminPage() {
  const checkAdmin = useServerFn(checkIsAdmin);
  const importFn = useServerFn(bulkImportBusinesses);
  const listFn = useServerFn(adminListBusinesses);
  const seedFn = useServerFn(seedDemoAccounts);

  const adminQ = useQuery({ queryKey: ["is-admin"], queryFn: () => checkAdmin() });

  if (adminQ.isLoading) return <Shell><p>Đang kiểm tra quyền...</p></Shell>;
  if (!adminQ.data?.isAdmin)
    return (
      <Shell>
        <div className="text-center py-16">
          <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <h1 className="font-display text-2xl font-bold">Chỉ dành cho quản trị viên</h1>
          <p className="text-muted-foreground mt-2">Tài khoản của bạn chưa có quyền truy cập.</p>
        </div>
      </Shell>
    );

  return (
    <Shell>
      <div className="flex items-center gap-2 mb-6">
        <Shield className="w-7 h-7 text-primary" />
        <h1 className="font-display text-3xl font-bold">Quản trị viên</h1>
      </div>

      <DemoAccountsSection seedFn={seedFn} />
      <BusinessTableSection listFn={listFn} />
      <BulkImportSection importFn={importFn} />
    </Shell>
  );
}

/* ---------------- Demo accounts ---------------- */
function DemoAccountsSection({ seedFn }: { seedFn: ReturnType<typeof useServerFn<typeof seedDemoAccounts>> }) {
  const [results, setResults] = useState<Awaited<ReturnType<typeof seedDemoAccounts>>["results"] | null>(null);
  const mut = useMutation({
    mutationFn: () => seedFn(),
    onSuccess: (res) => {
      setResults(res.results);
      const ok = res.results.filter((r) => r.ok).length;
      toast.success(`Đã chuẩn bị ${ok}/${res.results.length} tài khoản demo`);
    },
    onError: (e: any) => toast.error(e.message ?? "Lỗi seed demo"),
  });

  return (
    <section className="rounded-3xl bg-card border border-border p-6 mb-6">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="font-display text-xl font-semibold">Tài khoản chủ sở hữu cho doanh nghiệp demo</h2>
        </div>
        <Button onClick={() => mut.mutate()} disabled={mut.isPending}>
          {mut.isPending ? "Đang tạo..." : "Tạo / cập nhật 10 tài khoản demo"}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Mỗi doanh nghiệp demo sẽ có 1 tài khoản độc lập (email <code>&lt;slug&gt;@demo.globalbiz.test</code>, mật khẩu
        <code className="ml-1">Demo@12345</code>). Bạn có thể đăng nhập bằng các tài khoản này để kiểm tra đầy đủ luồng:
        hộp thư, theo dõi, gửi danh thiếp giữa các doanh nghiệp.
      </p>

      {results && (
        <div className="overflow-auto rounded-xl border border-border">
          <table className="w-full text-xs">
            <thead className="bg-muted text-left">
              <tr>
                <th className="p-2">Doanh nghiệp</th>
                <th className="p-2">Email đăng nhập</th>
                <th className="p-2">Mật khẩu</th>
                <th className="p-2">Trạng thái</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.slug} className="border-t border-border">
                  <td className="p-2 font-medium">{r.slug}</td>
                  <td className="p-2 font-mono">{r.email}</td>
                  <td className="p-2 font-mono">{r.password}</td>
                  <td className="p-2">
                    {r.ok ? (
                      <span className="text-green-600">{r.created ? "Mới tạo" : "Đã có"} · gán chủ</span>
                    ) : (
                      <span className="text-destructive">{r.error}</span>
                    )}
                  </td>
                  <td className="p-2">
                    <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(`${r.email} / ${r.password}`); toast.success("Đã sao chép"); }}>
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

/* ---------------- Business table ---------------- */
function BusinessTableSection({ listFn }: { listFn: ReturnType<typeof useServerFn<typeof adminListBusinesses>> }) {
  const q = useQuery({ queryKey: ["admin-businesses"], queryFn: () => listFn() });
  const list = q.data?.businesses ?? [];
  const [filter, setFilter] = useState("");
  const filtered = list.filter((b) =>
    `${b.name} ${b.slug} ${b.owner_email}`.toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <section className="rounded-3xl bg-card border border-border p-6 mb-6">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <h2 className="font-display text-xl font-semibold">Tất cả doanh nghiệp ({list.length})</h2>
        </div>
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Tìm theo tên, slug, email chủ..."
          className="px-3 py-1.5 rounded-lg border border-border bg-background text-sm w-72 max-w-full"
        />
      </div>

      {q.isLoading ? (
        <p className="text-sm text-muted-foreground">Đang tải...</p>
      ) : (
        <div className="overflow-auto rounded-xl border border-border">
          <table className="w-full text-xs">
            <thead className="bg-muted text-left">
              <tr>
                <th className="p-2">Tên</th>
                <th className="p-2">Slug</th>
                <th className="p-2">Trạng thái</th>
                <th className="p-2">Quốc gia</th>
                <th className="p-2">Chủ (email)</th>
                <th className="p-2">Views</th>
                <th className="p-2">Followers</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.id} className="border-t border-border hover:bg-accent/40">
                  <td className="p-2 font-medium">{b.name}</td>
                  <td className="p-2 font-mono text-muted-foreground">{b.slug}</td>
                  <td className="p-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] ${b.status === "public" ? "bg-green-500/15 text-green-700" : "bg-muted text-muted-foreground"}`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="p-2">{b.country_code ?? "—"}</td>
                  <td className="p-2 text-muted-foreground">{b.owner_email}</td>
                  <td className="p-2">{b.views_count}</td>
                  <td className="p-2">{b.followers_count}</td>
                  <td className="p-2 flex gap-1">
                    <Link to="/b/$slug" params={{ slug: b.slug }} target="_blank" className="inline-flex items-center px-2 py-1 rounded hover:bg-accent" title="Xem">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                    <Link to="/business/edit" search={{ id: b.id }} className="inline-flex items-center px-2 py-1 rounded hover:bg-accent" title="Sửa">
                      <Pencil className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="p-4 text-center text-muted-foreground">Không có dữ liệu</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

/* ---------------- Bulk import (existing) ---------------- */
function BulkImportSection({ importFn }: { importFn: ReturnType<typeof useServerFn<typeof bulkImportBusinesses>> }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Record<string, string>[]>([]);
  const [result, setResult] = useState<{ ok: number; failed: { row: number; error: string }[] } | null>(null);

  const importMut = useMutation({
    mutationFn: (rows: Record<string, string>[]) => importFn({ data: { rows } }),
    onSuccess: (res) => { setResult(res); toast.success(`Đã import ${res.ok} doanh nghiệp.`); },
    onError: (e: any) => toast.error(e.message ?? "Import lỗi"),
  });

  async function handleFile(f: File) {
    setFile(f);
    const text = await f.text();
    const rows = parseCSV(text);
    setPreview(rows.slice(0, 5));
  }

  function downloadTemplate() {
    const blob = new Blob([BULK_CSV_TEMPLATE], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "business-import-template.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="rounded-3xl bg-card border border-border p-6">
      <h2 className="font-display text-xl font-semibold mb-2">Nhập hàng loạt doanh nghiệp (CSV)</h2>
      <p className="text-sm text-muted-foreground mb-4">Mỗi dòng tương ứng một doanh nghiệp. Tài khoản chủ sở hữu phải đã đăng ký email tương ứng.</p>

      <div className="flex flex-wrap gap-3 mb-4">
        <Button variant="outline" onClick={downloadTemplate}><Download className="w-4 h-4 mr-2" />Tải mẫu CSV</Button>
        <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer">
          <Upload className="w-4 h-4" /> Chọn file CSV
          <input type="file" accept=".csv,text/csv" hidden onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </label>
        {file && (
          <Button onClick={async () => {
            const text = await file.text();
            const rows = parseCSV(text);
            setResult(null);
            importMut.mutate(rows);
          }} disabled={importMut.isPending}>
            {importMut.isPending ? "Đang import..." : `Import ${preview.length ? "tất cả" : ""}`}
          </Button>
        )}
      </div>

      {preview.length > 0 && (
        <div className="overflow-auto rounded-xl border border-border mb-4">
          <table className="w-full text-xs">
            <thead className="bg-muted"><tr>{Object.keys(preview[0]).map((k) => <th key={k} className="p-2 text-left">{k}</th>)}</tr></thead>
            <tbody>{preview.map((r, i) => <tr key={i} className="border-t border-border">{Object.keys(preview[0]).map((k) => <td key={k} className="p-2">{r[k]}</td>)}</tr>)}</tbody>
          </table>
          <p className="p-2 text-xs text-muted-foreground bg-muted/50">Xem trước 5 dòng đầu.</p>
        </div>
      )}

      {result && (
        <div className="p-4 rounded-xl bg-muted">
          <div className="flex items-center gap-2 mb-2"><CheckCircle2 className="text-green-600 w-5 h-5" /><span className="font-semibold">Thành công: {result.ok}</span></div>
          {result.failed.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mt-2 mb-1"><AlertCircle className="text-destructive w-5 h-5" /><span className="font-semibold">Lỗi: {result.failed.length}</span></div>
              <ul className="text-xs space-y-1 max-h-48 overflow-auto">
                {result.failed.map((f, i) => <li key={i}>Dòng {f.row}: {f.error}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell maxWidth="6xl">
      {children}
    </DashboardShell>
  );
}
