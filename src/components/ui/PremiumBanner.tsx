import React from 'react';
import { Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PremiumBannerProps {
  onClick: () => void;
}

const PremiumBanner: React.FC<PremiumBannerProps> = ({ onClick }) => {
  return (
    <Button
      variant="outline"
      className="w-full h-auto py-4 px-4 border-2 border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 transition-all"
      onClick={onClick}
    >
      <div className="flex items-center justify-center gap-3 w-full">
        <Crown className="h-5 w-5 text-primary flex-shrink-0" />
        <span className="text-sm font-medium text-foreground">
          Unlock full hand analysis with Premium
        </span>
      </div>
    </Button>
  );
};

export default PremiumBanner;
