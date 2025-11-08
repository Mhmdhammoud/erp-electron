import { UserButton } from '@clerk/clerk-react';
import { useTenant } from '../../hooks/useTenant';
import { Button, Badge, Avatar } from '@heroui/react';
import { Bell, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Header() {
  const { tenant, branding } = useTenant();

  return (
    <header className="bg-background border-b border-divider h-16 flex items-center justify-between px-6">
      {/* Logo and Business Name */}
      <div className="flex items-center gap-4">
        {branding?.logoUrl ? (
          <img src={branding.logoUrl} alt={tenant?.name} className="h-10 w-auto" />
        ) : (
          <Avatar
            name={tenant?.name?.charAt(0) || 'E'}
            size="md"
            classNames={{
              base: "bg-primary",
              name: "text-white font-bold"
            }}
          />
        )}
        <div>
          <h1 className="text-lg font-semibold">{tenant?.name || 'ERP System'}</h1>
        </div>
      </div>

      {/* Right side - Notifications and User */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <Badge content="5" color="danger" size="sm">
          <Button isIconOnly variant="light" aria-label="Notifications">
            <Bell className="w-5 h-5" />
          </Button>
        </Badge>

        {/* Settings */}
        <Button as={Link} to="/settings" isIconOnly variant="light" aria-label="Settings">
          <Settings className="w-5 h-5" />
        </Button>

        {/* User Menu */}
        <UserButton afterSignOutUrl="/" />
      </div>
    </header>
  );
}
