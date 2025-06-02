
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SessionView } from '@/components/session/SessionView';

export default function SessionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/');
  };

  if (!id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Session Not Found</h2>
          <p className="text-gray-600">Invalid session ID.</p>
          <button
            onClick={handleBack}
            className="mt-4 py-2 px-4 bg-poker-gold hover:bg-poker-darkGold text-white font-bold rounded-md"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <SessionView
      sessionId={id}
      onBack={handleBack}
      mode="student"
    />
  );
}
