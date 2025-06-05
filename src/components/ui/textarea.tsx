
import * as React from "react"
import { cn } from "@/lib/utils"
import { useKeyboardAwareScroll } from "@/hooks/useKeyboardAwareScroll"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, onFocus, onBlur, ...props }, ref) => {
    const internalRef = React.useRef<HTMLTextAreaElement>(null);
    const textareaRef = (ref as React.RefObject<HTMLTextAreaElement>) || internalRef;
    const { handleFocus, handleBlur: handleKeyboardBlur } = useKeyboardAwareScroll();

    const handleTextareaFocus = React.useCallback((event: React.FocusEvent<HTMLTextAreaElement>) => {
      if (textareaRef.current) {
        handleFocus(textareaRef.current);
      }
      onFocus?.(event);
    }, [handleFocus, onFocus, textareaRef]);

    const handleTextareaBlur = React.useCallback((event: React.FocusEvent<HTMLTextAreaElement>) => {
      handleKeyboardBlur();
      onBlur?.(event);
    }, [handleKeyboardBlur, onBlur]);

    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={textareaRef}
        onFocus={handleTextareaFocus}
        onBlur={handleTextareaBlur}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
