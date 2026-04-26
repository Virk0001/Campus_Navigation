import { memo, useMemo } from 'react';
import { clsx } from 'clsx';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const LoadingSpinner = memo<LoadingSpinnerProps>(({ 
  size = 'md', 
  className 
}) => {
  const sizeClasses = useMemo(() => ({
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }), []);

  const spinnerClassName = useMemo(() => clsx(
    'loading-spinner',
    sizeClasses[size],
    className
  ), [sizeClasses, size, className]);

  return (
    <div
      className={spinnerClassName}
      aria-label="Loading..."
      role="status"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
});

LoadingSpinner.displayName = 'LoadingSpinner';

export default LoadingSpinner;
