
import React, { useRef, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()
  const shownToastsRef = useRef<Set<string>>(new Set());

  // Enforce auto-dismiss for all toasts, even if their onOpenChange fails
  useEffect(() => {
    toasts.forEach(toast => {
      if (toast.open) {
        const timer = setTimeout(() => {
          if (toast.onOpenChange) {
            toast.onOpenChange(false);
          }
        }, toast.duration || 2000);
        
        return () => clearTimeout(timer);
      }
    });
  }, [toasts]);

  // Filter out duplicate toasts in a short time window
  const filteredToasts = toasts.filter(toast => {
    // For toasts without ID, we need to show them
    if (!toast.id) return true;
    
    // Check if this is a duplicate toast we've seen recently
    if (shownToastsRef.current.has(toast.id + toast.title)) {
      return false;
    }
    
    // Add this toast to our tracking set
    shownToastsRef.current.add(toast.id + toast.title);
    
    // Clean up the tracking set after the toast duration + a small buffer
    setTimeout(() => {
      shownToastsRef.current.delete(toast.id + toast.title);
    }, (toast.duration || 2000) + 500);
    
    return true;
  });

  return (
    <ToastProvider>
      {filteredToasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
