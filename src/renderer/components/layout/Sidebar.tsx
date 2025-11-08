import { NavLink, useLocation } from 'react-router-dom';
import { Listbox, ListboxItem } from '@heroui/react';
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  FileText,
  Settings,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Orders', href: '/orders', icon: ShoppingCart },
  { name: 'Invoices', href: '/invoices', icon: FileText },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 bg-background border-r border-divider flex flex-col">
      <nav className="flex-1 px-3 py-6">
        <Listbox
          aria-label="Navigation"
          variant="flat"
          selectedKeys={[location.pathname]}
        >
          {navigation.map((item) => (
            <ListboxItem
              key={item.href}
              as={NavLink}
              to={item.href}
              startContent={<item.icon className="w-5 h-5" />}
              classNames={{
                base: "mb-1",
              }}
            >
              {item.name}
            </ListboxItem>
          ))}
        </Listbox>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-divider">
        <p className="text-xs text-default-500 text-center">
          ERP System v1.0.0
        </p>
      </div>
    </aside>
  );
}
