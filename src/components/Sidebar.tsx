import React, { useState } from "react";
import {
  Home,
  Users,
  UserCheck,
  Settings,
  LogOut,
  Menu,
  X,
  Smartphone,
  Bell,
  Video,
  Zap,
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

const Sidebar: React.FC = () => {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navGroups: NavGroup[] = [
    {
      label: "Overview",
      items: [{ icon: Home, text: "Dashboard", path: "/" }],
    },
    {
      label: "Manage",
      items: [
        { icon: Users, text: "Users", path: "/users" },
        { icon: Zap, text: "Sparks", path: "/sparks" },
        { icon: UserCheck, text: "Listeners", path: "/listeners" },
        { icon: Video, text: "Sessions", path: "/sessions" },
      ],
    },
    {
      label: "Engage",
      items: [{ icon: Bell, text: "Notifications", path: "/notifications" }],
    },
    {
      label: "System",
      items: [
        { icon: Smartphone, text: "App Version", path: "/app-version" },
        { icon: Settings, text: "Settings", path: "/settings" },
      ],
    },
  ];

  const handleNavigation = (path: string) => {
    router.push(path);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    router.push("/auth");
  };

  const isActive = (path: string) => {
    if (path === "/") return router.pathname === "/" || router.pathname === "/dashboard";
    return router.pathname === path || router.pathname.startsWith(`${path}/`);
  };

  return (
    <>
      <button
        type="button"
        aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
        className="lg:hidden fixed top-4 left-4 z-50 flex h-10 w-10 items-center justify-center rounded-md border border-rs-border bg-rs-surface text-rs-text-secondary rs-transition hover:bg-rs-page"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X size={20} strokeWidth={1.75} /> : <Menu size={20} strokeWidth={1.75} />}
      </button>

      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-rs-text/40"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          "fixed lg:static z-50 flex h-screen flex-col border-r border-rs-border bg-rs-sidebar rs-transition",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          isCollapsed ? "w-16" : "w-60"
        )}
      >
        {/* Brand — no color block */}
        <div
          className={cn(
            "flex h-14 shrink-0 items-center border-b border-rs-border",
            isCollapsed ? "justify-center px-2" : "justify-between px-4"
          )}
        >
          {!isCollapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-rs-text tracking-tight">
                Ready Social
              </p>
              <p className="truncate text-xs text-rs-text-muted">Admin</p>
            </div>
          )}
          {isCollapsed && (
            <span
              className="flex h-7 w-7 items-center justify-center rounded-md bg-rs-primary-tint text-xs font-semibold text-rs-primary"
              aria-hidden
            >
              R
            </span>
          )}
          <button
            type="button"
            className="hidden lg:flex h-8 w-8 items-center justify-center rounded-md text-rs-text-muted rs-transition hover:bg-rs-page hover:text-rs-text"
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <PanelLeft size={16} strokeWidth={1.75} />
            ) : (
              <PanelLeftClose size={16} strokeWidth={1.75} />
            )}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-4">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-4">
              {!isCollapsed && (
                <p className="rs-section-label mb-1 px-3">{group.label}</p>
              )}
              <ul className="space-y-0.5">
                {group.items.map((item) => (
                  <NavItem
                    key={item.text}
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

        <div className="shrink-0 border-t border-rs-border p-2">
          <button
            type="button"
            onClick={handleLogout}
            className={cn(
              "flex w-full items-center rounded-md px-3 py-2 text-sm text-rs-text-secondary rs-transition hover:bg-rs-page hover:text-rs-text",
              isCollapsed && "justify-center px-0"
            )}
          >
            <LogOut size={16} strokeWidth={1.75} className="shrink-0" />
            {!isCollapsed && <span className="ml-3">Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

const NavItem: React.FC<NavItemProps> = ({ Icon, text, active, onClick, collapsed }) => {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        title={collapsed ? text : undefined}
        className={cn(
          "relative flex w-full items-center rounded-md px-3 py-2 text-sm rs-transition",
          collapsed && "justify-center px-0",
          active
            ? "bg-rs-page text-rs-text font-medium before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-0.5 before:rounded-full before:bg-rs-primary"
            : "text-rs-text-secondary hover:bg-rs-page hover:text-rs-text"
        )}
      >
        <Icon
          size={16}
          strokeWidth={1.75}
          className={cn("shrink-0", active ? "text-rs-text" : "text-rs-text-muted")}
        />
        {!collapsed && <span className="ml-3 truncate">{text}</span>}
      </button>
    </li>
  );
};

export default Sidebar;
