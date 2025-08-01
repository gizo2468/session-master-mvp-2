
import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
  const [showMobileDialog, setShowMobileDialog] = useState(false);

  // For desktop: use regular tooltip
  if (!isMobile) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`cursor-help ${className || ''}`}>
              {children}
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            {content}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
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
        <DialogContent className="max-w-[90vw] p-4 bg-white rounded-lg border border-gray-200">
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
