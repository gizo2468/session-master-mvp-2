
import * as React from "react"

import { cn } from "@/lib/utils"
import { useKeyboardAwareScroll } from "@/hooks/useKeyboardAwareScroll"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, onFocus, onBlur, ...props }, ref) => {
    const keyboardScroll = useKeyboardAwareScroll();
    
    // Combine refs
    const combinedRef = React.useCallback((node: HTMLInputElement) => {
      keyboardScroll.ref.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    }, [ref, keyboardScroll.ref]);

    // Combine event handlers
    const handleFocus = React.useCallback((e: React.FocusEvent<HTMLInputElement>) => {
      keyboardScroll.onFocus();
      onFocus?.(e);
    }, [keyboardScroll.onFocus, onFocus]);

    const handleBlur = React.useCallback((e: React.FocusEvent<HTMLInputElement>) => {
      keyboardScroll.onBlur();
      onBlur?.(e);
    }, [keyboardScroll.onBlur, onBlur]);

    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={combinedRef}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
