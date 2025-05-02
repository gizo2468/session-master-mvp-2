
import React from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/Lucide';
import { useNavigate, useLocation } from 'react-router-dom';

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
        variant="default" 
        onClick={handleUpgradeClick}
        className="bg-poker-gold hover:bg-poker-darkGold ml-2 relative"
        size="sm"
      >
        <Icon name="package-plus" size={16} className="mr-1" />
        <span>Change Plan</span>
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-poker-gold border-2 border-white rounded-full flex items-center justify-center">
          <Icon name="dollar-sign" size={10} className="text-white" />
        </div>
      </Button>
    );
  }
  
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-md backdrop-blur-sm z-10">
      <div className="text-center p-6 max-w-xs">
        <div className="mb-4 text-white">
          <Icon name="lock" size={36} className="mx-auto mb-3" />
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
