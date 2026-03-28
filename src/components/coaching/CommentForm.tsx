import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CommentTag } from '@/types/poker';
import Icon from '@/components/ui/Lucide';

interface CommentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (content: string, tag: CommentTag | undefined) => void;
  context: 'session' | 'hand';
}

export const CommentForm = ({
  open,
  onOpenChange,
  onSubmit,
  context
}: CommentFormProps) => {
  const [content, setContent] = useState('');
  const [selectedTag, setSelectedTag] = useState<CommentTag | undefined>(undefined);
  
  const tags: { value: CommentTag; label: string; icon: React.ReactNode }[] = [
    { 
      value: 'common_mistake', 
      label: 'Common Mistake', 
      icon: <Icon name="alert-triangle" size={14} /> 
    },
    { 
      value: 'aggressive_play', 
      label: 'Aggressive Play', 
      icon: <Icon name="zap" size={14} /> 
    },
    { 
      value: 'good_decision', 
      label: 'Good Decision', 
      icon: <Icon name="thumbs-up" size={14} /> 
    },
    { 
      value: 'needs_review', 
      label: 'Needs Review', 
      icon: <Icon name="search" size={14} /> 
    }
  ];
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      onSubmit(content.trim(), selectedTag);
      setContent('');
      setSelectedTag(undefined);
    }
  };
  
  const getTagVariant = (tag: CommentTag) => {
    switch (tag) {
      case 'common_mistake':
        return 'destructive';
      case 'aggressive_play':
        return 'warning';
      case 'good_decision':
        return 'success';
      case 'needs_review':
        return 'info';
      default:
        return 'default';
    }
  };
  
  const getTagCustomClass = (tag: CommentTag, isSelected: boolean) => {
    const baseClass = "cursor-pointer px-3 py-1.5 flex items-center gap-1 text-sm";
    
    if (isSelected) {
      switch (tag) {
        case 'common_mistake':
          return `${baseClass} bg-red-100 text-red-700 border-red-300 hover:bg-red-200`;
        case 'aggressive_play':
          return `${baseClass} bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-200`;
        case 'good_decision':
          return `${baseClass} bg-green-100 text-green-700 border-green-300 hover:bg-green-200`;
        case 'needs_review':
          return `${baseClass} bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200`;
      }
    }
    
    return `${baseClass} bg-gray-50 dark:bg-background border border-gray-200 dark:border-border hover:bg-gray-100 dark:bg-muted`;
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Add Comment {context === 'hand' ? 'to Hand' : 'to Session'}
          </DialogTitle>
          <DialogDescription>
            Your student will receive this feedback and be able to mark it as read or implemented.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Provide your feedback or advice..."
            className="min-h-[100px]"
            required
          />
          
          <div>
            <label className="text-sm font-medium mb-2 block">Tag your comment (optional)</label>
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <div
                  key={tag.value}
                  onClick={() => setSelectedTag(selectedTag === tag.value ? undefined : tag.value)}
                  className={getTagCustomClass(tag.value, selectedTag === tag.value)}
                >
                  {tag.icon}
                  <span>{tag.label}</span>
                </div>
              ))}
            </div>
          </div>
          
          <DialogFooter className="sm:justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!content.trim()}>
              Add Comment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
