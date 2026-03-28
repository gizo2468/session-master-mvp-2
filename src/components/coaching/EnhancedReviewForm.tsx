
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HandSelectionList } from './HandSelectionList';
import { CommentTag } from '@/types/poker';
import Icon from '@/components/ui/Lucide';

interface EnhancedReviewFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (reviewData: {
    content: string;
    tag?: CommentTag;
    starRating?: number;
    reviewType: string;
    reviewCategory: string;
    selectedHandIds: string[];
  }) => void;
  sessionId: string;
  context: 'session' | 'hand';
}

export const EnhancedReviewForm = ({
  open,
  onOpenChange,
  onSubmit,
  sessionId,
  context
}: EnhancedReviewFormProps) => {
  const [content, setContent] = useState('');
  const [selectedTag, setSelectedTag] = useState<CommentTag | undefined>(undefined);
  const [starRating, setStarRating] = useState<number | undefined>(undefined);
  const [reviewType, setReviewType] = useState<string>('general');
  const [reviewCategory, setReviewCategory] = useState<string>('feedback');
  const [selectedHandIds, setSelectedHandIds] = useState<string[]>([]);
  
  const tags: { value: CommentTag; label: string; icon: React.ReactNode }[] = [
    { 
      value: 'common_mistake', 
      label: 'Common Mistake', 
      icon: <Icon name="AlertTriangle" size={14} /> 
    },
    { 
      value: 'aggressive_play', 
      label: 'Aggressive Play', 
      icon: <Icon name="Zap" size={14} /> 
    },
    { 
      value: 'good_decision', 
      label: 'Good Decision', 
      icon: <Icon name="ThumbsUp" size={14} /> 
    },
    { 
      value: 'needs_review', 
      label: 'Needs Review', 
      icon: <Icon name="Search" size={14} /> 
    }
  ];
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      onSubmit({
        content: content.trim(),
        tag: selectedTag,
        starRating,
        reviewType,
        reviewCategory,
        selectedHandIds
      });
      resetForm();
    }
  };

  const resetForm = () => {
    setContent('');
    setSelectedTag(undefined);
    setStarRating(undefined);
    setReviewType('general');
    setReviewCategory('feedback');
    setSelectedHandIds([]);
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

  const renderStarRating = () => {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium">Rating (optional)</label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setStarRating(starRating === star ? undefined : star)}
              className={`p-1 rounded ${
                starRating && star <= starRating
                  ? 'text-yellow-500'
                  : 'text-gray-300 hover:text-yellow-400'
              }`}
            >
              <Icon name="Star" size={20} fill={starRating && star <= starRating ? 'currentColor' : 'none'} />
            </button>
          ))}
          {starRating && (
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">
              {starRating} star{starRating !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Add Review {context === 'hand' ? 'to Hand' : 'to Session'}
          </DialogTitle>
          <DialogDescription>
            Provide detailed feedback to help your student improve their game.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Review Type</label>
              <Select value={reviewType} onValueChange={setReviewType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General Feedback</SelectItem>
                  <SelectItem value="strategy">Strategy Analysis</SelectItem>
                  <SelectItem value="technical">Technical Review</SelectItem>
                  <SelectItem value="mental_game">Mental Game</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <Select value={reviewCategory} onValueChange={setReviewCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="feedback">Feedback</SelectItem>
                  <SelectItem value="improvement">Improvement Area</SelectItem>
                  <SelectItem value="strength">Strength</SelectItem>
                  <SelectItem value="question">Question</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Provide your detailed feedback or advice..."
            className="min-h-[120px]"
            required
          />
          
          <div>
            <label className="text-sm font-medium mb-2 block">Tag your review (optional)</label>
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

          {renderStarRating()}

          {context === 'session' && (
            <HandSelectionList
              sessionId={sessionId}
              selectedHandIds={selectedHandIds}
              onSelectionChange={setSelectedHandIds}
            />
          )}
          
          <DialogFooter className="sm:justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!content.trim()}>
              Add Review
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
