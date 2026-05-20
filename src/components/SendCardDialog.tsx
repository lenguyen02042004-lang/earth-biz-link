import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMyBusinesses, sendCardVisit, getMyQuota } from "@/lib/messaging.functions";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

interface Props {
  toBusinessId: string;
  toBusinessName: string;
  onClose: () => void;
}

export function SendCardDialog({ toBusinessId, toBusinessName, onClose }: Props) {
  const { user } = useAuth();
  const myBiz = useServerFn(getMyBusinesses);
  const quotaFn = useServerFn(getMyQuota);
  const sendFn = useServerFn(sendCardVisit);
  const [fromId, setFromId] = useState<string>("");
  const [subject, setSubject] = useState("Xin chào, chúng tôi muốn kết nối");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const bizQ = useQuery({
    queryKey: ["my-bizes"], queryFn: () => myBiz(), enabled: !!user,
  });
  const myList = bizQ.data?.businesses ?? [];
  const effectiveFrom = fromId || myList[0]?.id || "";

  const quotaQ = useQuery({
    queryKey: ["quota", effectiveFrom], enabled: !!effectiveFrom,
    queryFn: () => quotaFn({ data: { business_id: effectiveFrom } }),
  });

  if (!user) {
    return (
      <Modal onClose={onClose}>
        <h3 className="font-display text-xl font-bold mb-2">Đăng nhập để gửi danh thiếp</h3>
        <p className="text-sm text-muted-foreground">Bạn cần đăng nhập và có doanh nghiệp để gửi danh thiếp.</p>
      </Modal>
    );
  }

  if (!bizQ.isLoading && myList.length === 0) {
    return (
      <Modal onClose={onClose}>
        <h3 className="font-display text-xl font-bold mb-2">Bạn chưa có doanh nghiệp</h3>
        <p className="text-sm text-muted-foreground">Tạo doanh nghiệp trước khi gửi danh thiếp.</p>
      </Modal>
    );
  }

  async function handleSend() {
    if (!effectiveFrom || !subject.trim() || !body.trim()) {
      toast.error("Vui lòng nhập đầy đủ"); return;
    }
    setSending(true);
    try {
      await sendFn({ data: { from_business: effectiveFrom, to_business: toBusinessId, subject, body } });
      toast.success("Đã gửi danh thiếp!");
      onClose();
    } catch (e: any) {
      toast.error(e.message ?? "Gửi thất bại");
    } finally { setSending(false); }
  }

  return (
    <Modal onClose={onClose}>
      <h3 className="font-display text-xl font-bold mb-1">Gửi danh thiếp đến</h3>
      <p className="text-primary font-semibold mb-4">{toBusinessName}</p>

      <label className="text-xs font-medium text-muted-foreground">Từ doanh nghiệp</label>
      <select value={effectiveFrom} onChange={(e) => setFromId(e.target.value)}
              className="w-full mt-1 mb-3 px-3 py-2 rounded-xl border border-border bg-card">
        {myList.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
      </select>

      {quotaQ.data && (
        <p className="text-xs text-muted-foreground mb-3">
          Còn lại {quotaQ.data.remaining} / {quotaQ.data.limit} lượt gửi năm nay.
        </p>
      )}

      <label className="text-xs font-medium text-muted-foreground">Tiêu đề</label>
      <input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={200}
             className="w-full mt-1 mb-3 px-3 py-2 rounded-xl border border-border bg-card" />

      <label className="text-xs font-medium text-muted-foreground">Nội dung</label>
      <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} maxLength={2000}
                placeholder="Lời giới thiệu, đề xuất hợp tác..."
                className="w-full mt-1 mb-4 px-3 py-2 rounded-xl border border-border bg-card resize-none" />

      <Button onClick={handleSend} disabled={sending || (quotaQ.data?.remaining ?? 0) <= 0}
              className="w-full bg-gradient-vivid hover:opacity-90 text-white border-0">
        <Send className="w-4 h-4 mr-2" />
        {sending ? "Đang gửi..." : "Gửi danh thiếp"}
      </Button>
    </Modal>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-3xl bg-card border border-border p-6 shadow-glow">
        <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-muted hover:bg-accent flex items-center justify-center">
          <X className="w-4 h-4" />
        </button>
        {children}
      </div>
    </div>
  );
}
