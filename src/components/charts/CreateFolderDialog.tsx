import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateFolder } from '@/hooks/useChartsLibrary';
import { toast } from 'sonner';

interface CreateFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateFolderDialog: React.FC<CreateFolderDialogProps> = ({ open, onOpenChange }) => {
  const [name, setName] = useState('');
  const createFolder = useCreateFolder();

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('Please enter a folder name');
      return;
    }

    try {
      await createFolder.mutateAsync(name.trim());
      onOpenChange(false);
      setName('');
    } catch {
      toast.error('Failed to create folder');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[340px]">
        <DialogHeader>
          <DialogTitle>New Folder</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-2">
            <Label>Folder Name</Label>
            <Input
              placeholder="e.g. Cash Games, Tournaments, 100bb"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={createFolder.isPending}>
            {createFolder.isPending ? 'Creating...' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateFolderDialog;
