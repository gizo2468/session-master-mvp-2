import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Crown, Lock } from 'lucide-react';
import { usePremiumAccess } from '@/hooks/usePremiumAccess';

interface PremiumFeatureGateProps {
  children: React.ReactNode;
  featureName: string;
  description?: string;
  className?: string;
}

const PremiumFeatureGate: React.FC<PremiumFeatureGateProps> = ({
  children,
  featureName,
  description,
  className = ''
}) => {
  const navigate = useNavigate();
  const { isPremium } = usePremiumAccess();

  if (isPremium) {
    return <>{children}</>;
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Blurred content */}
      <div className="filter blur-sm pointer-events-none select-none">
        {children}
      </div>
      
      {/* Premium overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
        <Card className="w-full max-w-sm mx-4">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-2">
              <div className="p-3 bg-primary/10 rounded-full">
                <Crown className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-lg">Premium Feature</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div>
              <p className="font-medium text-foreground mb-1">{featureName}</p>
              {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Button 
                onClick={() => {
                  navigate('/subscription');
                  window.scrollTo(0, 0);
                }}
                className="w-full"
                size="sm"
              >
                <Crown className="h-4 w-4 mr-2" />
                Upgrade to Premium
              </Button>
              <p className="text-xs text-muted-foreground">
                Unlock this feature and more with Premium
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PremiumFeatureGate;