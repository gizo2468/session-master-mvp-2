
import * as React from "react"

import { cn } from "@/lib/utils"
import { useKeyboardAwareScroll } from "@/hooks/useKeyboardAwareScroll"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, onFocus, onBlur, ...props }, ref) => {
    const keyboardScroll = useKeyboardAwareScroll({ paddingTop: 30 }); // Extra padding for multiline text
    
    // Combine refs
    const combinedRef = React.useCallback((node: HTMLTextAreaElement) => {
      keyboardScroll.ref.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    }, [ref, keyboardScroll.ref]);

    // Combine event handlers
    const handleFocus = React.useCallback((e: React.FocusEvent<HTMLTextAreaElement>) => {
      keyboardScroll.onFocus();
      onFocus?.(e);
    }, [keyboardScroll.onFocus, onFocus]);

    const handleBlur = React.useCallback((e: React.FocusEvent<HTMLTextAreaElement>) => {
      keyboardScroll.onBlur();
      onBlur?.(e);
    }, [keyboardScroll.onBlur, onBlur]);

    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
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
Textarea.displayName = "Textarea"

export { Textarea }
