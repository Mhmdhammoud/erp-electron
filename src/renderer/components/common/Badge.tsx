import { Badge as ShadcnBadge } from '@/components/ui/badge';
import { ReactNode } from 'react';

interface BadgeProps {
  readonly children: ReactNode;
  readonly variant?: 'success' | 'warning' | 'danger' | 'info' | 'gray';
  readonly className?: string;
}

export default function Badge({ children, variant = 'gray', className = '' }: BadgeProps) {
  const variantMap: Record<
    string,
    'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline'
  > = {
    success: 'success',
    warning: 'warning',
    danger: 'destructive',
    info: 'default',
    gray: 'secondary',
  };

  return (
    <ShadcnBadge variant={variantMap[variant]} className={className}>
      {children}
    </ShadcnBadge>
  );
}
