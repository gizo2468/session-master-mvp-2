import React, { useState, useRef } from 'react';
import { Camera, RotateCcw, Award, Pencil, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import type { PlayerCardData, PlayerProfile, PlayerPrivateData, Achievement } from '@/hooks/usePlayerCard';

interface PlayerCardFrontProps {
  cardData: PlayerCardData | null;
  profile: PlayerProfile | null;
  privateData: PlayerPrivateData | null;
  yearsOfExperience: number | null;
  onFlip: () => void;
  onUpdateCard: (updates: Partial<PlayerCardData>) => void;
  onUpdatePrivate: (updates: Partial<{ full_name: string }>) => void;
  onUploadPhoto: (file: File) => void;
  isSaving: boolean;
}

type EditingField = 'name' | 'specialization' | 'goals' | 'year' | 'achievements' | null;

export function PlayerCardFront({
  cardData,
  profile,
  privateData,
  yearsOfExperience,
  onFlip,
  onUpdateCard,
  onUpdatePrivate,
  onUploadPhoto,
  isSaving
}: PlayerCardFrontProps) {
  const [editingField, setEditingField] = useState<EditingField>(null);
  const [editValue, setEditValue] = useState('');
  const [newAchievement, setNewAchievement] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleEditStart = (field: EditingField, value: string) => {
    setEditingField(field);
    setEditValue(value);
  };

  const handleEditSave = () => {
    if (!editingField) return;

    switch (editingField) {
      case 'name':
        onUpdatePrivate({ full_name: editValue });
        break;
      case 'specialization':
        onUpdateCard({ specialization: editValue });
        break;
      case 'goals':
        onUpdateCard({ improvement_goals: editValue });
        break;
      case 'year':
        const year = parseInt(editValue);
        if (!isNaN(year) && year >= 1900 && year <= new Date().getFullYear()) {
          onUpdateCard({ year_started_playing: year });
        }
        break;
    }
    setEditingField(null);
    setEditValue('');
  };

  const handleEditCancel = () => {
    setEditingField(null);
    setEditValue('');
  };

  const handleAddAchievement = () => {
    if (!newAchievement.trim() || !cardData) return;
    const newAch: Achievement = {
      id: crypto.randomUUID(),
      title: newAchievement.trim(),
      icon: '🏆'
    };
    onUpdateCard({ achievements: [...(cardData.achievements || []), newAch] });
    setNewAchievement('');
  };

  const handleRemoveAchievement = (id: string) => {
    if (!cardData) return;
    onUpdateCard({ 
      achievements: cardData.achievements.filter(a => a.id !== id) 
    });
  };

  const handleFormatChange = (format: 'cash' | 'tournaments' | 'both') => {
    onUpdateCard({ primary_format: format });
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadPhoto(file);
    }
  };

  const formatLabels = {
    cash: 'Cash Games',
    tournaments: 'Tournaments',
    both: 'Cash & MTT'
  };

  return (
    <div className="w-full h-full bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 rounded-2xl border-2 border-poker-gold/40 shadow-2xl overflow-hidden">
      {/* Gold accent line at top */}
      <div className="h-1.5 bg-gradient-to-r from-transparent via-poker-gold to-transparent" />
      
      <div className="p-6 flex flex-col h-full">
        {/* Header with photo */}
        <div className="flex items-start gap-4 mb-6">
          {/* Photo */}
          <div 
            className="relative w-20 h-20 rounded-full border-2 border-poker-gold/60 overflow-hidden cursor-pointer group flex-shrink-0"
            onClick={handlePhotoClick}
          >
            {privateData?.profile_picture ? (
              <img 
                src={privateData.profile_picture} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-zinc-700 flex items-center justify-center">
                <Camera className="w-8 h-8 text-zinc-500" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleFileChange}
            />
          </div>

          {/* Name and username */}
          <div className="flex-1 min-w-0">
            {editingField === 'name' ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="bg-zinc-700 border-poker-gold/40 text-white"
                  placeholder="Your name"
                  autoFocus
                />
                <Button size="icon" variant="ghost" onClick={handleEditSave} className="text-green-500">
                  <Check className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={handleEditCancel} className="text-red-500">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div 
                className="flex items-center gap-2 cursor-pointer group"
                onClick={() => handleEditStart('name', privateData?.full_name || '')}
              >
                <h2 className="text-xl font-bold text-white truncate">
                  {privateData?.full_name || 'Your Name'}
                </h2>
                <Pencil className="w-3 h-3 text-poker-gold opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            )}
            <p className="text-poker-gold text-sm">
              @{profile?.username || profile?.online_nickname || 'username'}
            </p>
          </div>
        </div>

        {/* Format badges */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {(['cash', 'tournaments', 'both'] as const).map((format) => (
            <Badge
              key={format}
              variant={cardData?.primary_format === format ? 'default' : 'outline'}
              className={`cursor-pointer transition-all ${
                cardData?.primary_format === format 
                  ? 'bg-poker-gold text-black hover:bg-poker-darkGold' 
                  : 'border-poker-gold/40 text-zinc-400 hover:border-poker-gold hover:text-white'
              }`}
              onClick={() => handleFormatChange(format)}
            >
              {formatLabels[format]}
            </Badge>
          ))}
          {yearsOfExperience !== null && (
            <Badge 
              variant="outline" 
              className="border-poker-gold/40 text-poker-gold cursor-pointer"
              onClick={() => handleEditStart('year', cardData?.year_started_playing?.toString() || '')}
            >
              {yearsOfExperience}+ Years
            </Badge>
          )}
          {yearsOfExperience === null && (
            <Badge 
              variant="outline" 
              className="border-dashed border-zinc-600 text-zinc-500 cursor-pointer hover:border-poker-gold hover:text-poker-gold"
              onClick={() => handleEditStart('year', '')}
            >
              + Add Experience
            </Badge>
          )}
        </div>

        {/* Year editing modal */}
        {editingField === 'year' && (
          <div className="mb-4 flex items-center gap-2">
            <Input
              type="number"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder="Year started (e.g., 2015)"
              className="bg-zinc-700 border-poker-gold/40 text-white flex-1"
              min={1900}
              max={new Date().getFullYear()}
              autoFocus
            />
            <Button size="icon" variant="ghost" onClick={handleEditSave} className="text-green-500">
              <Check className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={handleEditCancel} className="text-red-500">
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Specialization */}
        <div className="mb-4">
          <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1 block">Specialization</label>
          {editingField === 'specialization' ? (
            <div className="flex items-center gap-2">
              <Input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="bg-zinc-700 border-poker-gold/40 text-white"
                placeholder="e.g., NLH Cash Game Specialist"
                maxLength={100}
                autoFocus
              />
              <Button size="icon" variant="ghost" onClick={handleEditSave} className="text-green-500">
                <Check className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={handleEditCancel} className="text-red-500">
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div 
              className="flex items-center gap-2 cursor-pointer group"
              onClick={() => handleEditStart('specialization', cardData?.specialization || '')}
            >
              <p className="text-white">
                {cardData?.specialization || 
                  <span className="text-zinc-500 italic">Click to add specialization...</span>}
              </p>
              <Pencil className="w-3 h-3 text-poker-gold opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )}
        </div>

        {/* Improvement goals */}
        <div className="mb-4">
          <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1 block">Working On</label>
          {editingField === 'goals' ? (
            <div className="space-y-2">
              <Textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="bg-zinc-700 border-poker-gold/40 text-white resize-none"
                placeholder="What are you trying to improve?"
                maxLength={200}
                rows={2}
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={handleEditCancel} className="text-red-500">
                  Cancel
                </Button>
                <Button size="sm" variant="ghost" onClick={handleEditSave} className="text-green-500">
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <div 
              className="flex items-start gap-2 cursor-pointer group"
              onClick={() => handleEditStart('goals', cardData?.improvement_goals || '')}
            >
              <p className="text-zinc-300 text-sm flex-1">
                {cardData?.improvement_goals || 
                  <span className="text-zinc-500 italic">Click to add goals...</span>}
              </p>
              <Pencil className="w-3 h-3 text-poker-gold opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
            </div>
          )}
        </div>

        {/* Achievements */}
        <div className="flex-1 min-h-0">
          <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block flex items-center gap-2">
            <Award className="w-3 h-3" />
            Achievements
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {cardData?.achievements?.map((ach) => (
              <Badge 
                key={ach.id}
                className="bg-zinc-700 text-poker-gold border-poker-gold/20 group cursor-pointer"
                onClick={() => handleRemoveAchievement(ach.id)}
              >
                {ach.icon} {ach.title}
                <X className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100" />
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newAchievement}
              onChange={(e) => setNewAchievement(e.target.value)}
              placeholder="Add achievement..."
              className="bg-zinc-700/50 border-zinc-600 text-white text-sm flex-1"
              onKeyDown={(e) => e.key === 'Enter' && handleAddAchievement()}
            />
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleAddAchievement}
              className="border-poker-gold/40 text-poker-gold hover:bg-poker-gold hover:text-black"
              disabled={!newAchievement.trim()}
            >
              Add
            </Button>
          </div>
        </div>

        {/* Flip button */}
        <div className="flex justify-end mt-4 pt-4 border-t border-zinc-700">
          <Button
            variant="ghost"
            size="sm"
            onClick={onFlip}
            className="text-poker-gold hover:text-poker-darkGold hover:bg-poker-gold/10"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Flip Card
          </Button>
        </div>
      </div>
    </div>
  );
}
