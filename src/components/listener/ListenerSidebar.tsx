import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  LayoutDashboard,
  Calendar,
  UserCircle,
  LogOut,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ListenerSidebarProps {
  onCloseSidebar?: () => void;
}

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/listener/dashboard',
    icon: LayoutDashboard
  },
  {
    name: 'Sessions',
    href: '/listener/sessions',
    icon: Calendar
  },
  {
    name: 'Profile',
    href: '/listener/profile',
    icon: UserCircle
  }
];

export const ListenerSidebar = ({ onCloseSidebar }: ListenerSidebarProps) => {
  const router = useRouter();

  const isActive = (path: string) => {
    return router.pathname === path;
  };

  const handleLogout = () => {
    // TODO: Implement logout logic
    router.push('/auth');
  };

  return (
    <div className="flex h-full flex-col border-r border-rs-border bg-rs-sidebar-muted">
      {/* Logo and Close Button */}
      <div className="flex h-14 shrink-0 items-center justify-between gap-2 px-3">
        <Link href="/listener/dashboard" className="flex min-w-0 items-center gap-2.5">
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
              Listener
            </p>
          </div>
        </Link>
        {onCloseSidebar && (
          <button
            onClick={onCloseSidebar}
            className="rounded-md p-2 text-rs-text-muted hover:bg-rs-surface hover:text-rs-text lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" strokeWidth={1.75} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 pb-2">
        <p className="mb-1 px-2.5 text-[11px] font-medium text-rs-text-muted">
          Overview
        </p>
        <ul className="space-y-0.5">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  onClick={() => onCloseSidebar?.()}
                  className={cn(
                    "flex w-full items-center rounded-md px-2.5 py-2 text-sm rs-transition",
                    active
                      ? "bg-rs-surface font-medium text-rs-text shadow-[inset_0_0_0_1px_var(--rs-border)]"
                      : "text-rs-text-secondary hover:bg-rs-surface/70 hover:text-rs-text",
                  )}
                >
                  <Icon
                    size={16}
                    strokeWidth={1.75}
                    className={cn(
                      "mr-2.5 shrink-0",
                      active ? "text-rs-primary" : "text-rs-text-muted",
                    )}
                  />
                  <span className="truncate">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Profile & Logout */}
      <div className="shrink-0 border-t border-rs-border p-2">
        <button
          onClick={handleLogout}
          className="flex w-full items-center rounded-md px-2.5 py-2 text-sm text-rs-text-secondary rs-transition hover:bg-rs-surface/70 hover:text-rs-text"
        >
          <LogOut size={16} strokeWidth={1.75} className="mr-2.5 shrink-0 text-rs-text-muted" />
          <span className="truncate">Logout</span>
        </button>
      </div>
    </div>
  );
}; 