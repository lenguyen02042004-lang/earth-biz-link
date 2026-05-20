import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { DEMO_BUSINESSES, type DemoBusiness } from "@/lib/mock-businesses";

interface Props {
  onSelect: (b: DemoBusiness) => void;
  businesses?: DemoBusiness[];
}

export function MapView({ onSelect, businesses = DEMO_BUSINESSES }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;

    const map = L.map(ref.current, {
      center: [20, 30],
      zoom: 2,
      minZoom: 2,
      zoomControl: true,
      worldCopyJump: true,
    });
    mapRef.current = map;

    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution: "&copy; OpenStreetMap &copy; CARTO",
      subdomains: "abcd",
      maxZoom: 20,
    }).addTo(map);

    businesses.forEach((b) => {
      const isPremium = b.icon_tier === "premium";
      const size = isPremium ? 56 : 44;
      const ringClass = isPremium
        ? "background:conic-gradient(from 0deg,#8b0000,#c8102e,#ff3b5c,#8b0000);padding:3px;animation:spin 8s linear infinite;"
        : "background:white;padding:2px;border:2px solid #c8102e;";

      const html = `
        <div style="width:${size}px;height:${size}px;border-radius:9999px;${ringClass};box-shadow:0 8px 20px -6px rgba(200,16,46,0.55);transition:transform .3s">
          <img src="${b.logo_url}" alt="${b.name}"
               style="width:100%;height:100%;border-radius:9999px;background:white;object-fit:cover;display:block" />
        </div>`;

      const icon = L.divIcon({
        html,
        className: "biz-marker",
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const marker = L.marker([b.lat, b.lng], { icon }).addTo(map);
      marker.on("click", () => onSelect(b));
      marker.bindTooltip(b.name, { direction: "top", offset: [0, -size / 2] });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [businesses, onSelect]);

  return <div ref={ref} className="w-full h-full" />;
}
