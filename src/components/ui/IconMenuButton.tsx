import * as React from 'react';
import { cn } from '@/lib/utils';

interface IconMenuButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

/**
 * A button component optimized for icon-only menu triggers.
 * Meets Apple HIG minimum touch target of 44x44 points for reliable iOS taps.
 */
const IconMenuButton = React.forwardRef<HTMLButtonElement, IconMenuButtonProps>(
  ({ className, children, onClick, ...props }, ref) => {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      onClick?.(e);
    };

    return (
      <button
        ref={ref}
        type="button"
        onClick={handleClick}
        className={cn(
          "inline-flex items-center justify-center",
          "min-w-[44px] min-h-[44px]", // Apple HIG minimum touch target
          "rounded-md",
          "hover:bg-muted/50 active:bg-muted/70",
          "transition-colors",
          "cursor-pointer",
          "select-none",
          "outline-none focus-visible:ring-2 focus-visible:ring-ring",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

IconMenuButton.displayName = 'IconMenuButton';

export { IconMenuButton };
