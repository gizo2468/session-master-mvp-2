
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useSessionContext } from '@/context/SessionContext';
import { useLanguage } from '@/context/LanguageContext';
import TableDetailsCard from '@/components/poker/TableDetailsCard';
import SessionStatsCard from '@/components/poker/SessionStatsCard';
import HandsList from '@/components/poker/HandsList';
import NotesList from '@/components/poker/NotesList';
import Icon from '@/components/ui/Lucide';
import { PokerSession, HandData } from '@/types/poker';

const SessionDetail = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { toast } = useToast();
  const { sessions, updateSession, deleteSession } = useSessionContext();
  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showNotesDialog, setShowNotesDialog] = useState(false);
  const [notes, setNotes] = useState('');
  
  // Find the session based on ID
  const session = sessions.find((s) => s.id === sessionId);
  
  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{t('session_not_found')}</h1>
          <Button onClick={() => navigate('/')}>{t('back_to_home')}</Button>
        </div>
      </div>
    );
  }
  
  const handleDeleteSession = () => {
    deleteSession(session.id);
    toast({
      title: t('session_deleted'),
      description: t('session_deleted_desc')
    });
    navigate('/');
  };
  
  const handleUpdateNotes = () => {
    updateSession({
      ...session,
      notes
    });
    setShowNotesDialog(false);
    toast({
      title: t('success'),
      description: t('notes_updated')
    });
  };
  
  const openNotesDialog = () => {
    setNotes(session.notes || '');
    setShowNotesDialog(true);
  };
  
  const handleEditHand = (hand: HandData) => {
    // This is a placeholder function, implement if needed
    console.log("Edit hand:", hand);
  };
  
  const handleDeleteHand = (handId: string) => {
    // This is a placeholder function, implement if needed
    console.log("Delete hand:", handId);
  };
  
  // Format the date string
  const formattedDate = format(new Date(session.startTime), 'PPP');
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-md px-4 py-8">
        <header className="mb-8">
          <button 
            onClick={() => navigate(-1)} 
            className="text-poker-feltGreen mb-4 flex items-center"
          >
            <Icon name="ArrowLeft" size={16} className="mr-1 icon-flip-rtl" />
            <span>{t('back')}</span>
          </button>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">{session.location}</h1>
              <p className="text-gray-500">{formattedDate}</p>
              <div className="flex mt-1">
                <span className="text-sm bg-gray-100 px-2 py-0.5 rounded mr-2 rtl-fix-padding">
                  {session.gameType}
                </span>
                <span className="text-sm bg-gray-100 px-2 py-0.5 rounded rtl-fix-padding">
                  {session.format}
                </span>
              </div>
            </div>
            
            <div className="flex space-x-2 rtl-component-fix">
              <Button
                size="sm"
                variant="outline"
                onClick={openNotesDialog}
                className="flex items-center"
              >
                <Icon name="Edit" size={14} className="mr-1" /> {t('edit')}
              </Button>
              
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
                className="flex items-center"
              >
                <Icon name="Trash2" size={14} className="mr-1" /> {t('delete')}
              </Button>
            </div>
          </div>
        </header>
        
        {session.tables && session.tables.length > 0 ? (
          session.tables.map((table) => (
            <TableDetailsCard key={table.id} table={table} />
          ))
        ) : (
          <SessionStatsCard session={session} />
        )}
        
        {session.hands && session.hands.length > 0 && (
          <div className="mb-8">
            <h2 className="font-extrabold text-xl tracking-tight mb-4">{t('hands')}</h2>
            <HandsList 
              hands={session.hands} 
              onEditHand={handleEditHand} 
              onDeleteHand={handleDeleteHand} 
            />
          </div>
        )}
        
        <NotesList notes={session.notes} onEditNotes={openNotesDialog} />
        
        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('confirm_delete')}</DialogTitle>
              <DialogDescription>
                {t('delete_session_warning')}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                {t('cancel')}
              </Button>
              <Button variant="destructive" onClick={handleDeleteSession}>
                {t('delete')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Notes Dialog */}
        <Dialog open={showNotesDialog} onOpenChange={setShowNotesDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('edit_session_notes')}</DialogTitle>
            </DialogHeader>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[200px]"
              placeholder={t('session_notes_placeholder')}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNotesDialog(false)}>
                {t('cancel')}
              </Button>
              <Button onClick={handleUpdateNotes}>
                {t('save')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default SessionDetail;
