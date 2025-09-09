import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FilterChip } from '@/components/FilterChip';
import { ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export interface TableFiltersState {
  sortBy: 'startTime' | 'buyIn' | 'duration' | 'result';
  sortOrder: 'asc' | 'desc';
  gameFormat: 'all' | 'Cash' | 'Tournament';
  gameType: 'all' | 'NLH' | 'PLO';
}

export const defaultFilters: TableFiltersState = {
  sortBy: 'startTime',
  sortOrder: 'desc',
  gameFormat: 'all',
  gameType: 'all'
};

interface TableFiltersProps {
  filters: TableFiltersState;
  onFiltersChange: (filters: TableFiltersState) => void;
  totalTables: number;
  filteredCount: number;
}

export const TableFilters: React.FC<TableFiltersProps> = ({
  filters,
  onFiltersChange,
  totalTables,
  filteredCount
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSortByChange = (sortBy: TableFiltersState['sortBy']) => {
    onFiltersChange({
      ...filters,
      sortBy,
      sortOrder: filters.sortBy === sortBy && filters.sortOrder === 'desc' ? 'asc' : 'desc'
    });
  };

  const handleGameFormatChange = (format: TableFiltersState['gameFormat']) => {
    onFiltersChange({
      ...filters,
      gameFormat: format
    });
  };

  const handleGameTypeChange = (gameType: TableFiltersState['gameType']) => {
    onFiltersChange({
      ...filters,
      gameType: gameType
    });
  };

  const getSortLabel = (sortBy: string, sortOrder: string) => {
    const labels = {
      startTime: sortOrder === 'desc' ? 'Newest First' : 'Oldest First',
      buyIn: sortOrder === 'desc' ? 'High → Low' : 'Low → High',
      duration: sortOrder === 'desc' ? 'Longest First' : 'Shortest First',
      result: sortOrder === 'desc' ? 'Best Result' : 'Worst Result'
    };
    return labels[sortBy as keyof typeof labels];
  };

  return (
    <div className="mb-4 border border-border rounded-lg bg-background">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filters</span>
          {(filters.gameFormat !== 'all' || filters.gameType !== 'all' || 
            filters.sortBy !== 'startTime' || filters.sortOrder !== 'desc') && (
            <span className="text-xs text-muted-foreground">
              ({filteredCount} of {totalTables} tables)
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="text-muted-foreground hover:text-foreground"
        >
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>
      
      <Collapsible open={isOpen}>
        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-4">
            {/* Sort By */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Sort By</label>
              <div className="flex flex-wrap gap-2">
                <FilterChip
                  label={`Start Time (${getSortLabel('startTime', filters.sortBy === 'startTime' ? filters.sortOrder : 'desc')})`}
                  selected={filters.sortBy === 'startTime'}
                  onClick={() => handleSortByChange('startTime')}
                />
                <FilterChip
                  label={`Buy-in (${getSortLabel('buyIn', filters.sortBy === 'buyIn' ? filters.sortOrder : 'desc')})`}
                  selected={filters.sortBy === 'buyIn'}
                  onClick={() => handleSortByChange('buyIn')}
                />
                <FilterChip
                  label={`Duration (${getSortLabel('duration', filters.sortBy === 'duration' ? filters.sortOrder : 'desc')})`}
                  selected={filters.sortBy === 'duration'}
                  onClick={() => handleSortByChange('duration')}
                />
                <FilterChip
                  label={`Result (${getSortLabel('result', filters.sortBy === 'result' ? filters.sortOrder : 'desc')})`}
                  selected={filters.sortBy === 'result'}
                  onClick={() => handleSortByChange('result')}
                />
              </div>
            </div>

            {/* Game Format */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Game Format</label>
              <div className="flex flex-wrap gap-2">
                <FilterChip
                  label="All Formats"
                  selected={filters.gameFormat === 'all'}
                  onClick={() => handleGameFormatChange('all')}
                />
                <FilterChip
                  label="Cash"
                  selected={filters.gameFormat === 'Cash'}
                  onClick={() => handleGameFormatChange('Cash')}
                />
                <FilterChip
                  label="Tournament"
                  selected={filters.gameFormat === 'Tournament'}
                  onClick={() => handleGameFormatChange('Tournament')}
                />
              </div>
            </div>

            {/* Game Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Game Type</label>
              <div className="flex flex-wrap gap-2">
                <FilterChip
                  label="All Games"
                  selected={filters.gameType === 'all'}
                  onClick={() => handleGameTypeChange('all')}
                />
                <FilterChip
                  label="No Limit Hold'em"
                  selected={filters.gameType === 'NLH'}
                  onClick={() => handleGameTypeChange('NLH')}
                />
                <FilterChip
                  label="Pot Limit Omaha"
                  selected={filters.gameType === 'PLO'}
                  onClick={() => handleGameTypeChange('PLO')}
                />
              </div>
            </div>

            {/* Reset Filters */}
            {(filters.gameFormat !== 'all' || filters.gameType !== 'all' || 
              filters.sortBy !== 'startTime' || filters.sortOrder !== 'desc') && (
              <div className="pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onFiltersChange(defaultFilters)}
                >
                  Reset Filters
                </Button>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};