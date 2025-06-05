
import * as React from "react"
import { cn } from "@/lib/utils"
import { useFocusScroll } from "@/hooks/useFocusScroll"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, onFocus, onBlur, ...props }, ref) => {
    const { handleFocus, handleBlur } = useFocusScroll();

    const handleTextareaFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      handleFocus(e.target);
      onFocus?.(e);
    };

    const handleTextareaBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      handleBlur();
      onBlur?.(e);
    };

    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:shadow-lg focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
          className
        )}
        onFocus={handleTextareaFocus}
        onBlur={handleTextareaBlur}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
