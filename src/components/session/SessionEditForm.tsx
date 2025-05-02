
import React from 'react';
import { Textarea } from '@/components/ui/textarea';

interface FormData {
  location: string;
  buyIn: string;
  smallBlind: string;
  bigBlind: string;
  gameType: string;
  format: string;
  notes: string;
}

interface SessionEditFormProps {
  formData: FormData;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleSaveEdit: () => void;
  setIsEditing: (value: boolean) => void;
}

const SessionEditForm: React.FC<SessionEditFormProps> = ({
  formData,
  handleChange,
  handleSaveEdit,
  setIsEditing
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-4">
        <label className="block text-gray-700 mb-2" htmlFor="location">
          Location
        </label>
        <input
          id="location"
          name="location"
          type="text"
          value={formData.location}
          onChange={handleChange}
          className="w-full p-3 border border-gray-300 rounded-md"
        />
      </div>
      
      <div className="mb-4">
        <label className="block text-gray-700 mb-2">Game Type</label>
        <select
          name="gameType"
          value={formData.gameType}
          onChange={handleChange}
          className="w-full p-3 border border-gray-300 rounded-md"
        >
          <option value="NLH">No Limit Hold'em</option>
          <option value="PLO">Pot Limit Omaha</option>
        </select>
      </div>
      
      <div className="mb-4">
        <label className="block text-gray-700 mb-2">Format</label>
        <select
          name="format"
          value={formData.format}
          onChange={handleChange}
          className="w-full p-3 border border-gray-300 rounded-md"
        >
          <option value="Cash">Cash Game</option>
          <option value="Tournament">Tournament</option>
        </select>
      </div>
      
      <div className="mb-4">
        <label className="block text-gray-700 mb-2" htmlFor="buyin">
          Buy-in Amount
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <span className="text-gray-500">$</span>
          </div>
          <input
            id="buyin"
            name="buyIn"
            type="number"
            value={formData.buyIn}
            onChange={handleChange}
            className="w-full p-3 pl-8 border border-gray-300 rounded-md"
            min="0"
            step="0.01"
          />
        </div>
      </div>
      
      <div className="mb-4 grid grid-cols-2 gap-4">
        <div>
          <label className="block text-gray-700 mb-2" htmlFor="smallBlind">
            Small Blind
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <span className="text-gray-500">$</span>
            </div>
            <input
              id="smallBlind"
              name="smallBlind"
              type="number"
              value={formData.smallBlind}
              onChange={handleChange}
              className="w-full p-3 pl-8 border border-gray-300 rounded-md"
              min="0"
              step="0.01"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-gray-700 mb-2" htmlFor="bigBlind">
            Big Blind
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <span className="text-gray-500">$</span>
            </div>
            <input
              id="bigBlind"
              name="bigBlind"
              type="number"
              value={formData.bigBlind}
              onChange={handleChange}
              className="w-full p-3 pl-8 border border-gray-300 rounded-md"
              min="0"
              step="0.01"
            />
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        <label className="block text-gray-700 mb-2" htmlFor="notes">
          Notes
        </label>
        <Textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Add session notes here..."
          className="min-h-[100px]"
        />
      </div>
      
      <div className="flex gap-3">
        <button
          onClick={handleSaveEdit}
          className="flex-1 py-3 px-4 bg-poker-gold hover:bg-poker-darkGold text-white font-bold rounded-md"
        >
          Save Changes
        </button>
        
        <button
          onClick={() => setIsEditing(false)}
          className="flex-1 py-3 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-md"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default SessionEditForm;
