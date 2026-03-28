import React from 'react';
import { Button } from '@/components/ui/button';
import { usePremiumAccess } from '@/hooks/usePremiumAccess';

interface AIHandAnalyzerBannerProps {
  onClick: () => void;
}

const AIHandAnalyzerBanner: React.FC<AIHandAnalyzerBannerProps> = ({ onClick }) => {
  const { isPremium } = usePremiumAccess();

  if (!isPremium) return null;

  return (
    <div className="mb-4">
      <Button
        type="button"
        variant="outline"
        onClick={onClick}
        className="w-full h-14 bg-gradient-to-r from-poker-gold/10 to-poker-gold/5 border-2 border-poker-gold/30 hover:bg-poker-gold/20 hover:border-poker-gold/50 transition-all shadow-sm dark:shadow-black/20 hover:shadow-md dark:shadow-black/30"
      >
        <span className="text-sm font-semibold text-poker-gold">
          Add Your Hand with AI
        </span>
      </Button>
    </div>
  );
};

export default AIHandAnalyzerBanner;
