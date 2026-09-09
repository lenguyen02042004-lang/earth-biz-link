import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { getPersonalBySlug } from "@/lib/personal-public.functions";
import { getBusinessBySlug } from "@/lib/business-public.functions";
import { Printer, ArrowLeft } from "lucide-react";

type Size = "a5" | "a6" | "card";

const SIZES: { key: Size; label: string; w: number; h: number }[] = [
  { key: "a5", label: "Standee A5 (14.8 × 21 cm)", w: 148, h: 210 },
  { key: "a6", label: "Standee A6 (10.5 × 14.8 cm)", w: 105, h: 148 },
  { key: "card", label: "Card visit (9 × 5.4 cm)", w: 90, h: 54 },
];

export const Route = createFileRoute("/print/$type/$slug")({
  loader: async ({ params }) => {
    if (params.type !== "personal" && params.type !== "business") throw notFound();
    if (params.type === "personal") {
      const { profile } = await getPersonalBySlug({ data: { slug: params.slug } });
      if (!profile) throw notFound();
      return {
        kind: "personal" as const,
        title: profile.full_name,
        subtitle: [profile.job_title, profile.company_name].filter(Boolean).join(" · "),
        phone: profile.phone ?? "",
        email: profile.email ?? "",
        extra: profile.zalo ? `Zalo: ${profile.zalo}` : "",
        image: profile.avatar_url ?? "",
        path: `/p/${params.slug}`,
      };
    }
    const { business } = await getBusinessBySlug({ data: { slug: params.slug } });
    if (!business) throw notFound();
    return {
      kind: "business" as const,
      title: business.name,
      subtitle: business.industry,
      phone: business.phone,
      email: business.email,
      extra: [business.province, business.country_name].filter(Boolean).join(", "),
      image: business.logo_url,
      path: `/b/${params.slug}`,
    };
  },
  head: () => ({
    meta: [
      { title: "Xuất bản in — Standee & Card visit" },
      { name: "description", content: "Tạo bản in standee A5/A6 và card visit 9×5.4 cm kèm mã QR danh thiếp." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PrintPage,
});

function PrintPage() {
  const data = Route.useLoaderData();
  const [size, setSize] = useState<Size>("card");
  const [qr, setQr] = useState("");

  const url = typeof window !== "undefined" ? `${window.location.origin}${data.path}?src=qr` : "";

  useEffect(() => {
    if (!url) return;
    QRCode.toDataURL(url, { margin: 0, width: 900, color: { dark: "#111111", light: "#ffffff" } }).then(setQr);
  }, [url]);

  const s = SIZES.find((x) => x.key === size)!;
  const isCard = size === "card";

  return (
    <div className="min-h-screen bg-muted/40">
      <style>{`@media print { .no-print { display:none !important } body { background:#fff } .sheet { box-shadow:none !important; margin:0 !important } @page { margin: 8mm } }`}</style>

      <div className="no-print border-b border-border bg-background px-4 py-3 flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => history.back()} className="gap-1.5"><ArrowLeft className="w-4 h-4" /> Quay lại</Button>
        <div className="flex flex-wrap gap-1.5">
          {SIZES.map((o) => (
            <Button key={o.key} size="sm" variant={o.key === size ? "default" : "outline"} onClick={() => setSize(o.key)}>{o.label}</Button>
          ))}
        </div>
        <Button size="sm" onClick={() => window.print()} className="ml-auto gap-1.5 bg-gradient-vivid text-white border-0">
          <Printer className="w-4 h-4" /> In / Lưu PDF
        </Button>
      </div>

      <div className="p-6 flex justify-center">
        <div
          className="sheet bg-white text-black shadow-lg flex flex-col"
          style={{ width: `${s.w}mm`, height: `${s.h}mm`, padding: isCard ? "6mm" : "12mm" }}
        >
          <div className={isCard ? "flex items-start gap-3" : "text-center"}>
            {data.image && (
              <img
                src={data.image}
                alt=""
                className={isCard ? "w-12 h-12 object-cover rounded-md" : "w-24 h-24 object-cover rounded-xl mx-auto mb-3"}
              />
            )}
            <div className={isCard ? "min-w-0" : ""}>
              <p className={isCard ? "font-bold text-[13pt] leading-tight" : "font-bold text-[22pt] leading-tight"}>{data.title}</p>
              {data.subtitle && <p className={isCard ? "text-[8pt] text-neutral-600" : "text-[12pt] text-neutral-600 mt-1"}>{data.subtitle}</p>}
            </div>
          </div>

          <div className={`mt-auto flex ${isCard ? "items-end justify-between gap-3" : "flex-col items-center gap-3"}`}>
            <div className={isCard ? "text-[7.5pt] leading-snug" : "text-[11pt] leading-relaxed text-center"}>
              {data.phone && <p>{data.phone}</p>}
              {data.email && <p className="break-all">{data.email}</p>}
              {data.extra && <p className="text-neutral-600">{data.extra}</p>}
              <p className="text-neutral-500 break-all">{url.replace(/^https?:\/\//, "").replace(/\?src=qr$/, "")}</p>
            </div>
            {qr && <img src={qr} alt="Mã QR" style={{ width: isCard ? "20mm" : "45mm", height: isCard ? "20mm" : "45mm" }} />}
            {!isCard && <p className="text-[10pt] font-semibold">Quét mã để kết nối giao thương</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
