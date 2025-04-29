
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
      <div className="text-center p-4">
        <div className="mb-3 text-white">
          <Icon name="Lock" size={32} className="mx-auto mb-2" />
          <h3 className="text-lg font-bold">{featureName} Locked</h3>
          <p className="text-sm opacity-80">Upgrade your coach tier to access this feature</p>
        </div>
        <Button 
          variant="poker" 
          size="sm" 
          onClick={() => navigate('/coach-upgrade')}
          className="mt-2"
        >
          Upgrade Now
        </Button>
      </div>
    </div>
  );
};

export default FeatureLockOverlay;
