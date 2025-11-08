import { Card as ShadcnCard, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ReactNode } from 'react';

interface CardProps {
  readonly title?: string;
  readonly children: ReactNode;
  readonly className?: string;
  readonly actions?: ReactNode;
}

export default function Card({ title, children, className = '', actions }: CardProps) {
  return (
    <ShadcnCard className={className}>
      {(title || actions) && (
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          {title && <CardTitle className="text-lg font-semibold">{title}</CardTitle>}
          {actions && <div>{actions}</div>}
        </CardHeader>
      )}
      <CardContent className={title || actions ? 'pt-0' : ''}>{children}</CardContent>
    </ShadcnCard>
  );
}
