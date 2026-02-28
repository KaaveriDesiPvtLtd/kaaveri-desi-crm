import React from 'react';
import { LayoutDashboard, Package, ShoppingCart, BarChart3, Settings, LogOut, Users } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import clsx from 'clsx';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, hasPermission } = useAuth();
  
  const allNavItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/', resource: 'dashboard' },
    { name: 'Inventory', icon: Package, path: '/inventory', resource: 'inventory' },
    { name: 'Orders', icon: ShoppingCart, path: '/orders', resource: 'orders' },
    { name: 'Reports', icon: BarChart3, path: '/reports', resource: 'reports' },
    { name: 'Settings', icon: Settings, path: '/settings', resource: 'settings' },
    { name: 'Users', icon: Users, path: '/users', resource: 'users' },
  ];

  // Filter nav items based on user permissions
  const navItems = allNavItems.filter(item => hasPermission(item.resource, 'read'));

  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div
      className={clsx(
        'fixed lg:static inset-y-0 left-0 z-50',
        'w-64 bg-slate-900 text-white flex flex-col',
        'transform transition-transform duration-300 ease-in-out lg:transform-none',
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}
    >
      {/* Header - Hidden on mobile (shown in Layout) */}
      <div className="p-6 border-b border-slate-800 hidden lg:block">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
          Kaaveri Desi
        </h1>
        <p className="text-xs text-slate-400 mt-1">CRM & Inventory</p>
      </div>

      {/* Mobile Header */}
      <div className="p-6 border-b border-slate-800 lg:hidden">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
          Kaaveri Desi
        </h1>
        <p className="text-xs text-slate-400 mt-1">CRM & Inventory</p>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              onClick={handleLinkClick}
              className={clsx(
                'flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors',
                isActive 
                  ? 'bg-yellow-500 text-slate-900 font-medium' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )}
            >
              <item.icon size={20} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User info + Logout */}
      <div className="p-4 border-t border-slate-800 space-y-3">
        {user && (
          <div className="px-4 py-2">
            <p className="text-sm font-medium text-white truncate">{user.name}</p>
            <p className="text-xs text-slate-400 capitalize">{user.role}</p>
          </div>
        )}
        <button 
          onClick={handleLogout}
          className="flex items-center space-x-3 px-4 py-3 w-full rounded-lg text-slate-300 hover:bg-red-500/10 hover:text-red-400 transition-colors"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
