import { useEffect, useState } from "react";
import QRCode from "qrcode";
import {
  MapPin, Phone, Mail, Globe, Eye, Share2, Heart, QrCode, X, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SocialIconList } from "./SocialIconList";
import type { DemoBusiness } from "@/lib/mock-businesses";
import { toast } from "sonner";

interface Props {
  business: DemoBusiness;
  onClose: () => void;
}

export function BusinessCard({ business, onClose }: Props) {
  const [qrUrl, setQrUrl] = useState<string>("");
  const [showQR, setShowQR] = useState(false);
  const profileUrl = typeof window !== "undefined" ? `${window.location.origin}/b/${business.slug}` : "";

  useEffect(() => {
    if (profileUrl) {
      QRCode.toDataURL(profileUrl, {
        margin: 1,
        color: { dark: "#ff2d87", light: "#ffffff" },
        width: 240,
      }).then(setQrUrl);
    }
  }, [profileUrl]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: business.name, text: business.short_intro, url: profileUrl });
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(profileUrl);
      toast.success("Đã sao chép liên kết!");
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 animate-fade-up">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl bg-card shadow-glow border border-border/40">
        {/* Banner */}
        <div className="relative h-32 bg-gradient-vivid overflow-hidden">
          {business.banner_url && (
            <img src={business.banner_url} alt="" className="w-full h-full object-cover mix-blend-overlay opacity-80" />
          )}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur text-white flex items-center justify-center hover:bg-black/60 transition-smooth"
          >
            <X className="w-4 h-4" />
          </button>
          {business.icon_tier === "premium" && (
            <Badge className="absolute top-3 left-3 bg-white/90 text-primary border-0 gap-1">
              <Sparkles className="w-3 h-3" /> Premium
            </Badge>
          )}
        </div>

        {/* Logo + name */}
        <div className="px-5 pb-5">
          <div className="flex items-end gap-3 -mt-10 mb-3">
            <div className={business.icon_tier === "premium" ? "ring-premium" : ""}>
              <img
                src={business.logo_url}
                alt={business.name}
                className="w-20 h-20 rounded-full bg-white border-4 border-card object-cover shadow-pink"
              />
            </div>
            <div className="flex-1 pb-1">
              <h2 className="text-xl font-bold leading-tight">{business.name}</h2>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <Eye className="w-3 h-3" /> {business.views_count.toLocaleString()} lượt xem
              </p>
            </div>
          </div>

          <Badge variant="secondary" className="mb-3 bg-accent text-accent-foreground border-0">
            {business.industry}
          </Badge>

          <p className="text-sm text-foreground/80 mb-4 leading-relaxed">
            {business.short_intro}
          </p>

          {/* Contact info */}
          <div className="space-y-2 text-sm mb-4">
            <div className="flex items-start gap-2.5 text-foreground/70">
              <MapPin className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
              <span>{business.address}, {business.province}, {business.country_name}</span>
            </div>
            {business.phone && (
              <a href={`tel:${business.phone}`} className="flex items-center gap-2.5 text-foreground/70 hover:text-primary transition-smooth">
                <Phone className="w-4 h-4 text-primary flex-shrink-0" />
                <span>{business.phone}</span>
              </a>
            )}
            {business.email && (
              <a href={`mailto:${business.email}`} className="flex items-center gap-2.5 text-foreground/70 hover:text-primary transition-smooth">
                <Mail className="w-4 h-4 text-primary flex-shrink-0" />
                <span>{business.email}</span>
              </a>
            )}
            {business.website && (
              <a href={business.website} target="_blank" rel="noopener noreferrer"
                 className="flex items-center gap-2.5 text-foreground/70 hover:text-primary transition-smooth">
                <Globe className="w-4 h-4 text-primary flex-shrink-0" />
                <span>{business.website.replace(/^https?:\/\//, '')}</span>
              </a>
            )}
          </div>

          {/* Socials */}
          {Object.keys(business.socials).length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">KẾT NỐI</p>
              <SocialIconList socials={business.socials} size="sm" />
            </div>
          )}

          {/* Gallery */}
          {business.gallery.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">THƯ VIỆN</p>
              <div className="grid grid-cols-5 gap-1.5">
                {business.gallery.slice(0, 5).map((src, i) => (
                  <div key={i} className="aspect-square rounded-lg overflow-hidden bg-muted">
                    <img src={src} alt="" className="w-full h-full object-cover hover:scale-110 transition-smooth" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* QR */}
          {showQR && qrUrl && (
            <div className="mb-4 flex flex-col items-center p-4 rounded-2xl bg-gradient-to-br from-accent to-secondary">
              <img src={qrUrl} alt="QR" className="w-40 h-40 rounded-xl bg-white p-2 shadow-soft" />
              <p className="text-xs text-muted-foreground mt-2">Quét để mở danh thiếp này</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button className="flex-1 bg-gradient-vivid hover:opacity-90 text-white border-0 shadow-pink">
              <Heart className="w-4 h-4 mr-1.5" /> Theo dõi
            </Button>
            <Button variant="outline" size="icon" onClick={() => setShowQR(v => !v)} title="QR Code">
              <QrCode className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleShare} title="Chia sẻ">
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
