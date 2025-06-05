
import * as React from "react"
import { cn } from "@/lib/utils"
import { useKeyboardAwareScroll } from "@/hooks/useKeyboardAwareScroll"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, onFocus, onBlur, ...props }, ref) => {
    const internalRef = React.useRef<HTMLInputElement>(null);
    const inputRef = (ref as React.RefObject<HTMLInputElement>) || internalRef;
    const { handleFocus, handleBlur: handleKeyboardBlur } = useKeyboardAwareScroll();

    const handleInputFocus = React.useCallback((event: React.FocusEvent<HTMLInputElement>) => {
      if (inputRef.current) {
        handleFocus(inputRef.current);
      }
      onFocus?.(event);
    }, [handleFocus, onFocus, inputRef]);

    const handleInputBlur = React.useCallback((event: React.FocusEvent<HTMLInputElement>) => {
      handleKeyboardBlur();
      onBlur?.(event);
    }, [handleKeyboardBlur, onBlur]);

    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={inputRef}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
