
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SessionView } from '@/components/session/SessionView';

const CoachSessionReview = () => {
  const navigate = useNavigate();
  const { studentId, sessionId } = useParams<{ studentId: string; sessionId: string }>();

  const handleBack = () => {
    navigate(`/coach/student/${studentId}`);
  };

  if (!sessionId || !studentId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Invalid Session</h2>
          <p className="text-gray-600">Session or student ID not found.</p>
        </div>
      </div>
    );
  }

  return (
    <SessionView
      sessionId={sessionId}
      studentId={studentId}
      onBack={handleBack}
      mode="coach"
    />
  );
};

export default CoachSessionReview;
