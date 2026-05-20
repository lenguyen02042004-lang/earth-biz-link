import { useState } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { checkIsAdmin, bulkImportBusinesses } from "@/lib/admin.functions";
import { parseCSV, BULK_CSV_TEMPLATE } from "@/lib/csv";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Shield, Upload, Download, CheckCircle2, AlertCircle } from "lucide-react";
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
  const adminQ = useQuery({ queryKey: ["is-admin"], queryFn: () => checkAdmin() });

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

  if (adminQ.isLoading) return <Shell><p>Đang kiểm tra quyền...</p></Shell>;
  if (!adminQ.data?.isAdmin) return <Shell>
    <div className="text-center py-16">
      <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
      <h1 className="font-display text-2xl font-bold">Chỉ dành cho quản trị viên</h1>
      <p className="text-muted-foreground mt-2">Tài khoản của bạn chưa có quyền truy cập.</p>
    </div>
  </Shell>;

  return (
    <Shell>
      <div className="flex items-center gap-2 mb-6">
        <Shield className="w-7 h-7 text-primary" />
        <h1 className="font-display text-3xl font-bold">Quản trị viên</h1>
      </div>

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
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container max-w-5xl pt-24 pb-12">{children}</main>
    </div>
  );
}
