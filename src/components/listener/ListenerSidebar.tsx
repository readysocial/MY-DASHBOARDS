import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  LayoutDashboard,
  Calendar,
  UserCircle,
  BarChart3,
  Settings,
  LogOut,
} from 'lucide-react';

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
  },
  {
    name: 'Analytics',
    href: '/listener/analytics',
    icon: BarChart3
  },
  {
    name: 'Settings',
    href: '/listener/settings',
    icon: Settings
  }
];

export const ListenerSidebar = () => {
  const router = useRouter();

  const isActive = (path: string) => {
    return router.pathname === path;
  };

  const handleLogout = () => {
    // TODO: Implement logout logic
    router.push('/auth');
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="p-6">
        <Link href="/listener/dashboard" className="flex items-center">
          <img
            src="/logo.jpg"
            alt="Logo"
            className="h-8 w-8 rounded-full"
          />
          <span className="ml-3 text-xl font-semibold text-gray-900">
            Listener Portal
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg
                transition-colors duration-150 hover:bg-purple-50
                ${isActive(item.href)
                  ? 'text-purple-700 bg-purple-50'
                  : 'text-gray-700 hover:text-purple-700'
                }`}
            >
              <Icon className="h-5 w-5 mr-3" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Profile & Logout */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="flex items-center px-4 py-3 text-sm font-medium text-gray-700
            rounded-lg transition-colors duration-150 hover:bg-red-50 hover:text-red-700
            w-full"
        >
          <LogOut className="h-5 w-5 mr-3" />
          Logout
        </button>
      </div>
    </div>
  );
}; 