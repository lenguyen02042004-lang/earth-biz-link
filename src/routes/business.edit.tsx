import { createFileRoute, redirect } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { Construction } from "lucide-react";

export const Route = createFileRoute("/business/edit")({
  component: EditBusinessPage,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });
  },
});

function EditBusinessPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 px-4 max-w-3xl mx-auto pb-16">
        <div className="bg-card border border-border rounded-3xl p-12 text-center shadow-card">
          <Construction className="w-12 h-12 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-display font-bold mb-2">Trang tạo/sửa danh thiếp</h1>
          <p className="text-muted-foreground">
            Form đa bước với upload logo/banner/gallery, geocode địa chỉ, preview & publish — sẽ hoàn thiện ở Giai đoạn 2.
          </p>
        </div>
      </div>
    </div>
  );
}
