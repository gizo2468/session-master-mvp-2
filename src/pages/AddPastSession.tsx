import React from 'react';
import { useNavigate } from 'react-router-dom';
import PastSessionForm from '@/components/poker/PastSessionForm';

export default function AddPastSession() {
  const navigate = useNavigate();

  const handleClose = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PastSessionForm onClose={handleClose} />
    </div>
  );
}
