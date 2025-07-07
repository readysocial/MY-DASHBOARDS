import React from 'react';
import { ListenerSidebar } from './ListenerSidebar';
import { Bell } from 'lucide-react';

interface ListenerLayoutProps {
  children: React.ReactNode;
}

export const ListenerLayout: React.FC<ListenerLayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0">
        <ListenerSidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation */}
        <header className="bg-white border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            <h1 className="text-2xl font-semibold text-gray-900">
              Welcome, Listener
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
                  src="https://ui-avatars.com/api/?name=John+Doe"
                  alt="Profile"
                  className="h-8 w-8 rounded-full"
                />
                <span className="text-sm font-medium text-gray-700">
                  John Doe
                </span>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}; 