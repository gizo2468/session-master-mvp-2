
import * as React from "react"
import { cn } from "@/lib/utils"
import { useKeyboardAwareScroll } from "@/hooks/useKeyboardAwareScroll"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, onFocus, onBlur, ...props }, ref) => {
    const keyboardAware = useKeyboardAwareScroll();
    
    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      keyboardAware.onFocus();
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      keyboardAware.onBlur();
      onBlur?.(e);
    };

    const combinedRef = (node: HTMLInputElement) => {
      // Set the keyboard-aware ref
      keyboardAware.ref.current = node;
      
      // Handle the forwarded ref
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    };

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
