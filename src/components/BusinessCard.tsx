import { useEffect, useState } from "react";
import QRCode from "qrcode";
import {
  MapPin, Phone, Mail, Globe, Eye, Share2, Heart, X, Sparkles, Send, UserPlus, Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SocialIconList } from "./SocialIconList";
import { SendCardDialog } from "./SendCardDialog";
import { FollowButton } from "./FollowButton";
import { formatCount } from "@/lib/format";
import type { DemoBusiness } from "@/lib/mock-businesses";
import { downloadVCard } from "@/lib/vcard";
import { toast } from "sonner";

interface Props {
  business: DemoBusiness;
  onClose: () => void;
}

export function BusinessCard({ business, onClose }: Props) {
  const [qrUrl, setQrUrl] = useState<string>("");
  const [showSend, setShowSend] = useState(false);
  const profileUrl = typeof window !== "undefined" ? `${window.location.origin}/b/${business.slug}` : "";

  useEffect(() => {
    if (profileUrl) {
      QRCode.toDataURL(profileUrl, {
        margin: 1,
        color: { dark: "#c8102e", light: "#ffffff" },
        width: 220,
      }).then(setQrUrl);
    }
  }, [profileUrl]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: business.name, text: business.short_intro, url: profileUrl }); } catch {}
    } else {
      await navigator.clipboard.writeText(profileUrl);
      toast.success("Đã sao chép liên kết!");
    }
  };

  const handleSaveContact = () => {
    downloadVCard(business, profileUrl);
    toast.success("Đã lưu danh bạ (.vcf)");
  };

  const hasSocials = Object.keys(business.socials).length > 0;
  const hasGallery = business.gallery.length > 0;
  const isPremium = business.icon_tier === "premium";

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-4 animate-fade-up">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative w-full max-w-md md:max-w-3xl lg:max-w-4xl
                   max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2rem)]
                   rounded-2xl sm:rounded-3xl bg-card shadow-glow border border-border/40
                   flex flex-col overflow-hidden"
      >
        {/* Close */}
        <button
          onClick={onClose}
          aria-label="Đóng"
          className="absolute top-3 right-3 z-20 w-9 h-9 rounded-full bg-black/50 backdrop-blur text-white flex items-center justify-center hover:bg-black/70 transition-smooth"
        >
          <X className="w-4 h-4" />
        </button>

        {/* ===== VISIT CARD HEADER (banner + logo + identity + small QR) ===== */}
        <div className="relative bg-gradient-vivid shrink-0">
          {business.banner_url && (
            <img src={business.banner_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-25" />
          )}
          <div className="relative px-4 sm:px-6 pt-4 pb-4 sm:pb-5 flex gap-3 sm:gap-4 items-start text-white">
            {/* Logo */}
            <div className={`${isPremium ? "ring-premium" : ""} shrink-0`}>
              <img
                src={business.logo_url}
                alt={business.name}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white border-2 border-white/80 object-cover shadow-pink"
              />
            </div>

            {/* Identity */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                {isPremium && (
                  <Badge className="bg-white/90 text-primary border-0 gap-1 h-5 px-1.5 text-[10px]">
                    <Sparkles className="w-2.5 h-2.5" /> Premium
                  </Badge>
                )}
                <Badge variant="secondary" className="bg-white/15 text-white border-white/20 h-5 px-1.5 text-[10px] backdrop-blur">
                  <Building2 className="w-2.5 h-2.5 mr-1" /> {business.industry}
                </Badge>
              </div>
              <h2 className="text-lg sm:text-2xl font-bold leading-tight mt-1 truncate">{business.name}</h2>
              <p className="text-[11px] sm:text-xs text-white/85 mt-0.5 line-clamp-2">{business.short_intro}</p>
              <div className="flex items-center gap-3 text-[10px] sm:text-xs text-white/80 mt-1.5">
                <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{formatCount(business.views_count)}</span>
                <span className="truncate">{business.province}, {business.country_name}</span>
              </div>
            </div>

            {/* Small QR — luôn hiển thị, kiểu visit card */}
            {qrUrl && (
              <a
                href={profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Mở trang doanh nghiệp"
                className="shrink-0 hidden sm:block"
              >
                <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-xl bg-white p-1.5 shadow-pink hover:scale-105 transition-smooth">
                  <img src={qrUrl} alt="QR" className="w-full h-full" />
                </div>
              </a>
            )}
          </div>
        </div>

        {/* ===== BODY — contact + socials + gallery ===== */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
          {/* Mobile QR (compact) */}
          {qrUrl && (
            <a href={profileUrl} target="_blank" rel="noopener noreferrer"
               className="sm:hidden flex items-center gap-3 p-3 rounded-xl bg-accent/40 border border-border">
              <img src={qrUrl} alt="QR" className="w-16 h-16 rounded-lg bg-white p-1" />
              <div className="text-xs">
                <p className="font-semibold">Quét QR để mở danh thiếp</p>
                <p className="text-muted-foreground truncate">{profileUrl.replace(/^https?:\/\//, "")}</p>
              </div>
            </a>
          )}

          {/* Contact grid */}
          <div className="grid sm:grid-cols-2 gap-2 text-xs sm:text-sm">
            <div className="flex items-start gap-2 text-foreground/80">
              <MapPin className="w-4 h-4 mt-0.5 text-primary shrink-0" />
              <span className="leading-snug">{business.address}, {business.province}, {business.country_name}</span>
            </div>
            {business.phone && (
              <a href={`tel:${business.phone}`} className="flex items-center gap-2 text-foreground/80 hover:text-primary transition-smooth">
                <Phone className="w-4 h-4 text-primary shrink-0" />
                <span className="truncate">{business.phone}</span>
              </a>
            )}
            {business.email && (
              <a href={`mailto:${business.email}`} className="flex items-center gap-2 text-foreground/80 hover:text-primary transition-smooth">
                <Mail className="w-4 h-4 text-primary shrink-0" />
                <span className="truncate">{business.email}</span>
              </a>
            )}
            {business.website && (
              <a href={business.website} target="_blank" rel="noopener noreferrer"
                 className="flex items-center gap-2 text-foreground/80 hover:text-primary transition-smooth">
                <Globe className="w-4 h-4 text-primary shrink-0" />
                <span className="truncate">{business.website.replace(/^https?:\/\//, "")}</span>
              </a>
            )}
          </div>

          {hasSocials && (
            <div>
              <p className="text-[10px] sm:text-xs font-semibold tracking-wider text-muted-foreground mb-1.5">KẾT NỐI</p>
              <SocialIconList socials={business.socials} size="sm" />
            </div>
          )}

          {hasGallery && (
            <div>
              <p className="text-[10px] sm:text-xs font-semibold tracking-wider text-muted-foreground mb-1.5">THƯ VIỆN</p>
              <div className="grid grid-cols-5 gap-1.5">
                {business.gallery.slice(0, 5).map((src, i) => (
                  <div key={i} className="aspect-square rounded-lg overflow-hidden bg-muted">
                    <img src={src} alt="" className="w-full h-full object-cover hover:scale-110 transition-smooth" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ===== Sticky action bar ===== */}
        <div className="border-t border-border/40 bg-card/95 backdrop-blur px-3 sm:px-5 py-3 flex gap-2 shrink-0">
          <Button onClick={() => setShowSend(true)} className="flex-1 bg-gradient-vivid hover:opacity-90 text-white border-0 shadow-pink h-10">
            <Send className="w-4 h-4 mr-1.5" /> Gửi card
          </Button>
          <Button onClick={handleSaveContact} variant="outline" className="h-10 gap-1.5" title="Lưu vào danh bạ">
            <UserPlus className="w-4 h-4" /> <span className="hidden sm:inline">Lưu danh bạ</span>
          </Button>
          <Button variant="outline" size="icon" className="h-10 w-10" title="Theo dõi">
            <Heart className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-10 w-10" onClick={handleShare} title="Chia sẻ">
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {showSend && (
        <SendCardDialog toBusinessId={business.id} toBusinessName={business.name} onClose={() => setShowSend(false)} />
      )}
    </div>
  );
}
