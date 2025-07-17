import React from 'react';
import Logo from '@/components/Logo';
import Icon from '@/components/ui/Lucide';

const LoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <Logo />
        </div>
        
        <div className="flex justify-center">
          <Icon 
            name="Loader2" 
            size={32} 
            className="animate-spin text-primary" 
          />
        </div>
        
        <p className="text-muted-foreground text-sm">
          Loading Session Master...
        </p>
      </div>
    </div>
  );
};

export default LoadingScreen;