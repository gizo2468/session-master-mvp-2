import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SELECTABLE_COLORS } from './playerColors';
import { useColorLabels } from '@/hooks/useColorLabels';
import { toast } from 'sonner';

interface EditColorCategoriesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EditColorCategoriesModal: React.FC<EditColorCategoriesModalProps> = ({
  open,
  onOpenChange,
}) => {
  const { customLabels, updateLabel, isUpdating } = useColorLabels();
  const [labels, setLabels] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Initialize labels when modal opens
  useEffect(() => {
    if (open) {
      const initialLabels: Record<string, string> = {};
      SELECTABLE_COLORS.forEach(color => {
        const customLabel = customLabels.find(l => l.color_id === color.id);
        initialLabels[color.id] = customLabel?.custom_label || '';
      });
      setLabels(initialLabels);
    }
  }, [open, customLabels]);

  const handleLabelChange = (colorId: string, value: string) => {
    setLabels(prev => ({
      ...prev,
      [colorId]: value,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save all non-empty labels
      const savePromises = SELECTABLE_COLORS.map(color => {
        const label = labels[color.id]?.trim();
        if (label) {
          return new Promise<void>((resolve, reject) => {
            updateLabel(
              { colorId: color.id, label },
              {
                onSuccess: () => resolve(),
                onError: (error) => reject(error),
              }
            );
          });
        }
        return Promise.resolve();
      });

      await Promise.all(savePromises);
      toast.success('Color categories saved');
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving labels:', error);
      toast.error('Failed to save color categories');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Color Categories</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3 py-4 max-h-[60vh] overflow-y-auto">
          {SELECTABLE_COLORS.map((color) => (
            <div key={color.id} className="flex items-center gap-3">
              {/* Color square */}
              <div
                className="w-8 h-8 rounded-md flex-shrink-0"
                style={{
                  backgroundColor: color.hex,
                  border: color.border ? `1px solid ${color.border}` : undefined,
                }}
              />
              
              {/* Label input */}
              <Input
                value={labels[color.id] || ''}
                onChange={(e) => handleLabelChange(color.id, e.target.value)}
                placeholder={color.label}
                className="flex-1"
                autoComplete="off"
                data-form-type="other"
              />
              
              {/* Default label hint */}
              <span className="text-xs text-muted-foreground w-20 text-right">
                {color.label}
              </span>
            </div>
          ))}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving || isUpdating}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditColorCategoriesModal;
