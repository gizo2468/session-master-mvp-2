
import React from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/Lucide';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface FeatureLockOverlayProps {
  featureName: string;
  isUpgradeButton?: boolean;
}

const FeatureLockOverlay: React.FC<FeatureLockOverlayProps> = ({ 
  featureName, 
  isUpgradeButton = false 
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const handleUpgradeClick = () => {
    // Store current location before navigating
    localStorage.setItem('previousLocation', location.pathname);
    navigate('/coach-upgrade');
  };
  
  if (isUpgradeButton) {
    return (
      <Button 
        variant="ghost"
        onClick={handleUpgradeClick}
        className={cn(
          "bg-gray-200 hover:bg-gray-300 border border-gray-300 opacity-90 ml-2 relative",
          "flex items-center gap-1.5 h-9 px-3"
        )}
        size="sm"
      >
        <div className="relative">
          <Icon name="package-plus" size={16} />
          <Icon 
            name="dollar-sign" 
            size={10} 
            className="absolute -top-1 -right-1 text-poker-gold bg-white rounded-full p-0.5 border border-poker-gold"
          />
        </div>
        <span className="text-gray-700">Change Plan</span>
      </Button>
    );
  }
  
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-md backdrop-blur-sm z-10">
      <div className="text-center p-6 max-w-xs">
        <div className="mb-4 text-white">
          <div className="relative inline-block mx-auto mb-3">
            <Icon name="lock" size={36} className="mx-auto" />
            <Icon 
              name="dollar-sign" 
              size={16} 
              className="absolute -top-2 -right-2 text-poker-gold bg-white/20 rounded-full p-1 border border-poker-gold"
            />
          </div>
          <h3 className="text-xl font-bold">{featureName} Locked</h3>
          <p className="text-sm opacity-90 mt-2">
            Upgrade your coach tier to access this feature and unlock all coaching tools
          </p>
        </div>
        <Button 
          variant="default" 
          onClick={handleUpgradeClick}
          className="mt-3 bg-poker-gold hover:bg-poker-darkGold"
        >
          <Icon name="dollar-sign" size={16} className="mr-2" />
          <span>Upgrade Now</span>
        </Button>
      </div>
    </div>
  );
};

export default FeatureLockOverlay;
