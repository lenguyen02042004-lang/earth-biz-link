import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Crown, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { buyContactBlock } from "@/lib/connect";

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
              <Link to="/signup">
                <Button
                  className={`w-full ${
                    tier.featured
                      ? "bg-white text-primary hover:bg-white/90"
                      : "bg-gradient-vivid text-white hover:opacity-90 border-0"
                  }`}
                >
                  {tier.cta}
                </Button>
              </Link>
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
                <div className="text-right">
                  <p className="text-lg font-bold">${a.price}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
