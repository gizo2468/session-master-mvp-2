import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateCollection } from '@/hooks/useChartsLibrary';
import { toast } from 'sonner';

interface CreateCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (id: string) => void;
  folderId?: string | null;
}

const CreateCollectionDialog: React.FC<CreateCollectionDialogProps> = ({ open, onOpenChange, onCreated, folderId }) => {
  const [name, setName] = useState('');
  const [stackDepth, setStackDepth] = useState('100');
  const [gameType, setGameType] = useState('NLH');
  const createCollection = useCreateCollection();

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('Please enter a collection name');
      return;
    }
    const depth = parseInt(stackDepth);
    if (isNaN(depth) || depth < 1) {
      toast.error('Please enter a valid stack depth');
      return;
    }

    try {
      const result = await createCollection.mutateAsync({
        name: name.trim(),
        stack_depth_bb: depth,
        game_type: gameType,
        folder_id: folderId || null,
      });
      toast.success('Collection created');
      onCreated?.(result.id);
      onOpenChange(false);
      setName('');
      setStackDepth('100');
      setGameType('NLH');
    } catch {
      toast.error('Failed to create collection');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[380px]">
        <DialogHeader>
          <DialogTitle>New Collection</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              placeholder="e.g. 50bb Turbo"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Stack Depth (bb)</Label>
            <Input
              type="number"
              min={1}
              value={stackDepth}
              onChange={(e) => setStackDepth(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Game Type</Label>
            <Select value={gameType} onValueChange={setGameType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NLH">NLH</SelectItem>
                <SelectItem value="PLO">PLO</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={createCollection.isPending}>
            {createCollection.isPending ? 'Creating...' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCollectionDialog;
