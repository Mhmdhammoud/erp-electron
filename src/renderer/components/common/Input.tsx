import { Input as HeroInput, InputProps as HeroInputProps } from '@heroui/react';
import { forwardRef } from 'react';

interface InputProps extends Omit<HeroInputProps, 'errorMessage' | 'description'> {
  readonly helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    return (
      <HeroInput
        ref={ref}
        label={label}
        errorMessage={error}
        description={helperText && !error ? helperText : undefined}
        isInvalid={!!error}
        className={className}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export default Input;
