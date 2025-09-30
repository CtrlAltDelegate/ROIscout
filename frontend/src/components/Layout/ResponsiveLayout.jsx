import React, { useState, useEffect } from 'react';
import { Menu, X, Bell, User, Search, Home, BarChart3, Map, Settings, LogOut } from 'lucide-react';

const ResponsiveLayout = ({ children, user, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home, current: true },
    { name: 'Map View', href: '/map', icon: Map, current: false },
    { name: 'Analytics', href: '/analytics', icon: BarChart3, current: false },
    { name: 'Settings', href: '/settings', icon: Settings, current: false },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      {isMobile && (
        <div className="bg-white shadow-sm border-b border-gray-200 lg:hidden">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  {isMobileMenuOpen ? (
                    <X className="w-6 h-6" />
                  ) : (
                    <Menu className="w-6 h-6" />
                  )}
                </button>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-lg font-bold text-gray-900">ROI Scout</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors">
                  <Search className="w-5 h-5" />
                </button>
                <button className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors relative">
                  <Bell className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                </button>
                <button className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors">
                  <User className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {isMobileMenuOpen && (
            <div className="border-t border-gray-200 bg-white">
              <div className="px-4 py-3 space-y-1">
                {navigation.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      item.current
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </a>
                ))}
                
                <div className="pt-3 mt-3 border-t border-gray-200">
                  <div className="flex items-center px-3 py-2 text-sm text-gray-600">
                    <User className="w-5 h-5 mr-3" />
                    <div>
                      <div className="font-medium text-gray-900">{user?.name || 'User'}</div>
                      <div className="text-xs text-gray-500">{user?.email}</div>
                    </div>
                  </div>
                  <button
                    onClick={onLogout}
                    className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut className="w-5 h-5 mr-3" />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex">
        {/* Desktop Sidebar */}
        {!isMobile && (
          <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0">
            <div className="flex flex-col flex-grow bg-white border-r border-gray-200 overflow-y-auto">
              {/* Logo */}
              <div className="flex items-center flex-shrink-0 px-6 py-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-gray-900">ROI Scout</div>
                    <div className="text-xs text-gray-500">Investment Analytics</div>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex-1 px-4 py-6">
                <nav className="space-y-2">
                  {navigation.map((item) => (
                    <a
                      key={item.name}
                      href={item.href}
                      className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        item.current
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <item.icon className="w-5 h-5 mr-3" />
                      {item.name}
                    </a>
                  ))}
                </nav>

                {/* Quick Stats Card */}
                <div className="mt-8 p-4 bg-gradient-to-br from-emerald-50 to-blue-50 rounded-xl border border-emerald-100">
                  <div className="text-sm font-semibold text-gray-900 mb-2">Today's Activity</div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Properties Analyzed</span>
                      <span className="font-medium text-gray-900">24</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Deals Found</span>
                      <span className="font-medium text-emerald-600">3</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Avg ROI</span>
                      <span className="font-medium text-gray-900">5.8%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* User Profile */}
              <div className="flex-shrink-0 border-t border-gray-200 p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {user?.name || 'User'}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {user?.email}
                    </div>
                  </div>
                  <button
                    onClick={onLogout}
                    className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className={`flex-1 ${!isMobile ? 'lg:pl-64' : ''}`}>
          {/* Desktop Header */}
          {!isMobile && (
            <div className="bg-white shadow-sm border-b border-gray-200">
              <div className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-sm text-gray-500 mt-1">
                      Welcome back! Here's your investment overview.
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search properties..."
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 w-64"
                      />
                    </div>
                    
                    {/* Notifications */}
                    <button className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors relative">
                      <Bell className="w-5 h-5" />
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                    </button>
                    
                    {/* Profile */}
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-600" />
                      </div>
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">{user?.name || 'User'}</div>
                        <div className="text-gray-500">Pro Plan</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Page Content */}
          <main className="flex-1">
            <div className={`${isMobile ? 'p-4' : 'p-6'}`}>
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default ResponsiveLayout;
