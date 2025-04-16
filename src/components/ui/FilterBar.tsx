
import React, { useState } from 'react';
import { Filter } from 'lucide-react';
import { SessionFilter } from '@/types/poker';

interface FilterOption {
  key: string;
  options: string[];
}

interface FilterBarProps {
  filters: Record<string, string>;
  onChange: (key: string, value: string) => void;
  options: FilterOption[];
}

export default function FilterBar({ filters, onChange, options }: FilterBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const handleFilterChange = (key: string, value: string) => {
    onChange(key, value);
  };
  
  return (
    <div className="mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center text-gray-500 text-sm"
      >
        <Filter className="w-4 h-4 mr-1" />
        Filters
      </button>
      
      {isOpen && (
        <div className="bg-white rounded-lg shadow-md p-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            {options.map((option) => (
              <div key={option.key}>
                <label className="text-sm text-gray-500 block mb-1">
                  {option.key === 'gameType' ? 'Game Type' : 
                   option.key === 'format' ? 'Format' : 
                   option.key.charAt(0).toUpperCase() + option.key.slice(1)}
                </label>
                <select 
                  className="w-full p-2 border rounded"
                  value={filters[option.key] || ''}
                  onChange={(e) => handleFilterChange(option.key, e.target.value)}
                >
                  {option.options.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            ))}
            
            <div className="col-span-2">
              <label className="text-sm text-gray-500 block mb-1">Location</label>
              <input 
                type="text"
                placeholder="Filter by location..."
                className="w-full p-2 border rounded"
                value={filters.location || ''}
                onChange={(e) => handleFilterChange('location', e.target.value)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
