
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { useLanguage } from '@/context/LanguageContext';
import Icon from '@/components/ui/Lucide';

const FocusModeButton = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [showDialog, setShowDialog] = useState(false);
  const [focusTime, setFocusTime] = useState(10); // Default 10 minutes
  
  const handleStartFocusMode = () => {
    navigate('/focus-mode', { state: { duration: focusTime } });
    setShowDialog(false);
  };
  
  return (
    <>
      <div className="fixed bottom-6 right-6">
        <Button
          variant="poker"
          className="rounded-full w-14 h-14 shadow-lg hover:shadow-xl"
          onClick={() => setShowDialog(true)}
          aria-label={t('enter_focus_mode')}
        >
          <Icon name="Focus" className="h-6 w-6" />
        </Button>
      </div>
      
      {/* Focus Mode Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('focus_mode')}</DialogTitle>
            <DialogDescription>
              {t('focus_mode_description', 'Select how long you want to stay in focus mode.')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6">
            <div className="mb-6">
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium">{t('duration')}: {focusTime} min</label>
              </div>
              <Slider
                defaultValue={[10]}
                min={5}
                max={60}
                step={5}
                onValueChange={(value) => setFocusTime(value[0])}
              />
              <div className="flex justify-between mt-1 text-xs text-gray-500">
                <span>5 {t('minutes')}</span>
                <span>60 {t('minutes')}</span>
              </div>
            </div>
            
            <p className="text-sm text-gray-500 mb-4">
              {t('focus_mode_warning', 'Your phone will be locked in focus mode for the selected duration to help you concentrate on your game.')}
            </p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={handleStartFocusMode} variant="poker">
              {t('start')} {focusTime} {t('minutes')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FocusModeButton;
