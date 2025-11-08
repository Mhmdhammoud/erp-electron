import { UserButton } from '@clerk/clerk-react';
import { useTenant } from '../../hooks/useTenant';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ThemeToggle } from '../theme-toggle';
import { Bell, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Header() {
  const { tenant, branding } = useTenant();

  return (
    <header className="bg-background border-b h-16 flex items-center justify-between px-6">
      {/* Logo and Business Name */}
      <div className="flex items-center gap-4">
        {branding?.logoUrl ? (
          <img src={branding.logoUrl} alt={tenant?.name} className="h-10 w-auto" />
        ) : (
          <Avatar className="h-10 w-10 bg-primary">
            <AvatarFallback className="bg-primary text-primary-foreground font-bold">
              {tenant?.name?.charAt(0) || 'E'}
            </AvatarFallback>
          </Avatar>
        )}
        <div>
          <h1 className="text-lg font-semibold">{tenant?.name || 'ERP System'}</h1>
        </div>
      </div>

      {/* Right side - Notifications and User */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <div className="relative">
          <Button variant="ghost" size="icon" aria-label="Notifications">
            <Bell className="w-5 h-5" />
          </Button>
          {/* Notification badge */}
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground">
            5
          </span>
        </div>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Settings */}
        <Button asChild variant="ghost" size="icon" aria-label="Settings">
          <Link to="/settings">
            <Settings className="w-5 h-5" />
          </Link>
        </Button>

        {/* User Menu */}
        <UserButton afterSignOutUrl="/" />
      </div>
    </header>
  );
}
