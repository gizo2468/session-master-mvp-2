import React from 'react';
import { useNavigate } from 'react-router-dom';
import PastSessionForm from '@/components/poker/PastSessionForm';
import { useSwipeBack } from '@/hooks/useSwipeBack';

export default function AddPastSession() {
  const navigate = useNavigate();
  const swipeBackRef = useSwipeBack({ fallbackPath: '/', screenName: 'AddPastSession' });

  const handleClose = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/', { replace: true });
    }
  };

  return (
    <div ref={swipeBackRef} className="min-h-screen bg-gray-50 overflow-x-hidden content-safe">
      <PastSessionForm onClose={handleClose} />
    </div>
  );
}
