import React from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useNavigateWithRefresh } from '@/hooks/useNavigateWithRefresh';
import Icon from '@/components/ui/Lucide';

interface SessionDetailHeaderProps {
  location: string;
  onEditClick: () => void;
  onDeleteClick: () => void;
}

const SessionDetailHeader: React.FC<SessionDetailHeaderProps> = ({
  location,
  onEditClick,
  onDeleteClick
}) => {
  const { navigateToHomeWithRefresh, isRefreshing } = useNavigateWithRefresh();

  return (
    <header className="mb-8">
      <Button 
        onClick={navigateToHomeWithRefresh}
        variant="ghost" 
        className="text-poker-feltGreen mb-4 flex items-center p-0 hover:bg-transparent"
        disabled={isRefreshing}
      >
        <Icon name={isRefreshing ? "Loader2" : "ArrowLeft"} size={16} className={`mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
        Back
      </Button>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-serif font-bold">
            Session Summary
          </h1>
          <div className="flex items-center space-x-2">
            <Switch id="share-coach" />
            <Label htmlFor="share-coach" className="text-sm">Share with Coach</Label>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={onEditClick}
            variant="outline"
            size="icon"
            className="h-8 w-8"
          >
            <Icon name="Pencil" size={16} />
          </Button>
          <Button 
            onClick={onDeleteClick}
            variant="outline"
            size="icon"
            className="h-8 w-8 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            <Icon name="Trash2" size={16} />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default SessionDetailHeader;