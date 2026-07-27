import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import MyNotesCard from '@/components/notes/MyNotesCard';

interface MyNotesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MyNotesModal: React.FC<MyNotesModalProps> = ({ open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto p-4">
        <DialogHeader>
          <DialogTitle className="sr-only">My Notes</DialogTitle>
        </DialogHeader>
        <MyNotesCard />
      </DialogContent>
    </Dialog>
  );
};

export default MyNotesModal;
