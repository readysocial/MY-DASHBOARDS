import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { ChevronDown, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ROUTE_META: { path: string; label: string; group?: string }[] = [
  { path: "/", label: "Dashboard", group: "Overview" },
  { path: "/dashboard", label: "Dashboard", group: "Overview" },
  { path: "/users", label: "Users", group: "Manage" },
  { path: "/sparks", label: "Sparks", group: "Manage" },
  { path: "/listeners", label: "Listeners", group: "Manage" },
  { path: "/sessions", label: "Sessions", group: "Manage" },
  { path: "/notifications", label: "Notifications", group: "Engage" },
  { path: "/app-version", label: "App Version", group: "System" },
  { path: "/settings", label: "Settings", group: "System" },
];

function resolveRoute(pathname: string) {
  const exact = ROUTE_META.find((r) => r.path === pathname);
  if (exact) return exact;
  return (
    ROUTE_META.find(
      (r) => r.path !== "/" && pathname.startsWith(`${r.path}/`),
    ) ?? { label: "Admin", group: undefined }
  );
}

export default function Navbar() {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const route = resolveRoute(router.pathname);

  useEffect(() => {
    setEmail(localStorage.getItem("adminEmail"));
  }, [router.pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointer = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminEmail");
    router.push("/auth");
  };

  const initials = email
    ? email
        .split("@")[0]
        .slice(0, 2)
        .toUpperCase()
    : "AD";

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-4 border-b border-rs-border bg-rs-surface px-4 pl-16 sm:px-6 lg:pl-6">
      <div className="min-w-0">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-sm"
        >
          {route.group ? (
            <>
              <span className="hidden text-rs-text-muted sm:inline">
                {route.group}
              </span>
              <span
                className="hidden text-rs-text-muted sm:inline"
                aria-hidden
              >
                /
              </span>
            </>
          ) : null}
          <span className="truncate font-medium text-rs-text">{route.label}</span>
        </nav>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="hidden text-rs-text-secondary sm:inline-flex"
          onClick={() => router.push("/settings")}
        >
          <Settings className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.75} />
          Settings
        </Button>

        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            className={cn(
              "flex items-center gap-2 rounded-md border border-rs-border bg-rs-surface py-1 pl-1 pr-2 text-sm rs-transition",
              "hover:bg-rs-page",
              menuOpen && "bg-rs-page",
            )}
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-rs-primary-tint text-[11px] font-semibold text-rs-primary">
              {initials}
            </span>
            <span className="hidden max-w-[10rem] truncate text-rs-text-secondary md:inline">
              {email ?? "Admin"}
            </span>
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 text-rs-text-muted rs-transition",
                menuOpen && "rotate-180",
              )}
              strokeWidth={1.75}
            />
          </button>

          {menuOpen ? (
            <div
              role="menu"
              className="absolute right-0 top-[calc(100%+6px)] z-50 w-52 overflow-hidden rounded-lg border border-rs-border bg-rs-surface py-1 shadow-sm"
            >
              <div className="border-b border-rs-border px-3 py-2">
                <p className="truncate text-xs font-medium text-rs-text">
                  {email ?? "Admin account"}
                </p>
                <p className="text-[11px] text-rs-text-muted">Signed in</p>
              </div>
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-rs-text-secondary rs-transition hover:bg-rs-page hover:text-rs-text"
                onClick={() => {
                  setMenuOpen(false);
                  router.push("/settings");
                }}
              >
                <Settings className="h-3.5 w-3.5" strokeWidth={1.75} />
                Settings
              </button>
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-rs-text-secondary rs-transition hover:bg-rs-page hover:text-rs-text"
                onClick={handleLogout}
              >
                <LogOut className="h-3.5 w-3.5" strokeWidth={1.75} />
                Log out
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
