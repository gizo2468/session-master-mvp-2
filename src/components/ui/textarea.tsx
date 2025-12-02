
import * as React from "react"
import { cn } from "@/lib/utils"
import { useFocusScroll } from "@/hooks/useFocusScroll"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps & { enableAutofill?: boolean }>(
  ({ className, onFocus, onBlur, enableAutofill = false, autoComplete, autoCorrect, autoCapitalize, spellCheck, name, id, ...props }, ref) => {
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
        // Maximum autofill blocking - disabled by default across the app
        autoComplete={enableAutofill ? autoComplete : 'off'}
        autoCorrect={enableAutofill ? (autoCorrect as any) : 'off'}
        autoCapitalize={enableAutofill ? (autoCapitalize as any) : 'none'}
        spellCheck={enableAutofill ? (spellCheck as any) : false}
        aria-autocomplete={enableAutofill ? undefined : 'none'}
        inputMode={props.inputMode ?? 'text'}
        data-1p-ignore={enableAutofill ? undefined : true}
        data-lpignore={enableAutofill ? undefined : true}
        data-bwignore={enableAutofill ? undefined : true}
        data-protonpass-ignore={enableAutofill ? undefined : true}
        data-form-type={enableAutofill ? undefined : 'other'}
        data-credential={enableAutofill ? undefined : 'false'}
        x-autocompletetype={enableAutofill ? undefined : 'off' as any}
        data-autocompletetype={enableAutofill ? undefined : 'off'}
        role={enableAutofill ? undefined : 'textbox'}
        // Ensure we use random/meaningless names for autofill blocking
        name={enableAutofill ? name : (name ? `field_${Math.random().toString(36).substr(2, 9)}` : undefined)}
        id={enableAutofill ? id : (id ? `input_${Math.random().toString(36).substr(2, 9)}` : undefined)}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
