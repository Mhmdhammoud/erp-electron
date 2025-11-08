import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingProps {
  readonly label?: string;
  readonly size?: 'sm' | 'md' | 'lg';
  readonly className?: string;
}

export default function Loading({
  label = 'Loading...',
  size = 'lg',
  className = '',
}: LoadingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div className={cn('flex items-center justify-center min-h-screen', className)}>
      <div className="text-center">
        <Loader2 className={cn('animate-spin text-primary mx-auto', sizeClasses[size])} />
        {label && <p className="mt-4 text-muted-foreground">{label}</p>}
      </div>
    </div>
  );
}
