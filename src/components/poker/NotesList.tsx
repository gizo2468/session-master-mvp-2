
import React from 'react';
import { Card } from '@/components/ui/card'; 
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/Lucide';

interface NotesListProps {
  notes: string | undefined;
  onEditNotes: () => void;
}

const NotesList: React.FC<NotesListProps> = ({ notes, onEditNotes }) => {
  const { t } = useLanguage();

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-extrabold text-xl tracking-tight">{t('notes')}</h2>
        <Button variant="ghost" size="sm" onClick={onEditNotes}>
          <Icon name="Edit" size={14} className="mr-1" /> {t('edit')}
        </Button>
      </div>
      
      {notes ? (
        <Card className="bg-white p-4 rounded-lg shadow">
          <p className="whitespace-pre-wrap">{notes}</p>
        </Card>
      ) : (
        <Card className="bg-white p-4 rounded-lg shadow text-center text-gray-500">
          <p>{t('no_notes')}</p>
          <Button 
            variant="ghost" 
            className="mt-2 text-poker-feltGreen"
            onClick={onEditNotes}
          >
            {t('add_notes')}
          </Button>
        </Card>
      )}
    </div>
  );
};

export default NotesList;
