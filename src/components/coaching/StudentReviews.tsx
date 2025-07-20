import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/Lucide';

interface StudentReviewsProps {
  studentId: string;
}

export const StudentReviews: React.FC<StudentReviewsProps> = ({ studentId }) => {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Icon name="Archive" />
            <span>Review Archive</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <Icon name="MessageSquare" className="mx-auto h-8 w-8 mb-2" />
            <p>Review system coming soon</p>
            <p className="text-sm mt-2">Coach reviews will appear here when the feature is ready.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};