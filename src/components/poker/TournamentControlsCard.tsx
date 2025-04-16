
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/Lucide';

interface TournamentControlsCardProps {
  onAddRebuy: () => void;
}

const TournamentControlsCard: React.FC<TournamentControlsCardProps> = ({ 
  onAddRebuy
}) => {
  return (
    <Card className="bg-white rounded-lg shadow-md mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Tournament Controls</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-col gap-4">
          <Button
            onClick={onAddRebuy}
            variant="outline"
            className="w-full flex justify-center items-center gap-2"
          >
            <Icon name="Plus" size={16} /> Add Rebuy
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TournamentControlsCard;
