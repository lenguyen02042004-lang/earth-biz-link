import { useEffect, useState } from "react";
import QRCode from "qrcode";
import {
  MapPin, Phone, Mail, Globe, Eye, Share2, X, Sparkles, Send, BookmarkPlus, BookmarkCheck,
  Building2, Award, FileText, Lock, Handshake, Printer, ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SocialIconList } from "./SocialIconList";
import { SendCardDialog } from "./SendCardDialog";
import { PrintableQRModal } from "@/components/PrintableQRModal";
import { FollowButton } from "./FollowButton";
import { formatCount } from "@/lib/format";
import type { BusinessProfile } from "@/types/business";
import { saveBusinessContact, isContactSaved } from "@/lib/contacts";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { maskPhone, maskEmail } from "@/lib/mask";
import { isConnectedTo } from "@/lib/connect";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const viewedThisSession = new Set<string>();

interface Props {
  business: BusinessProfile;
  onClose?: () => void;
  mode?: "modal" | "inline";
}

export function BusinessCard({ business, onClose, mode = "modal" }: Props) {
  const [qrUrl, setQrUrl] = useState<string>("");
  const [showSend, setShowSend] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const navigate = useNavigate();
  const profileUrl = typeof window !== "undefined" ? `${window.location.origin}/b/${business.slug}` : "";

  const description = business.description || business.short_intro || "";
  const certifications = business.certifications || [];

  useEffect(() => {
    if (profileUrl) {
      QRCode.toDataURL(`${profileUrl}?src=qr`, {
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

  useEffect(() => {
    isContactSaved(business.id).then(setSaved);
    isConnectedTo(business.id).then(setUnlocked);
  }, [business.id]);

  // Track view + QR scan (once per session per business)
  useEffect(() => {
    if (!UUID_RE.test(business.id)) return;
    if (viewedThisSession.has(business.id)) return;
    viewedThisSession.add(business.id);
    supabase.rpc("increment_business_views", { _id: business.id }).then(({ error }) => {
      if (error) viewedThisSession.delete(business.id);
    });
    if (typeof window !== "undefined") {
      const src = new URLSearchParams(window.location.search).get("src");
      if (src === "qr") {
        supabase.rpc("increment_business_qr_scans", { _id: business.id });
      }
    }
  }, [business.id]);

  const handleShare = async () => {
    if (UUID_RE.test(business.id)) {
      supabase.rpc("increment_business_shares", { _id: business.id });
    }
    if (navigator.share) {
      try { await navigator.share({ title: business.name, text: business.short_intro, url: profileUrl }); } catch {}
    } else {
      await navigator.clipboard.writeText(profileUrl);
      toast.success("Đã sao chép liên kết!");
    }
  };

  const handleSaveContact = async () => {
    if (saving) return;
    setSaving(true);
    const res = await saveBusinessContact(business);
    setSaving(false);
    if (!res.ok) {
      if (res.reason === "auth") {
        toast.error("Vui lòng đăng nhập để lưu danh bạ");
        navigate({ to: "/login" });
      } else {
        toast.error(res.message || "Không lưu được danh bạ");
      }
      return;
    }
    setSaved(true);
    toast.success("Đã lưu vào danh bạ của bạn", {
      description: "Bạn có thể tra cứu sau tại trang Danh bạ.",
      action: { label: "Mở danh bạ", onClick: () => navigate({ to: "/contacts" }) },
    });
  };

  const isPremium = business.icon_tier === "premium";

  const innerContent = (
    <>
      <div
        className={
        mode === "modal"
          ? "relative w-full max-w-md md:max-w-3xl lg:max-w-4xl max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2rem)] rounded-2xl sm:rounded-3xl bg-card shadow-glow border border-border/40 flex flex-col overflow-hidden"
          : "relative w-full max-w-md md:max-w-3xl lg:max-w-4xl min-h-[80vh] mx-auto rounded-2xl sm:rounded-3xl bg-card shadow-glow border border-border/40 flex flex-col overflow-hidden"
      }
    >
      
      {/* Close button - only show in modal mode */}
      {mode === "modal" && onClose && (
        <button
          onClick={onClose}
          aria-label="Đóng"
          className="absolute top-3 right-3 z-20 w-9 h-9 rounded-full bg-black/50 backdrop-blur text-white flex items-center justify-center hover:bg-black/70 transition-smooth"
        >
          <X className="w-4 h-4" />
        </button>
      )}

        {/* HEADER */}
        <div className="relative bg-gradient-vivid shrink-0">
          {business.banner_url && (
            <img src={business.banner_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-25" />
          )}
          <div className="relative px-4 sm:px-6 pt-4 pb-4 sm:pb-5 flex gap-3 sm:gap-4 items-start text-white">
            <div className={`${isPremium ? "ring-premium" : ""} shrink-0`}>
              {business.logo_url ? (
                <img
                  src={business.logo_url}
                  alt={business.name}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white border-2 border-white/80 object-cover shadow-pink"
                />
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-muted/80 border-2 border-white/80 shadow-pink flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-muted-foreground/60" />
                </div>
              )}
            </div>

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
              <h1 className="text-lg sm:text-2xl font-bold leading-tight mt-1 truncate">
                <a href={profileUrl} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1.5" title="Mở trang riêng của doanh nghiệp">
                  {business.name}
                  <ExternalLink className="w-4 h-4 opacity-70" />
                </a>
              </h1>
              <p className="text-[11px] sm:text-xs text-white/85 mt-0.5 line-clamp-2">{business.short_intro}</p>

              <div className="flex items-center gap-3 text-[10px] sm:text-xs text-white/80 mt-1.5">
                <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{formatCount(business.views_count || 0)}</span>
                <span className="truncate">
                  {[business.province, business.country_name].filter(Boolean).join(", ")}
                </span>
              </div>

              {/* Follow button — vị trí nổi bật ngay dưới identity */}
              <div className="mt-2.5">
                <FollowButton
                  businessId={business.id}
                  variant="full"
                  className="bg-white text-primary hover:bg-white/90 border-0 shadow-pink h-8"
                />
              </div>
            </div>

            {qrUrl && (
              <button
                onClick={() => setShowQR(true)}
                title="Mở mã QR In Ấn"
                className="shrink-0 hidden sm:block text-left"
              >
                <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-xl bg-white p-1.5 shadow-pink hover:scale-105 transition-smooth relative group">
                  <img src={qrUrl} alt={`Mã QR danh thiếp doanh nghiệp ${business.name}`} className="w-full h-full" />
                  <div className="absolute inset-0 bg-black/20 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <ExternalLink className="w-6 h-6 text-white" />
                  </div>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-5">
          {qrUrl && (
            <button onClick={() => setShowQR(true)}
               className="w-full sm:hidden flex items-center gap-3 p-3 rounded-xl bg-accent/40 border border-border text-left hover:bg-accent/60 transition-colors">
              <img src={qrUrl} alt={`Mã QR danh thiếp doanh nghiệp ${business.name}`} className="w-16 h-16 rounded-lg bg-white p-1" />
              <div className="text-xs flex-1 min-w-0">
                <p className="font-semibold">Mã QR In Ấn & Chia Sẻ</p>
                <p className="text-muted-foreground truncate">{profileUrl.replace(/^https?:\/\//, "")}</p>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
            </button>
          )}

          {/* Contact grid */}
          <div className="grid sm:grid-cols-2 gap-2 text-xs sm:text-sm">
            <div className="flex items-start gap-2 text-foreground/80">
              <MapPin className="w-4 h-4 mt-0.5 text-primary shrink-0" />
              <span className="leading-snug">
                {[business.address, business.province, business.country_name].filter(Boolean).join(", ")}
              </span>
            </div>
            {business.phone && (
              unlocked ? (
                <a href={`tel:${business.phone}`} className="flex items-center gap-2 text-foreground/80 hover:text-primary transition-smooth">
                  <Phone className="w-4 h-4 text-primary shrink-0" />
                  <span className="truncate">{business.phone}</span>
                </a>
              ) : (
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Lock className="w-4 h-4 text-primary shrink-0" />
                  <span className="truncate">{maskPhone(business.phone)}</span>
                </span>
              )
            )}
            {business.email && (
              unlocked ? (
                <a href={`mailto:${business.email}`} className="flex items-center gap-2 text-foreground/80 hover:text-primary transition-smooth">
                  <Mail className="w-4 h-4 text-primary shrink-0" />
                  <span className="truncate">{business.email}</span>
                </a>
              ) : (
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Lock className="w-4 h-4 text-primary shrink-0" />
                  <span className="truncate">{maskEmail(business.email)}</span>
                </span>
              )
            )}
            {business.website && (
              <a href={business.website} target="_blank" rel="noopener noreferrer"
                 className="flex items-center gap-2 text-foreground/80 hover:text-primary transition-smooth">
                <Globe className="w-4 h-4 text-primary shrink-0" />
                <span className="truncate">{business.website.replace(/^https?:\/\//, "")}</span>
              </a>
            )}
          </div>

          {!unlocked && (business.phone || business.email) && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground max-w-sm">
                Liên hệ được bảo vệ. Bấm <strong className="text-foreground">Kết nối giao thương</strong> để mở khóa,
                đồng thời gửi danh thiếp của bạn cho doanh nghiệp.
              </p>
              <Button size="sm" onClick={() => setShowSend(true)} className="gap-1.5 bg-gradient-vivid text-white border-0 shadow-pink">
                <Handshake className="w-4 h-4" /> Kết nối giao thương
              </Button>
            </div>
          )}


          {/* GIỚI THIỆU */}
          <div>
            <p className="flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold tracking-wider text-muted-foreground mb-2">
              <FileText className="w-3.5 h-3.5" /> GIỚI THIỆU
            </p>
            <p className="text-sm leading-relaxed text-foreground/85 whitespace-pre-line">{description}</p>
          </div>

          {/* CHỨNG NHẬN / DANH HIỆU */}
          {certifications.length > 0 && (
            <div>
              <p className="flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold tracking-wider text-muted-foreground mb-2">
                <Award className="w-3.5 h-3.5" /> CHỨNG NHẬN & DANH HIỆU
              </p>
              <div className="grid sm:grid-cols-2 gap-2">
                {certifications.map((c, i) => (
                  <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-accent/40 border border-border/60">
                    <div className="text-xl leading-none mt-0.5">{c.icon || "🏅"}</div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-tight truncate">{c.name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {[c.issuer, c.year].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {business.socials && Object.keys(business.socials).length > 0 && (
            <div>
              <p className="text-[10px] sm:text-xs font-semibold tracking-wider text-muted-foreground mb-1.5">KẾT NỐI</p>
              <SocialIconList socials={business.socials} size="sm" />
            </div>
          )}

          {(business.gallery?.length || 0) > 0 && (
            <div>
              <p className="text-[10px] sm:text-xs font-semibold tracking-wider text-muted-foreground mb-1.5">THƯ VIỆN</p>
              <div className="grid grid-cols-5 gap-1.5">
                {business.gallery!.slice(0, 5).map((src, i) => (
                  <div key={i} className="aspect-square rounded-lg overflow-hidden bg-muted">
                    <img src={src} alt="" className="w-full h-full object-cover hover:scale-110 transition-smooth" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sticky action bar */}
        <div className="border-t border-border/40 bg-card/95 backdrop-blur px-3 sm:px-5 py-3 flex gap-2 shrink-0">
          <Button onClick={() => setShowSend(true)} className="flex-1 bg-gradient-vivid hover:opacity-90 text-white border-0 shadow-pink h-10">
            <Send className="w-4 h-4 mr-1.5" /> Gửi card
          </Button>
          <Button
            onClick={handleSaveContact}
            disabled={saving}
            variant={saved ? "default" : "outline"}
            className={`h-10 gap-1.5 ${saved ? "bg-primary text-primary-foreground" : ""}`}
            title={saved ? "Đã lưu trong danh bạ" : "Lưu vào danh bạ để tra cứu sau"}
          >
            {saved ? <BookmarkCheck className="w-4 h-4" /> : <BookmarkPlus className="w-4 h-4" />}
            <span className="hidden sm:inline">{saved ? "Đã lưu" : "Lưu danh bạ"}</span>
          </Button>
          <Button variant="outline" size="icon" className="h-10 w-10" onClick={handleShare} title="Chia sẻ">
            <Share2 className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10"
            title="In card visit & bảng QR"
            onClick={() => navigate({ to: "/print/$type/$slug", params: { type: "business", slug: business.slug } })}
          >
            <Printer className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {showSend && (
        <SendCardDialog 
          toId={business.id} 
          toName={business.name} 
          toType="business" 
          onClose={() => setShowSend(false)} 
        />
      )}

      {showQR && (
        <PrintableQRModal
          business={business}
          qrUrl={qrUrl}
          isOpen={showQR}
          onClose={() => setShowQR(false)}
        />
      )}
    </>
  );

  return (
    <>
      {mode === "modal" ? (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-4 animate-fade-up">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          {innerContent}
        </div>
      ) : (
        innerContent
      )}
    </>
  );
}
