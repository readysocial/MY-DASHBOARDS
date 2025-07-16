import React, { useState } from 'react';
import { Home, Users, UserCheck, BarChart2, Settings, LogOut, Menu, X, LucideIcon } from 'lucide-react';
import { useRouter } from 'next/router';

interface NavItemProps {
  Icon: LucideIcon;
  text: string;
  active: boolean;
  onClick: () => void;
  collapsed?: boolean;
}

const Sidebar: React.FC = () => {
  const router = useRouter();
  const [activeItem, setActiveItem] = useState<string>('Dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { icon: Home, text: 'Dashboard', path: '/' },
    { icon: Users, text: 'Users', path: '/users' },
    { icon: UserCheck, text: 'Listeners', path: '/listeners' },
    { icon: LogOut, text: 'Sessions', path: '/sessions' },
    // { icon: BarChart2, text: 'Analytics', path: '/analytics' },
    { icon: Settings, text: 'Settings', path: '/settings' },
  ];

  const handleNavigation = (path: string, text: string) => {
    setActiveItem(text);
    router.push(path);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    router.push('/auth');
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white shadow-md"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? (
          <X size={24} className="text-gray-600" />
        ) : (
          <Menu size={24} className="text-gray-600" />
        )}
      </button>

      {/* Overlay for mobile menu */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div
        className={`
          fixed lg:static
          h-screen
          bg-white
          shadow-lg
          transition-all
          duration-300
          z-50
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isCollapsed ? 'w-20' : 'w-64'}
        `}
      >
        {/* Header */}
        <div className="bg-red-600 p-4 flex items-center justify-between">
        <h1 className={`text-white font-extrabold tracking-wider ${isCollapsed ? 'text-xl' : 'text-2xl'}`}>
    Ready Social
  </h1>
          <button
            className="hidden lg:block text-white"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? (
              <Menu size={20} />
            ) : (
              <X size={20} />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-grow overflow-y-auto">
          <ul className="space-y-1 p-2">
            {menuItems.map((item) => (
              <NavItem
                key={item.text}
                Icon={item.icon}
                text={item.text}
                active={router.pathname === item.path}
                collapsed={isCollapsed}
                onClick={() => handleNavigation(item.path, item.text)}
              />
            ))}
          </ul>
        </nav>

        {/* Logout Button */}
        <button 
          onClick={handleLogout}
          className={`
            flex items-center p-4 hover:bg-gray-100 w-full
            ${isCollapsed ? 'justify-center' : ''}
          `}
        >
          <LogOut size={20} className="text-gray-600" />
          {!isCollapsed && <span className="text-gray-600 ml-3">Logout</span>}
        </button>
      </div>
    </>
  );
};

const NavItem: React.FC<NavItemProps> = ({ Icon, text, active, onClick, collapsed }) => {
  return (
    <li
      onClick={onClick}
      className={`
        flex items-center py-2 px-3 rounded-lg cursor-pointer
        ${active ? 'bg-red-100 text-red-600' : 'text-gray-600 hover:bg-gray-100'}
        ${collapsed ? 'justify-center' : ''}
      `}
    >
      <Icon size={20} className={active ? 'text-red-600' : 'text-gray-400'} />
      {!collapsed && <span className="ml-3">{text}</span>}
    </li>
  );
};

export default Sidebar;