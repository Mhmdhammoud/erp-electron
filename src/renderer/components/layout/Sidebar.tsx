import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  FileText,
  Settings,
  ChevronDown,
  Plus,
  List,
  BarChart3,
  Warehouse,
} from 'lucide-react';

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    type: 'single' as const
  },
  {
    name: 'Products',
    icon: Package,
    type: 'group' as const,
    items: [
      { name: 'All Products', href: '/products', icon: List },
      { name: 'Add Product', href: '/products/new', icon: Plus },
      { name: 'Categories', href: '/products/categories', icon: BarChart3 },
    ]
  },
  {
    name: 'Customers',
    icon: Users,
    type: 'group' as const,
    items: [
      { name: 'All Customers', href: '/customers', icon: List },
      { name: 'Add Customer', href: '/customers/new', icon: Plus },
    ]
  },
  {
    name: 'Orders',
    icon: ShoppingCart,
    type: 'group' as const,
    items: [
      { name: 'All Orders', href: '/orders', icon: List },
      { name: 'Create Order', href: '/orders/new', icon: Plus },
    ]
  },
  {
    name: 'Invoices',
    icon: FileText,
    type: 'group' as const,
    items: [
      { name: 'All Invoices', href: '/invoices', icon: List },
      { name: 'Create Invoice', href: '/invoices/new', icon: Plus },
    ]
  },
  {
    name: 'Warehouses',
    icon: Warehouse,
    type: 'group' as const,
    items: [
      { name: 'All Warehouses', href: '/warehouses', icon: List },
      { name: 'Add Warehouse', href: '/warehouses/new', icon: Plus },
    ]
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
    type: 'single' as const
  },
];

export default function Sidebar() {
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState<string[]>(['Products', 'Customers', 'Orders', 'Invoices', 'Warehouses']);

  const toggleGroup = (name: string) => {
    setOpenGroups(prev =>
      prev.includes(name)
        ? prev.filter(g => g !== name)
        : [...prev, name]
    );
  };

  const isGroupActive = (items?: { href: string }[]) => {
    return items?.some(item => location.pathname.startsWith(item.href));
  };

  return (
    <aside className="w-64 bg-background border-r flex flex-col">
      <nav className="flex-1 px-3 py-6 space-y-1">
        {navigation.map((item) => {
          if (item.type === 'single') {
            const isActive = location.pathname === item.href;
            return (
              <Button
                key={item.href}
                asChild
                variant={isActive ? 'secondary' : 'ghost'}
                className={cn(
                  'w-full justify-start',
                  isActive && 'bg-secondary'
                )}
              >
                <NavLink to={item.href!}>
                  <item.icon className="mr-2 h-5 w-5" />
                  {item.name}
                </NavLink>
              </Button>
            );
          }

          // Group type
          const isOpen = openGroups.includes(item.name);
          const hasActiveChild = isGroupActive(item.items);

          return (
            <Collapsible
              key={item.name}
              open={isOpen}
              onOpenChange={() => toggleGroup(item.name)}
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant={hasActiveChild ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-between',
                    hasActiveChild && 'bg-secondary'
                  )}
                >
                  <span className="flex items-center">
                    <item.icon className="mr-2 h-5 w-5" />
                    {item.name}
                  </span>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 transition-transform',
                      isOpen && 'transform rotate-180'
                    )}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 mt-1">
                {item.items?.map((subItem) => {
                  const isActive = location.pathname === subItem.href;
                  return (
                    <Button
                      key={subItem.href}
                      asChild
                      variant={isActive ? 'secondary' : 'ghost'}
                      size="sm"
                      className={cn(
                        'w-full justify-start pl-11',
                        isActive && 'bg-secondary'
                      )}
                    >
                      <NavLink to={subItem.href}>
                        <subItem.icon className="mr-2 h-4 w-4" />
                        {subItem.name}
                      </NavLink>
                    </Button>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t">
        <p className="text-xs text-muted-foreground text-center">
          ERP System v1.0.0
        </p>
      </div>
    </aside>
  );
}
