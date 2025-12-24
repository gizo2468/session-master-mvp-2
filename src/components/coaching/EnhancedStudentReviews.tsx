import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface EnhancedStudentReviewsProps {
  studentId: string;
}

export const EnhancedStudentReviews: React.FC<EnhancedStudentReviewsProps> = ({ studentId }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Student Reviews</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Coaching features are currently being set up. This section will be available soon.
        </p>
      </CardContent>
    </Card>
  );
};

export default EnhancedStudentReviews;