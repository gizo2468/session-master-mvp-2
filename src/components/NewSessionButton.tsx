
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/LanguageContext';
import Icon from '@/components/ui/Lucide';

const NewSessionButton = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <Button 
      onClick={() => navigate('/new-session')}
      className="bg-gradient-to-r from-poker-green to-poker-feltGreen hover:from-poker-feltGreen hover:to-poker-green text-white shadow-lg hover:shadow-xl transition-all duration-300 px-12 py-6 rounded-full"
      size="lg"
    >
      <Icon name="Plus" className="mr-2 h-5 w-5" />
      {t('new_session')}
    </Button>
  );
};

export default NewSessionButton;
