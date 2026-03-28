import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Award } from 'lucide-react';
import type { Achievement } from '@/hooks/usePlayerCard';

interface AddAchievementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (achievement: Achievement) => void;
}

const EMOJI_OPTIONS = ['🏆', '🥇', '🥈', '🥉', '⭐', '🎯', '💰', '🃏', '♠️', '♦️', '♥️', '♣️'];

export function AddAchievementModal({ open, onOpenChange, onAdd }: AddAchievementModalProps) {
  const [title, setTitle] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🏆');

  const handleSubmit = () => {
    if (!title.trim()) return;
    
    onAdd({
      id: crypto.randomUUID(),
      title: title.trim(),
      icon: selectedEmoji
    });
    
    // Reset form
    setTitle('');
    setSelectedEmoji('🏆');
    onOpenChange(false);
  };

  const handleCancel = () => {
    setTitle('');
    setSelectedEmoji('🏆');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-poker-gold/40 text-white max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-poker-gold">
            <Award className="w-5 h-5" />
            Add Achievement
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">
              Achievement Title
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., WSOP Circuit Winner"
              className="bg-zinc-800 border-poker-gold/40 text-white"
              maxLength={50}
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">
              Icon
            </label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setSelectedEmoji(emoji)}
                  className={`w-10 h-10 rounded-lg text-lg flex items-center justify-center transition-all ${
                    selectedEmoji === emoji
                      ? 'bg-poker-gold/20 border-2 border-poker-gold'
                      : 'bg-zinc-800 border border-zinc-700 hover:border-poker-gold/50'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-zinc-800/50 rounded-lg p-3">
            <p className="text-xs text-zinc-500 mb-1">Preview</p>
            <div className="inline-flex items-center gap-1.5 bg-zinc-700 text-poker-gold border border-poker-gold/20 rounded-md px-2 py-1 text-sm">
              {selectedEmoji} {title || 'Your achievement'}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="ghost"
            onClick={handleCancel}
            className="text-zinc-400 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="bg-poker-gold text-black dark:text-foreground hover:bg-poker-darkGold"
          >
            Add Achievement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
