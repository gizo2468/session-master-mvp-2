
import React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface SessionEndModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmEnd: () => void;
  cashOutAmount: string;
  setCashOutAmount: (value: string) => void;
  notes: string;
  onNotesChange: (notes: string) => void;
}

const SessionEndModal: React.FC<SessionEndModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirmEnd, 
  cashOutAmount, 
  setCashOutAmount,
  notes,
  onNotesChange
}) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">End Session</h2>
        <p className="mb-4">Please enter your cash out amount:</p>
        
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <span className="text-gray-500">$</span>
            </div>
            <input
              type="number"
              placeholder="0.00"
              className="w-full p-3 pl-8 border border-gray-300 rounded-md"
              value={cashOutAmount}
              onChange={(e) => setCashOutAmount(e.target.value)}
              min="0"
              step="0.01"
              required
            />
          </div>
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 mb-2" htmlFor="notes">Session Notes</label>
          <textarea
            id="notes"
            placeholder="How did your session go? Note any significant hands, reads, or things to improve..."
            className="w-full p-3 border border-gray-300 rounded-md min-h-[100px]"
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
          ></textarea>
        </div>
        
        <div className="flex gap-4">
          <Button
            onClick={onConfirmEnd}
            className="flex-1 py-2 px-4 bg-poker-gold hover:bg-poker-darkGold text-white font-bold rounded-md"
            disabled={!cashOutAmount}
          >
            End Session
          </Button>
          
          <Button
            onClick={onClose}
            className="flex-1 py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-md"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SessionEndModal;
