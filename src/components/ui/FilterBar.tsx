
import React, { useState } from 'react';
import { Filter } from 'lucide-react';
import { SessionFilter } from '@/types/poker';

interface FilterBarProps {
  filters: SessionFilter;
  onFiltersChange: (filters: SessionFilter) => void;
}

export default function FilterBar({ filters, onFiltersChange }: FilterBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const handleFilterChange = (key: keyof SessionFilter, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };
  
  return (
    <div className="mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center text-gray-500 dark:text-muted-foreground text-sm"
      >
        <Filter className="w-4 h-4 mr-1" />
        Filters
      </button>
      
      {isOpen && (
        <div className="bg-white dark:bg-card rounded-lg shadow-md p-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-500 dark:text-muted-foreground block mb-1">Game Type</label>
              <select 
                className="w-full p-2 border rounded"
                value={filters.gameType}
                onChange={(e) => handleFilterChange('gameType', e.target.value)}
              >
                <option value="All">All Games</option>
                <option value="NLH">No Limit Hold'em</option>
                <option value="PLO">Pot Limit Omaha</option>
              </select>
            </div>
            
            <div>
              <label className="text-sm text-gray-500 dark:text-muted-foreground block mb-1">Format</label>
              <select 
                className="w-full p-2 border rounded"
                value={filters.format}
                onChange={(e) => handleFilterChange('format', e.target.value)}
              >
                <option value="All">All Formats</option>
                <option value="Cash">Cash</option>
                <option value="Tournament">Tournament</option>
              </select>
            </div>
            
            <div className="col-span-2">
              <label className="text-sm text-gray-500 dark:text-muted-foreground block mb-1">Location</label>
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
