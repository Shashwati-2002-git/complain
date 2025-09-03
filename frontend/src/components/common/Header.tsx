import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { Shield, Bell, LogOut, User, Settings } from 'lucide-react';

export function Header() {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">ComplaintHub</h1>
              <p className="text-xs text-gray-500">AI-Powered Support</p>
            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            {/* Role Badge */}
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              user?.role === 'admin' ? 'bg-red-100 text-red-800' :
              user?.role === 'agent' ? 'bg-purple-100 text-purple-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {user?.role?.toUpperCase()}
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-600 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors duration-200"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg w-80 max-h-96 overflow-y-auto">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-800">Notifications</h3>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        No notifications yet
                      </div>
                    ) : (
                      notifications.slice(0, 5).map((notification) => (
                        <div
                          key={notification.id}
                          onClick={() => markAsRead(notification.id)}
                          className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors duration-200 ${
                            !notification.read ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-1 rounded-full ${
                              notification.type === 'success' ? 'bg-green-100 text-green-600' :
                              notification.type === 'error' ? 'bg-red-100 text-red-600' :
                              notification.type === 'warning' ? 'bg-orange-100 text-orange-600' :
                              'bg-blue-100 text-blue-600'
                            }`}>
                              <Bell className="w-3 h-3" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-800 text-sm">{notification.title}</p>
                              <p className="text-gray-600 text-xs mt-1 line-clamp-2">{notification.message}</p>
                              <p className="text-gray-400 text-xs mt-1">
                                {notification.timestamp.toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors duration-200"
              >
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-full">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-800 text-sm">{user?.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                </div>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg w-48">
                  <div className="p-2">
                    <button className="w-full text-left p-2 hover:bg-gray-50 rounded-lg flex items-center gap-2 text-sm text-gray-700 transition-colors duration-200">
                      <Settings className="w-4 h-4" />
                      Settings
                    </button>
                    <button
                      onClick={logout}
                      className="w-full text-left p-2 hover:bg-gray-50 rounded-lg flex items-center gap-2 text-sm text-red-600 transition-colors duration-200"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}