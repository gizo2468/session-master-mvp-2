
import React from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/Lucide';
import { useNavigate } from 'react-router-dom';

interface FeatureLockOverlayProps {
  featureName: string;
}

const FeatureLockOverlay: React.FC<FeatureLockOverlayProps> = ({ featureName }) => {
  const navigate = useNavigate();
  
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
          onClick={() => navigate('/coach-upgrade')}
          className="mt-3 bg-poker-gold hover:bg-poker-darkGold"
        >
          <Icon name="package-plus" size={16} className="mr-2" />
          Upgrade Now
        </Button>
      </div>
    </div>
  );
};

export default FeatureLockOverlay;
