import { Link, useLocation } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { LayoutDashboard, Inbox, BookOpen, Heart, BarChart3, Pencil } from "lucide-react";
import type { ComponentType } from "react";

export const DEMO_OWNER_PREFIX = "00000000-0000-0000-0000-0000000000";

type TabDef = {
  to: "/dashboard" | "/inbox" | "/contacts" | "/following" | "/business/stats" | "/business/edit";
  label: string;
  icon: ComponentType<{ className?: string }>;
  match: (path: string) => boolean;
};

const TABS: TabDef[] = [
  { to: "/dashboard", label: "Tổng quan", icon: LayoutDashboard, match: (p) => p === "/dashboard" },
  { to: "/inbox", label: "Hộp thư", icon: Inbox, match: (p) => p.startsWith("/inbox") },
  { to: "/contacts", label: "Danh bạ", icon: BookOpen, match: (p) => p.startsWith("/contacts") },
  { to: "/following", label: "Đang theo dõi", icon: Heart, match: (p) => p.startsWith("/following") },
  { to: "/business/stats", label: "Thống kê", icon: BarChart3, match: (p) => p.startsWith("/business/stats") },
  { to: "/business/edit", label: "Chỉnh sửa DN", icon: Pencil, match: (p) => p.startsWith("/business/edit") },
];

interface Props {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: "5xl" | "6xl" | "7xl";
}

export function DashboardShell({ title, subtitle, actions, children, maxWidth = "6xl" }: Props) {
  const location = useLocation();
  const path = location.pathname;
  const widthCls = maxWidth === "5xl" ? "max-w-5xl" : maxWidth === "7xl" ? "max-w-7xl" : "max-w-6xl";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className={`pt-20 px-4 sm:px-6 lg:px-8 ${widthCls} mx-auto pb-16`}>
        {/* Sticky tab bar */}
        <nav className="sticky top-16 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 bg-background/90 backdrop-blur border-b border-border mb-6">
          <div className="flex gap-1 overflow-x-auto no-scrollbar">
            {TABS.map((t) => {
              const active = t.match(path);
              const Icon = t.icon;
              return (
                <Link
                  key={t.to}
                  to={t.to}
                  className={`relative inline-flex items-center gap-1.5 px-3 py-3 text-sm whitespace-nowrap transition-smooth ${
                    active
                      ? "text-primary font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {t.label}
                  {active && (
                    <span className="absolute left-2 right-2 bottom-0 h-0.5 rounded-full bg-gradient-vivid" />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {(title || actions) && (
          <header className="flex flex-wrap justify-between items-end gap-3 mb-6">
            <div>
              {title && <h1 className="text-2xl sm:text-3xl font-display font-bold">{title}</h1>}
              {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
            </div>
            {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
          </header>
        )}

        {children}
      </div>
    </div>
  );
}
