import { Chip, ChipProps } from '@heroui/react';
import { ReactNode } from 'react';

interface BadgeProps {
  readonly children: ReactNode;
  readonly variant?: 'success' | 'warning' | 'danger' | 'info' | 'gray';
  readonly className?: string;
}

export default function Badge({ children, variant = 'gray', className = '' }: BadgeProps) {
  const colorMap: Record<string, ChipProps['color']> = {
    success: 'success',
    warning: 'warning',
    danger: 'danger',
    info: 'primary',
    gray: 'default',
  };

  return (
    <Chip color={colorMap[variant]} variant="flat" size="sm" className={className}>
      {children}
    </Chip>
  );
}
