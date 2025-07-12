import React, { useEffect, useState } from 'react';
import { ListenerSidebar } from './ListenerSidebar';
import { Bell, Menu } from 'lucide-react';

interface ListenerLayoutProps {
  children: React.ReactNode;
}

interface ListenerData {
  _id: string;
  name: string;
  email: string;
}

export const ListenerLayout: React.FC<ListenerLayoutProps> = ({ children }) => {
  const [listenerName, setListenerName] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    // Get listener data from localStorage
    const listenerDataStr = localStorage.getItem('listenerData');
    if (listenerDataStr) {
      try {
        const listenerData: ListenerData = JSON.parse(listenerDataStr);
        setListenerName(listenerData.name || '');
      } catch (error) {
        console.error('Error parsing listener data:', error);
      }
    }
  }, []);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-30 w-64 transform bg-white transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0 lg:transform-none
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <ListenerSidebar onCloseSidebar={() => setIsSidebarOpen(false)} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation */}
        <header className="bg-white border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-4 sm:px-6">
            {/* Mobile menu button */}
            <button
              className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>

            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 hidden sm:block">
              Welcome, {listenerName || 'Listener'}
            </h1>
            
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="p-2 text-gray-600 hover:text-purple-600 rounded-lg
                hover:bg-purple-50 transition-colors relative">
                <Bell className="h-6 w-6" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
              </button>

              {/* Profile Picture */}
              <button className="flex items-center space-x-3 p-2 rounded-lg
                hover:bg-purple-50 transition-colors">
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(listenerName || 'Listener')}`}
                  alt="Profile"
                  className="h-8 w-8 rounded-full"
                />
                <span className="text-sm font-medium text-gray-700 hidden sm:block">
                  {listenerName || 'Listener'}
                </span>
              </button>
            </div>
          </div>
          {/* Mobile Welcome Text */}
          <div className="px-4 pb-4 sm:hidden">
            <h1 className="text-xl font-semibold text-gray-900">
              Welcome, {listenerName || 'Listener'}
            </h1>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}; 