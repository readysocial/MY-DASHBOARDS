import React, { useEffect, useState } from "react";
import {
  Home,
  Users,
  UserCheck,
  Settings,
  Menu,
  X,
  Smartphone,
  Bell,
  Video,
  Zap,
  CreditCard,
  Tag,
  Search,
  PanelLeftClose,
  PanelLeft,
  LucideIcon,
} from "lucide-react";
import { useRouter } from "next/router";
import { cn } from "@/lib/utils";

interface NavItemProps {
  Icon: LucideIcon;
  text: string;
  active: boolean;
  onClick: () => void;
  collapsed?: boolean;
}

interface NavGroup {
  label: string;
  items: { icon: LucideIcon; text: string; path: string }[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [{ icon: Home, text: "Dashboard", path: "/" }],
  },
  {
    label: "Manage",
    items: [
      { icon: Users, text: "Users", path: "/users" },
      { icon: Zap, text: "Sparks", path: "/sparks" },
      { icon: CreditCard, text: "Payments", path: "/payments" },
      { icon: UserCheck, text: "Listeners", path: "/listeners" },
      { icon: Video, text: "Sessions", path: "/sessions" },
      { icon: Search, text: "Support", path: "/support" },
    ],
  },
  {
    label: "Engage",
    items: [{ icon: Bell, text: "Notifications", path: "/notifications" }],
  },
  {
    label: "System",
    items: [
      { icon: Tag, text: "Pricing", path: "/pricing" },
      { icon: Smartphone, text: "App Version", path: "/app-version" },
      // Audit UI hidden for now — API + /audit page remain; re-enable when ready
      // { icon: ScrollText, text: "Audit", path: "/audit" },
      { icon: Settings, text: "Settings", path: "/settings" },
    ],
  },
];

const COLLAPSED_KEY = "adminSidebarCollapsed";

function readCollapsedPreference(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
}

const Sidebar: React.FC = () => {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    setIsCollapsed(readCollapsedPreference());
  }, []);

  const setCollapsed = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
    try {
      localStorage.setItem(COLLAPSED_KEY, collapsed ? "1" : "0");
    } catch {
      // ignore quota / private mode
    }
  };

  const handleNavigation = (path: string) => {
    router.push(path);
    setIsMobileMenuOpen(false);
  };

  const isActive = (path: string) => {
    if (path === "/")
      return router.pathname === "/" || router.pathname === "/dashboard";
    return router.pathname === path || router.pathname.startsWith(`${path}/`);
  };

  return (
    <>
      <button
        type="button"
        aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-md border border-rs-border bg-rs-surface text-rs-text-secondary rs-transition hover:bg-rs-page lg:hidden"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? (
          <X size={20} strokeWidth={1.75} />
        ) : (
          <Menu size={20} strokeWidth={1.75} />
        )}
      </button>

      {isMobileMenuOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden
        />
      ) : null}

      <aside
        className={cn(
          "fixed z-50 flex h-screen flex-col border-r border-rs-border bg-rs-sidebar-muted rs-transition lg:static",
          isMobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0",
          isCollapsed ? "w-[52px]" : "w-60",
        )}
      >
        <div
          className={cn(
            "flex h-14 shrink-0 items-center",
            isCollapsed ? "justify-center" : "justify-between gap-2 px-3",
          )}
        >
          {isCollapsed ? (
            <button
              type="button"
              className="hidden h-8 w-8 items-center justify-center rounded-md text-rs-text-muted rs-transition hover:bg-rs-surface hover:text-rs-text lg:flex"
              onClick={() => setCollapsed(false)}
              aria-label="Expand sidebar"
              title="Expand sidebar"
            >
              <PanelLeft size={16} strokeWidth={1.75} />
            </button>
          ) : (
            <>
              <div className="flex min-w-0 items-center gap-2.5">
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-rs-primary text-[11px] font-semibold text-white"
                  aria-hidden
                >
                  R
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold tracking-tight text-rs-text">
                    Ready Social
                  </p>
                  <p className="truncate text-[11px] text-rs-text-muted">
                    Admin
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="hidden h-8 w-8 items-center justify-center rounded-md text-rs-text-muted rs-transition hover:bg-rs-surface hover:text-rs-text lg:flex"
                onClick={() => setCollapsed(true)}
                aria-label="Collapse sidebar"
              >
                <PanelLeftClose size={16} strokeWidth={1.75} />
              </button>
            </>
          )}
        </div>

        <nav
          className={cn(
            "flex-1 overflow-y-auto pb-2",
            isCollapsed ? "px-1.5" : "px-2",
          )}
        >
          {isCollapsed ? (
            <div className="mb-1 flex justify-center pb-1 lg:hidden">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-md bg-rs-primary text-[11px] font-semibold text-white"
                aria-hidden
              >
                R
              </span>
            </div>
          ) : null}
          {NAV_GROUPS.map((group, groupIndex) => (
            <div
              key={group.label}
              className={cn(
                isCollapsed ? "mb-1" : "mb-3",
                isCollapsed &&
                  groupIndex > 0 &&
                  "mt-1 border-t border-rs-border/80 pt-1",
              )}
            >
              {!isCollapsed ? (
                <p className="mb-1 px-2.5 text-[11px] font-medium text-rs-text-muted">
                  {group.label}
                </p>
              ) : null}
              <ul className="space-y-0.5">
                {group.items.map((item) => (
                  <NavItem
                    key={item.path}
                    Icon={item.icon}
                    text={item.text}
                    active={isActive(item.path)}
                    collapsed={isCollapsed}
                    onClick={() => handleNavigation(item.path)}
                  />
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {isCollapsed ? (
          <div className="hidden shrink-0 border-t border-rs-border p-1.5 lg:block">
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-md bg-rs-primary text-[11px] font-semibold text-white">
              R
            </div>
          </div>
        ) : null}
      </aside>
    </>
  );
};

const NavItem: React.FC<NavItemProps> = ({
  Icon,
  text,
  active,
  onClick,
  collapsed,
}) => {
  return (
    <li className={cn(collapsed && "flex justify-center")}>
      <button
        type="button"
        onClick={onClick}
        title={collapsed ? text : undefined}
        aria-label={collapsed ? text : undefined}
        className={cn(
          "flex items-center rounded-md text-sm rs-transition",
          collapsed
            ? "h-9 w-9 justify-center"
            : "w-full px-2.5 py-2",
          active
            ? "bg-rs-surface font-medium text-rs-text shadow-[inset_0_0_0_1px_var(--rs-border)]"
            : "text-rs-text-secondary hover:bg-rs-surface/70 hover:text-rs-text",
        )}
      >
        <Icon
          size={16}
          strokeWidth={1.75}
          className={cn(
            "shrink-0",
            active ? "text-rs-primary" : "text-rs-text-muted",
          )}
        />
        {!collapsed ? <span className="ml-2.5 truncate">{text}</span> : null}
      </button>
    </li>
  );
};

export default Sidebar;
