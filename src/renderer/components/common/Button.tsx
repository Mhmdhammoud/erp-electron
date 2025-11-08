import { Button as HeroButton, ButtonProps as HeroButtonProps } from '@heroui/react';
import { ReactNode } from 'react';

interface ButtonProps extends Omit<HeroButtonProps, 'color' | 'variant'> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: ReactNode;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  children,
  ...props
}: ButtonProps) {
  const colorMap = {
    primary: 'primary' as const,
    secondary: 'default' as const,
    danger: 'danger' as const,
    ghost: 'default' as const,
  };

  const variantMap = {
    primary: 'solid' as const,
    secondary: 'bordered' as const,
    danger: 'solid' as const,
    ghost: 'light' as const,
  };

  return (
    <HeroButton
      color={colorMap[variant]}
      variant={variantMap[variant]}
      size={size}
      isLoading={isLoading}
      {...props}
    >
      {children}
    </HeroButton>
  );
}
