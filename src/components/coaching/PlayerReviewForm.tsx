import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/Lucide';

interface PlayerReviewFormProps {
  coachId: string;
  coachName: string;
}

const PlayerReviewForm: React.FC<PlayerReviewFormProps> = ({ coachId, coachName }) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-center">
          <Icon name="MessageSquare" className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-muted-foreground mb-4">
            Review system coming soon
          </p>
          <Button variant="outline" disabled>
            <Icon name="MessageSquare" size={16} className="mr-2" />
            Leave Review (Coming Soon)
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlayerReviewForm;