
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/Lucide';

const LiveSessionHeader: React.FC = () => {
  const navigate = useNavigate();

  return (
    <header className="bg-white shadow-sm px-4 py-4 sticky top-0 z-10">
      <div className="container mx-auto max-w-md">
        <div className="flex justify-between items-center">
          <Button 
            onClick={() => navigate('/')}
            variant="ghost"
            className="text-poker-feltGreen p-0"
          >
            <Icon name="ArrowLeft" size={16} className="mr-1" />
            <span>Home</span>
          </Button>
          <h1 className="text-xl font-bold">Live Session</h1>
          <div className="w-10"></div>
        </div>
      </div>
    </header>
  );
};

export default LiveSessionHeader;
