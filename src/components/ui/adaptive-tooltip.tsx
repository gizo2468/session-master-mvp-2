
import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

interface AdaptiveTooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const AdaptiveTooltip: React.FC<AdaptiveTooltipProps> = ({
  content,
  children,
  className,
}) => {
  const isMobile = useIsMobile();
  const [showTooltip, setShowTooltip] = useState(false);
  const [showMobileDialog, setShowMobileDialog] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        setShowTooltip(false);
      }
    };

    if (showTooltip) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showTooltip]);

  // For desktop: use positioned tooltip that opens on click
  if (!isMobile) {
    return (
      <div className="relative inline-block">
        <div 
          ref={triggerRef}
          onClick={() => setShowTooltip(!showTooltip)}
          className={`cursor-pointer ${className || ''}`}
        >
          {children}
        </div>
        
        {showTooltip && (
          <div
            ref={tooltipRef}
            className="absolute z-50 top-full left-1/2 transform -translate-x-1/2 mt-2 p-3 bg-white border border-gray-200 rounded-lg shadow-lg max-w-xs"
            style={{ minWidth: '250px' }}
          >
            <div className="text-sm text-gray-900">
              {content}
            </div>
            {/* Arrow pointing up */}
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white border-l border-t border-gray-200 rotate-45"></div>
          </div>
        )}
      </div>
    );
  }

  // For mobile: use dialog/modal when tapped
  return (
    <>
      <div 
        onClick={() => setShowMobileDialog(true)}
        className={`cursor-pointer ${className || ''}`}
      >
        {children}
      </div>

      <Dialog open={showMobileDialog} onOpenChange={setShowMobileDialog}>
        <DialogContent className="max-w-[90vw] p-4 bg-white rounded-lg border border-gray-200 shadow-lg">
          <div className="relative">
            <Button 
              variant="ghost" 
              size="sm" 
              className="absolute right-0 top-0 h-6 w-6 p-0 rounded-full"
              onClick={() => setShowMobileDialog(false)}
            >
              <X className="h-4 w-4" />
            </Button>
            
            <div className="pr-6 pt-1 pb-1 text-sm">
              {content}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
