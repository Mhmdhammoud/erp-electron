import { Card as HeroCard, CardHeader, CardBody } from '@heroui/react';
import { ReactNode } from 'react';

interface CardProps {
  readonly title?: string;
  readonly children: ReactNode;
  readonly className?: string;
  readonly actions?: ReactNode;
}

export default function Card({ title, children, className = '', actions }: CardProps) {
  return (
    <HeroCard className={className}>
      {(title || actions) && (
        <CardHeader className="flex items-center justify-between">
          {title && <h3 className="text-lg font-semibold">{title}</h3>}
          {actions && <div>{actions}</div>}
        </CardHeader>
      )}
      <CardBody>{children}</CardBody>
    </HeroCard>
  );
}
