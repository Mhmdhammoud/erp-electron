import { Spinner } from '@heroui/react';

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
  return (
    <div className={`flex items-center justify-center min-h-screen ${className}`}>
      <div className="text-center">
        <Spinner size={size} color="primary" />
        {label && <p className="mt-4 text-default-600">{label}</p>}
      </div>
    </div>
  );
}
