
import * as React from "react"
import { cn } from "@/lib/utils"
import { useFocusScroll } from "@/hooks/useFocusScroll"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input"> & { enableAutofill?: boolean }>(
  ({ className, type, onFocus, onBlur, enableAutofill = false, autoComplete, autoCorrect, autoCapitalize, spellCheck, ...props }, ref) => {
    const { handleFocus, handleBlur } = useFocusScroll();

    const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      handleFocus(e.target);
      onFocus?.(e);
    };

    const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      handleBlur();
      onBlur?.(e);
    };

    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:shadow-lg focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition-all duration-200",
          className
        )}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        ref={ref}
        // Autofill control: disabled by default across the app
        autoComplete={enableAutofill ? autoComplete : 'off'}
        autoCorrect={enableAutofill ? (autoCorrect as any) : 'off'}
        autoCapitalize={enableAutofill ? (autoCapitalize as any) : 'none'}
        spellCheck={enableAutofill ? (spellCheck as any) : false}
        aria-autocomplete={enableAutofill ? undefined : 'none'}
        inputMode={props.inputMode ?? (type === 'number' ? 'decimal' : type === 'email' ? 'email' : type === 'tel' ? 'tel' : 'text')}
        data-1p-ignore={enableAutofill ? undefined : true}
        data-lpignore={enableAutofill ? undefined : true}
        data-form-type={enableAutofill ? undefined : 'other'}
        x-autocompletetype={enableAutofill ? undefined : 'off' as any}
        data-autocompletetype={enableAutofill ? undefined : 'off'}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
