import { Input as ShadcnInput } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { forwardRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  readonly label?: string;
  readonly error?: string;
  readonly helperText?: string;
  readonly startContent?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', id, startContent, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).slice(2, 11)}`;

    let ariaDescribedBy: string | undefined;
    if (error) {
      ariaDescribedBy = `${inputId}-error`;
    } else if (helperText) {
      ariaDescribedBy = `${inputId}-helper`;
    }

    return (
      <div className="w-full space-y-2">
        {label && (
          <Label htmlFor={inputId} className={error ? 'text-destructive' : ''}>
            {label}
            {props.required && <span className="text-destructive ml-1">*</span>}
          </Label>
        )}
        <div className="relative">
          {startContent && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              {startContent}
            </div>
          )}
          <ShadcnInput
            ref={ref}
            id={inputId}
            className={cn(
              error && 'border-destructive focus-visible:ring-destructive',
              startContent && 'pl-10',
              className
            )}
            aria-invalid={!!error}
            aria-describedby={ariaDescribedBy}
            {...props}
          />
        </div>
        {error && (
          <p id={`${inputId}-error`} className="text-sm text-destructive">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${inputId}-helper`} className="text-sm text-muted-foreground">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
