
import React, { useState } from 'react';
import { Filter, RotateCcw } from 'lucide-react';
import { SessionFilter } from '@/types/poker';

interface FilterBarProps {
  filters: SessionFilter;
  onFiltersChange: (filters: SessionFilter) => void;
}

const defaultFilters: SessionFilter = {
  gameType: 'All',
  format: 'All',
  location: '',
};

export default function FilterBar({ filters, onFiltersChange }: FilterBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const handleFilterChange = (key: keyof SessionFilter, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const isFiltered = filters.gameType !== 'All' || filters.format !== 'All' || (filters.location && filters.location.length > 0);
  
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center text-gray-500 dark:text-muted-foreground text-sm"
        >
          <Filter className="w-4 h-4 mr-1" />
          Filters
        </button>
        {isFiltered && (
          <button
            onClick={() => onFiltersChange(defaultFilters)}
            className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-md border border-border dark:border-[#2C2C2E] text-muted-foreground hover:text-foreground dark:hover:text-[#D4AF37] transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        )}
      </div>
      
      {isOpen && (
        <div className="bg-white dark:bg-card rounded-lg shadow-md dark:shadow-black/30 p-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-500 dark:text-muted-foreground block mb-1">Game Type</label>
              <select 
                className="w-full p-2 border rounded bg-white dark:bg-[#1C1C1E] dark:text-[#FFFFFF] dark:border-[#2C2C2E] dark:focus:border-[#D4AF37] focus:outline-none focus:ring-1 dark:focus:ring-[#D4AF37] dark:[color-scheme:dark]"
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
                className="w-full p-2 border rounded bg-white dark:bg-[#1C1C1E] dark:text-[#FFFFFF] dark:border-[#2C2C2E] dark:focus:border-[#D4AF37] focus:outline-none focus:ring-1 dark:focus:ring-[#D4AF37] dark:[color-scheme:dark]"
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
                className="w-full p-2 border rounded bg-white dark:bg-[#1C1C1E] dark:text-[#FFFFFF] dark:placeholder:text-[#8E8E93] dark:border-[#2C2C2E] dark:focus:border-[#D4AF37] focus:outline-none focus:ring-1 dark:focus:ring-[#D4AF37] dark:[color-scheme:dark]"
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
