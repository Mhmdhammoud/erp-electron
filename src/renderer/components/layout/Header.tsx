import { UserButton } from '@clerk/clerk-react';
import { useTenant } from '../../hooks/useTenant';
import { Bell, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Header() {
  const { tenant, branding } = useTenant();

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6">
      {/* Logo and Business Name */}
      <div className="flex items-center space-x-4">
        {branding?.logoUrl ? (
          <img src={branding.logoUrl} alt={tenant?.name} className="h-10 w-auto" />
        ) : (
          <div className="h-10 w-10 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold">
            {tenant?.name?.charAt(0) || 'E'}
          </div>
        )}
        <div>
          <h1 className="text-lg font-semibold text-gray-900">{tenant?.name || 'ERP System'}</h1>
        </div>
      </div>

      {/* Right side - Notifications and User */}
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <button className="p-2 text-gray-400 hover:text-gray-600 relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
        </button>

        {/* Settings */}
        <Link
          to="/settings"
          className="p-2 text-gray-400 hover:text-gray-600"
        >
          <Settings className="w-5 h-5" />
        </Link>

        {/* User Menu */}
        <UserButton afterSignOutUrl="/" />
      </div>
    </header>
  );
}
