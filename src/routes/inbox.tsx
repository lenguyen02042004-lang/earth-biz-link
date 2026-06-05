import { useEffect, useState } from "react";
import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getInbox, markMessageRead, getMyBusinesses, getMyQuota } from "@/lib/messaging.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, Mail, UserPlus } from "lucide-react";
import { DashboardShell, DEMO_OWNER_PREFIX } from "@/components/DashboardShell";
import { formatDistanceToNow } from "date-fns";
import { downloadVCard } from "@/lib/vcard";
import { toast } from "sonner";

export const Route = createFileRoute("/inbox")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/login" });
  },
  component: InboxPage,
  head: () => ({ meta: [{ title: "Hộp thư — GlobalBiz.Connect" }] }),
});

function InboxPage() {
  const myBiz = useServerFn(getMyBusinesses);
  const inboxFn = useServerFn(getInbox);
  const markRead = useServerFn(markMessageRead);
  const quotaFn = useServerFn(getMyQuota);
  const [bizId, setBizId] = useState<string>("");

  const bizQ = useQuery({ queryKey: ["my-bizes"], queryFn: () => myBiz() });
  const myBizList = (bizQ.data?.businesses ?? []).filter((b) => !b.id.startsWith(DEMO_OWNER_PREFIX));
  useEffect(() => {
    if (!bizId && myBizList[0]) setBizId(myBizList[0].id);
  }, [myBizList, bizId]);

  const msgQ = useQuery({
    queryKey: ["inbox", bizId], enabled: !!bizId,
    queryFn: () => inboxFn({ data: { business_id: bizId } }),
  });
  const quotaQ = useQuery({
    queryKey: ["quota", bizId], enabled: !!bizId,
    queryFn: () => quotaFn({ data: { business_id: bizId } }),
  });

  const mark = useMutation({
    mutationFn: (id: string) => markRead({ data: { id } }),
    onSuccess: () => msgQ.refetch(),
  });

  if (bizQ.isLoading) return <DashboardShell><p>Loading...</p></DashboardShell>;
  if (!myBizList.length) {
    return (
      <DashboardShell title="Hộp thư doanh nghiệp" subtitle="Bạn cần tạo doanh nghiệp trước.">
        <Button asChild><Link to="/business/edit">Tạo doanh nghiệp</Link></Button>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      title="Hộp thư"
      subtitle="Tin nhắn danh thiếp giữa doanh nghiệp."
      actions={
        <select value={bizId} onChange={(e) => setBizId(e.target.value)} className="px-3 py-2 rounded-xl border border-border bg-card text-sm">
          {myBizList.map((b) => (<option key={b.id} value={b.id}>{b.name}</option>))}
        </select>
      }
    >
      <>


        {quotaQ.data && (
          <div className="mb-6 p-4 rounded-2xl bg-card border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">Hạn mức gửi danh thiếp năm {new Date().getFullYear()}</span>
              <Badge variant="secondary">{quotaQ.data.remaining} / {quotaQ.data.limit} còn lại</Badge>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-gradient-vivid" style={{ width: `${Math.min(100, (quotaQ.data.used / quotaQ.data.limit) * 100)}%` }} />
            </div>
          </div>
        )}

        <div className="space-y-3">
          {msgQ.isLoading && <p className="text-muted-foreground">Đang tải...</p>}
          {msgQ.data?.messages.length === 0 && <p className="text-muted-foreground text-center py-12">Chưa có tin nhắn nào.</p>}
          {msgQ.data?.messages.map((m: any) => {
            const isIncoming = m.to_business_id === bizId;
            const peer = isIncoming ? m.from : m.to;
            const unread = isIncoming && !m.read_at;
            return (
              <div
                key={m.id}
                onClick={() => { if (unread) mark.mutate(m.id); }}
                className={`w-full text-left p-4 rounded-2xl border transition-smooth flex gap-3 items-start ${unread ? "bg-primary/5 border-primary/40" : "bg-card border-border"}`}
              >
                {peer?.logo_url && <img src={peer.logo_url} alt="" className="w-12 h-12 rounded-full object-cover bg-white shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {isIncoming ? <Mail className="w-4 h-4 text-primary" /> : <Send className="w-4 h-4 text-muted-foreground" />}
                    <span className="font-semibold truncate">{peer?.name ?? "—"}</span>
                    {unread && <Badge className="bg-primary">Mới</Badge>}
                    <span className="text-xs text-muted-foreground ml-auto">{formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}</span>
                  </div>
                  <p className="font-medium text-sm">{m.subject}</p>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{m.body}</p>
                  {isIncoming && peer && (
                    <div className="flex gap-2 mt-2.5">
                      <Button size="sm" variant="outline" className="h-8 gap-1.5"
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadVCard({
                            id: peer.id, name: peer.name, slug: peer.slug,
                            logo_url: peer.logo_url ?? "", banner_url: "",
                            industry: "", short_intro: "",
                            phone: peer.phone ?? "", email: peer.email ?? "", website: peer.website ?? "",
                            address: peer.address ?? "", province: peer.province ?? "",
                            country_code: peer.country_code ?? "", country_name: peer.country_code ?? "",
                            socials: {}, gallery: [], icon_tier: "standard",
                            views_count: 0, followers_count: 0, lat: 0, lng: 0,
                          } as any, typeof window !== "undefined" ? `${window.location.origin}/b/${peer.slug}` : undefined);
                          toast.success("Đã lưu danh bạ (.vcf)");
                        }}>
                        <UserPlus className="w-3.5 h-3.5" /> Lưu danh bạ
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8" asChild>
                        <Link to="/b/$slug" params={{ slug: peer.slug }}>Xem card</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

function FullPage({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container max-w-3xl pt-24 pb-12">{children}</main>
    </div>
  );
}
