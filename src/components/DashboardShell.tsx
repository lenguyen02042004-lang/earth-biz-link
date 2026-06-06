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
  /** Optional max width for the right-hand content column. */
  maxWidth?: "4xl" | "5xl" | "6xl" | "7xl" | "full";
}

const WIDTH_CLS: Record<NonNullable<Props["maxWidth"]>, string> = {
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
  "6xl": "max-w-6xl",
  "7xl": "max-w-7xl",
  "full": "max-w-none",
};

export function DashboardShell({ title, subtitle, actions, children, maxWidth = "6xl" }: Props) {
  const location = useLocation();
  const path = location.pathname;
  const widthCls = WIDTH_CLS[maxWidth];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-16 flex">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex flex-col w-60 shrink-0 border-r border-border bg-card/40 sticky top-16 h-[calc(100vh-4rem)] py-6 px-3">
          <div className="px-3 mb-4">
            <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
              Tài khoản doanh nghiệp
            </p>
          </div>
          <nav className="flex-1 flex flex-col gap-0.5">
            {TABS.map((t) => {
              const active = t.match(path);
              const Icon = t.icon;
              return (
                <Link
                  key={t.to}
                  to={t.to}
                  className={`group inline-flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-smooth ${
                    active
                      ? "bg-gradient-vivid text-white shadow-pink font-semibold"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{t.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Right content area */}
        <main className="flex-1 min-w-0">
          {/* Mobile horizontal tabs */}
          <nav className="lg:hidden sticky top-16 z-30 bg-background/90 backdrop-blur border-b border-border">
            <div className="flex gap-1 overflow-x-auto no-scrollbar px-4">
              {TABS.map((t) => {
                const active = t.match(path);
                const Icon = t.icon;
                return (
                  <Link
                    key={t.to}
                    to={t.to}
                    className={`relative inline-flex items-center gap-1.5 px-3 py-3 text-sm whitespace-nowrap transition-smooth ${
                      active ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
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

          <div className={`${widthCls} mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-16`}>
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
        </main>
      </div>
    </div>
  );
}
