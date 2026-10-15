import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { ListenerSidebar } from './ListenerSidebar';
import { Bell, Menu, Settings, LogOut, ChevronDown } from 'lucide-react';
import { requireListenerAuth } from '@/utils/listenerAuth';
import { cn } from '@/lib/utils';

interface ListenerLayoutProps {
  children: React.ReactNode;
}

export const ListenerLayout: React.FC<ListenerLayoutProps> = ({ children }) => {
  const router = useRouter();
  const [listenerName, setListenerName] = useState<string>('');
  const [listenerEmail, setListenerEmail] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    // Validate session before rendering any listener page. If the session is
    // missing or corrupted, requireListenerAuth() triggers a redirect to the
    // login screen and returns null — in that case we keep the layout blank
    // so no half-rendered page flashes during navigation.
    const auth = requireListenerAuth();
    if (!auth) return;
    setListenerName(auth.listenerData.name || '');
    setListenerEmail(auth.listenerData.email || '');
    setIsAuthChecked(true);
  }, []);

  if (!isAuthChecked) {
    // Render nothing while the auth check (and any redirect) is in flight.
    return null;
  }

  const initials = listenerName
    ? listenerName.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
    : 'LI';

  const handleLogout = () => {
    localStorage.removeItem('listenerToken');
    localStorage.removeItem('listenerData');
    localStorage.removeItem('listenerId');
    router.push('/listener/login');
  };

  return (
    <div className="flex h-screen bg-rs-page">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-60 transform rs-transition
        lg:static lg:translate-x-0 lg:transform-none
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <ListenerSidebar onCloseSidebar={() => setIsSidebarOpen(false)} />
      </div>

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Navigation — matches admin Navbar */}
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-rs-border bg-rs-surface px-3 sm:gap-4 sm:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-3">
            <button
              className="shrink-0 rounded-md p-2 text-rs-text-muted hover:bg-rs-page hover:text-rs-text lg:hidden"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={20} strokeWidth={1.75} />
            </button>
            <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-sm">
              <span className="hidden shrink-0 text-rs-text-muted md:inline">Listener</span>
              <span className="hidden shrink-0 text-rs-text-muted md:inline" aria-hidden>/</span>
              <span className="truncate font-medium text-rs-text">Welcome, {listenerName || 'Listener'}</span>
            </nav>
          </div>
            
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              aria-label="Notifications"
              className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-rs-text-secondary rs-transition hover:bg-rs-page hover:text-rs-text"
            >
              <Bell size={16} strokeWidth={1.75} />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-rs-primary" />
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                className={cn(
                  "flex items-center gap-1.5 rounded-md border border-rs-border bg-rs-surface py-1 pl-1 pr-1.5 text-sm rs-transition hover:bg-rs-page sm:gap-2 sm:pr-2",
                  menuOpen && "bg-rs-page",
                )}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-rs-primary-tint text-[11px] font-semibold text-rs-primary">
                  {initials}
                </span>
                <span className="hidden max-w-[8rem] truncate text-rs-text-secondary lg:inline">
                  {listenerName || 'Listener'}
                </span>
                <ChevronDown
                  className={cn("h-3.5 w-3.5 shrink-0 text-rs-text-muted rs-transition", menuOpen && "rotate-180")}
                  strokeWidth={1.75}
                />
              </button>
              {menuOpen ? (
                <div role="menu" className="absolute right-0 top-[calc(100%+6px)] z-50 w-52 overflow-hidden rounded-lg border border-rs-border bg-rs-surface py-1 shadow-sm">
                  <div className="border-b border-rs-border px-3 py-2">
                    <p className="truncate text-xs font-medium text-rs-text">{listenerEmail || listenerName || 'Listener'}</p>
                    <p className="text-[11px] text-rs-text-muted">Signed in</p>
                  </div>
                  <button
                    type="button"
                    role="menuitem"
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-rs-text-secondary rs-transition hover:bg-rs-page hover:text-rs-text"
                    onClick={() => { setMenuOpen(false); router.push('/listener/profile'); }}
                  >
                    <Settings size={14} strokeWidth={1.75} />
                    Profile
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-rs-text-secondary rs-transition hover:bg-rs-page hover:text-rs-text"
                    onClick={handleLogout}
                  >
                    <LogOut size={14} strokeWidth={1.75} />
                    Log out
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        {/* Page Content — matches admin Layout container */}
        <main className="flex-1 overflow-y-auto bg-rs-page">
          <div className="mx-auto w-full max-w-content px-4 py-6 sm:px-6 sm:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}; 