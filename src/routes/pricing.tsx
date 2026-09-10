import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Crown, Plus } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { buyContactBlock } from "@/lib/connect";
import { uploadPublicFile } from "@/lib/upload";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/pricing")({
  component: PricingPage,
  head: () => ({
    meta: [
      { title: "Bảng giá gói thành viên — GlobalBiz.Connect" },
      { name: "description", content: "Chọn gói phù hợp cho doanh nghiệp của bạn: miễn phí để bắt đầu, hoặc Thành viên chỉ từ $5/năm với 1.000 lượt gửi card visit và hỗ trợ ưu tiên." },
      { property: "og:title", content: "Bảng giá gói thành viên — GlobalBiz.Connect" },
      { property: "og:description", content: "Chọn gói phù hợp cho doanh nghiệp: miễn phí để bắt đầu, hoặc Thành viên $5/năm với 1.000 lượt gửi card visit và hỗ trợ ưu tiên." },
      { property: "og:url", content: "https://earth-biz-link.lovable.app/pricing" },
    ],
    links: [{ rel: "canonical", href: "https://earth-biz-link.lovable.app/pricing" }],
  }),

});

const TIERS = [
  {
    name: "Miễn phí",
    price: "0",
    description: "Tạo danh thiếp cơ bản và hiển thị trên bản đồ.",
    features: ["1 danh thiếp doanh nghiệp", "Hiển thị icon trên bản đồ", "Bộ lọc & tìm kiếm", "Trang chi tiết + QR code", "100 lượt gửi card / năm"],
    cta: "Bắt đầu miễn phí", featured: false,
  },
  {
    name: "Thành viên",
    price: "5",
    description: "Đầy đủ tính năng kết nối B2B toàn cầu.",
    features: ["Tất cả tính năng miễn phí", "1,000 lượt gửi card / năm", "Quản lý hộp thư kết nối", "Phân tích lượt xem chi tiết", "Hỗ trợ ưu tiên"],
    cta: "Đăng ký $5/năm", featured: true,
  },
  {
    name: "Icon Premium",
    price: "+5",
    description: "Nổi bật trên bản đồ với icon to và viền gradient.",
    features: ["Cộng thêm vào gói thành viên", "Icon kích thước 30% lớn hơn", "Viền gradient hồng động", "Xếp hạng cao hơn trong tìm kiếm", "Huy hiệu Premium"],
    cta: "Nâng cấp Premium", featured: false, premium: true,
  },
];

const ADDONS = [
  { name: "Mua thêm 1,000 lượt gửi card", price: "5", desc: "Một lần thanh toán, không hết hạn." },
  { name: "Mở rộng danh bạ +500 liên hệ", price: "5", desc: "Cộng thêm 500 chỗ lưu danh bạ, dùng vĩnh viễn.", block: true },
];

function PricingPage() {
  const navigate = useNavigate();
  const [buying, setBuying] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState<typeof TIERS[0] | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectTier = async (tier: typeof TIERS[0]) => {
    if (tier.price === "0") {
      navigate({ to: "/signup" });
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Vui lòng đăng nhập để nâng cấp");
      navigate({ to: "/login" });
      return;
    }
    setSelectedTier(tier);
    setShowPaymentModal(true);
  };

  const handleUploadReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setIsUploading(true);
    try {
      const url = await uploadPublicFile("receipts", file, user.id);
      setReceiptUrl(url);
      toast.success("Tải ảnh biên lai thành công");
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi tải ảnh lên");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmitPayment = async () => {
    if (!receiptUrl || !selectedTier) {
      toast.error("Vui lòng tải lên biên lai chuyển khoản");
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setBuying(true);
    try {
      // 1. Fetch user's business
      const { data: businesses } = await supabase
        .from("businesses")
        .select("id")
        .eq("owner_id", user.id)
        .limit(1);
      
      const businessId = businesses?.[0]?.id;

      // 2. Insert into payments_log
      const { error: paymentError } = await supabase
        .from("payments_log")
        .insert({
          user_id: user.id,
          business_id: businessId || null,
          amount: parseFloat(selectedTier.price),
          currency: "USD",
          provider: "manual" as any,
          type: "membership",
          status: "pending",
          provider_payment_id: receiptUrl, // Store receipt URL here
        });

      if (paymentError) throw paymentError;

      // 3. Provisional Approval: update business if it exists
      if (businessId) {
        const updateData: any = {};
        if (selectedTier.name === "Icon Premium") {
          updateData.icon_tier = "premium";
        } else {
          // Premium for 1 year
          updateData.premium_until = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
        }

        const { error: updateError } = await supabase
          .from("businesses")
          .update(updateData)
          .eq("id", businessId);
          
        if (updateError) console.warn("Failed provisional approval", updateError);
      }

      toast.success("Đã gửi yêu cầu thanh toán. Tài khoản của bạn đã được duyệt trước (Provisional Approval)!");
      setShowPaymentModal(false);
      navigate({ to: "/dashboard" });
    } catch (error) {
      console.error(error);
      toast.error("Đã có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setBuying(false);
    }
  };

  const handleBuyBlock = async () => {
    setBuying(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setBuying(false);
      toast.error("Vui lòng đăng nhập để mua gói mở rộng");
      navigate({ to: "/login" });
      return;
    }
    const res = await buyContactBlock();
    setBuying(false);
    if (!res.ok) { toast.error(res.message); return; }
    toast.success(`Đã mở rộng danh bạ lên ${res.wallet.max_saved_allowed.toLocaleString()} liên hệ`);
    navigate({ to: "/contacts" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto pb-16">
        <div className="text-center mb-12 animate-fade-up">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-medium mb-4">
            <Sparkles className="w-3 h-3 text-primary" /> Giá đơn giản, minh bạch
          </div>
          <h1 className="text-4xl sm:text-5xl font-display font-bold mb-3">
            Bắt đầu chỉ với <span className="text-gradient">$5/năm</span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Không phí ẩn. Không cam kết dài hạn. Hủy bất cứ lúc nào.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-10">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-3xl p-6 border ${
                tier.featured
                  ? "bg-gradient-vivid text-white border-transparent shadow-glow scale-105"
                  : "bg-card border-border shadow-card"
              }`}
            >
              {tier.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-white text-primary text-xs font-bold shadow-pink">
                  PHỔ BIẾN NHẤT
                </div>
              )}
              <div className="flex items-center gap-2 mb-2">
                {tier.premium && <Crown className="w-5 h-5 text-primary" />}
                <h3 className="text-xl font-bold">{tier.name}</h3>
              </div>
              <div className="mb-3">
                <span className="text-4xl font-bold">${tier.price}</span>
                <span className={tier.featured ? "opacity-80" : "text-muted-foreground"}>/năm</span>
              </div>
              <p className={`text-sm mb-5 ${tier.featured ? "opacity-90" : "text-muted-foreground"}`}>{tier.description}</p>
              <ul className="space-y-2.5 mb-6 text-sm">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${tier.featured ? "text-white" : "text-primary"}`} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => handleSelectTier(tier)}
                className={`w-full ${
                  tier.featured
                    ? "bg-white text-primary hover:bg-white/90"
                    : "bg-gradient-vivid text-white hover:opacity-90 border-0"
                }`}
              >
                {tier.cta}
              </Button>
            </div>
          ))}
        </div>

        {/* Add-ons */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-bold text-lg mb-4">Gói mở rộng</h3>
          <div className="space-y-3">
            {ADDONS.map((a) => (
              <div key={a.name} className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                <div>
                  <p className="font-medium">{a.name}</p>
                  <p className="text-sm text-muted-foreground">{a.desc}</p>
                </div>
                <div className="text-right flex items-center gap-3">
                  <p className="text-lg font-bold">${a.price}</p>
                  {"block" in a && a.block ? (
                    <Button size="sm" onClick={handleBuyBlock} disabled={buying} className="gap-1.5 bg-gradient-vivid text-white border-0">
                      <Plus className="w-3.5 h-3.5" /> {buying ? "Đang xử lý…" : "Mua ngay"}
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => handleSelectTier(TIERS[1])}>Mua</Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Thanh toán chuyển khoản</DialogTitle>
            <DialogDescription>
              Vui lòng chuyển khoản số tiền tương ứng với gói <strong>{selectedTier?.name}</strong> (${selectedTier?.price}) 
              vào tài khoản dưới đây.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-muted p-4 rounded-lg text-sm mb-4 space-y-2 border">
            <p><strong>Ngân hàng:</strong> Vietcombank (VCB)</p>
            <p><strong>Số tài khoản:</strong> 1234567890</p>
            <p><strong>Tên tài khoản:</strong> CTY TNHH BIZCONNECT ONE</p>
            <p><strong>Số tiền (Tỷ giá 25k/USD):</strong> {parseInt(selectedTier?.price || "0") * 25000} VNĐ</p>
            <p><strong>Nội dung CK:</strong> [Email đăng nhập của bạn]</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tải lên ảnh chụp biên lai giao dịch</Label>
              <Input 
                type="file" 
                accept="image/*" 
                ref={fileInputRef}
                onChange={handleUploadReceipt}
                disabled={isUploading}
              />
              {isUploading && <p className="text-sm text-muted-foreground">Đang tải lên...</p>}
              {receiptUrl && (
                <div className="mt-2 border rounded p-1 inline-block">
                  <img src={receiptUrl} alt="Receipt" className="h-20 object-cover rounded" />
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowPaymentModal(false)} disabled={buying}>Hủy</Button>
            <Button onClick={handleSubmitPayment} disabled={isUploading || buying || !receiptUrl} className="bg-gradient-vivid text-white border-0">
              {buying ? "Đang gửi..." : "Hoàn tất & Kích hoạt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
