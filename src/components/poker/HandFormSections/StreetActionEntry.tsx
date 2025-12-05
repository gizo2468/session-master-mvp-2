import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export interface StreetAction {
  id: string;
  actor: 'Hero' | 'Villain';
  action: 'Check' | 'Bet' | 'Call' | 'Raise' | 'Fold' | 'All-in' | 'Other';
  size?: number;
  unit: 'BB' | 'Chips';
  customDescription?: string;
}

interface StreetActionEntryProps {
  actions: any[];
  onChange: (actions: StreetAction[]) => void;
}

const actionOptions = ['Check', 'Bet', 'Call', 'Raise', 'Fold', 'All-in', 'Other'] as const;
const actionsWithSize = ['Bet', 'Call', 'Raise', 'All-in'];

// Helper to validate if an action object is complete
const isValidAction = (action: any): action is StreetAction => {
  return action && 
    typeof action.id === 'string' && 
    typeof action.actor === 'string' && 
    typeof action.action === 'string' &&
    typeof action.unit === 'string';
};

const StreetActionEntry: React.FC<StreetActionEntryProps> = ({ actions, onChange }) => {
  // Filter to only valid actions
  const validActions = (actions || []).filter(isValidAction);
  
  const [isAdding, setIsAdding] = useState(false);
  const [newAction, setNewAction] = useState<Partial<StreetAction>>({
    actor: 'Hero',
    action: 'Bet',
    unit: 'BB',
  });

  const handleAdd = () => {
    if (!newAction.actor || !newAction.action) return;
    
    const action: StreetAction = {
      id: uuidv4(),
      actor: newAction.actor as 'Hero' | 'Villain',
      action: newAction.action as StreetAction['action'],
      size: newAction.size,
      unit: newAction.unit || 'BB',
      customDescription: newAction.action === 'Other' ? newAction.customDescription : undefined,
    };
    
    onChange([...validActions, action]);
    setNewAction({ actor: 'Hero', action: 'Bet', unit: 'BB' });
    setIsAdding(false);
  };

  const handleDelete = (id: string) => {
    onChange(validActions.filter(a => a.id !== id));
  };

  const formatAction = (action: StreetAction): string => {
    if (action.action === 'Other') {
      return `${action.actor}: ${action.customDescription || 'Other'}`;
    }
    if (action.action === 'Check' || action.action === 'Fold') {
      return `${action.actor}: ${action.action}`;
    }
    if (action.size) {
      return `${action.actor}: ${action.action} ${action.size} ${action.unit}`;
    }
    return `${action.actor}: ${action.action}`;
  };

  const showSizeInput = newAction.action && actionsWithSize.includes(newAction.action);
  const showCustomInput = newAction.action === 'Other';

  return (
    <div className="space-y-2">
      {/* Action List */}
      {validActions.length > 0 && (
        <div className="space-y-1">
          {validActions.map((action, index) => (
            <div 
              key={action.id} 
              className="flex items-center justify-between bg-muted/50 rounded px-2 py-1.5 text-sm"
            >
              <span className="text-foreground">
                <span className="text-muted-foreground mr-1">{index + 1}.</span>
                {formatAction(action)}
              </span>
              <button
                type="button"
                onClick={() => handleDelete(action.id)}
                className="text-muted-foreground hover:text-destructive transition-colors p-1"
                aria-label="Delete action"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Action Form */}
      {isAdding ? (
        <div className="border border-border rounded-md p-3 space-y-2 bg-card">
          <div className="grid grid-cols-2 gap-2">
            {/* Actor */}
            <Select
              value={newAction.actor}
              onValueChange={(value) => setNewAction({ ...newAction, actor: value as 'Hero' | 'Villain' })}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Actor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Hero">Hero</SelectItem>
                <SelectItem value="Villain">Villain</SelectItem>
              </SelectContent>
            </Select>

            {/* Action */}
            <Select
              value={newAction.action}
              onValueChange={(value) => setNewAction({ ...newAction, action: value as StreetAction['action'] })}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                {actionOptions.map(opt => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Size & Unit (conditional) */}
          {showSizeInput && (
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder="Size"
                className="h-8 text-xs"
                value={newAction.size || ''}
                onChange={(e) => setNewAction({ ...newAction, size: e.target.value ? parseFloat(e.target.value) : undefined })}
                autoComplete="off"
                data-form-type="other"
              />
              <Select
                value={newAction.unit}
                onValueChange={(value) => setNewAction({ ...newAction, unit: value as 'BB' | 'Chips' })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BB">BB</SelectItem>
                  <SelectItem value="Chips">Chips</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Custom Description (for "Other") */}
          {showCustomInput && (
            <Input
              placeholder="Describe action..."
              className="h-8 text-xs"
              value={newAction.customDescription || ''}
              onChange={(e) => setNewAction({ ...newAction, customDescription: e.target.value })}
              autoComplete="off"
              data-form-type="other"
            />
          )}

          {/* Buttons */}
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handleAdd}
              className="flex-1 h-7 text-xs"
            >
              Add
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsAdding(false);
                setNewAction({ actor: 'Hero', action: 'Bet', unit: 'BB' });
              }}
              className="flex-1 h-7 text-xs"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsAdding(true)}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Action
        </Button>
      )}
    </div>
  );
};

export default StreetActionEntry;
