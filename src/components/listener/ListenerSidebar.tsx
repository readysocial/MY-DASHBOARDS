import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  LayoutDashboard,
  Calendar,
  UserCircle,
  LogOut,
  Tag,
  X
} from 'lucide-react';

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
    name: 'Topics',
    href: '/listener/topics',
    icon: Tag
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
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Logo and Close Button */}
      <div className="p-6 flex items-center justify-between">
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
        {onCloseSidebar && (
          <button
            onClick={onCloseSidebar}
            className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => onCloseSidebar?.()}
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