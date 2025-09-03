import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { FilterChip } from './FilterChip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export interface FilterOptions {
  timeframeType: 'monthly' | 'weekly' | 'quick' | 'yearly' | 'custom';
  timeframeValue: string;
  gameScope: 'all' | 'cash' | 'tournaments';
  gameTypes: string[];
  sessionFormat: string[];
  customStartDate?: Date;
  customEndDate?: Date;
}

interface StatisticsFilterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  onApplyFilters: () => void;
  onExportPDF: () => void;
}

export const StatisticsFilterModal: React.FC<StatisticsFilterModalProps> = ({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
  onApplyFilters,
  onExportPDF,
}) => {
  const [gameTypeExpanded, setGameTypeExpanded] = useState(false);
  const [sessionFormatExpanded, setSessionFormatExpanded] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const timeframeOptions = {
    monthly: ['This Month', 'Last Month', 'Last 3 Months'],
    weekly: ['This Week', 'Last Week'],
    quick: ['Last 7 Days', 'Last 30 Days', 'Last 90 Days'],
    yearly: ['This Year', 'Last Year'],
  };

  const gameTypeOptions = ['Hold\'em', 'PLO', 'PLO5/6', 'Other'];
  const sessionFormatOptions = ['Live', 'Online'];

  const handleTimeframeTypeChange = (type: FilterOptions['timeframeType']) => {
    const defaultValues = {
      monthly: 'This Month',
      weekly: 'This Week',
      quick: 'Last 7 Days',
      yearly: 'This Year',
      custom: 'Custom Range',
    };

    onFiltersChange({
      ...filters,
      timeframeType: type,
      timeframeValue: defaultValues[type],
    });
  };

  const handleGameTypeToggle = (gameType: string) => {
    const newGameTypes = filters.gameTypes.includes(gameType)
      ? filters.gameTypes.filter(t => t !== gameType)
      : [...filters.gameTypes, gameType];
    
    onFiltersChange({ ...filters, gameTypes: newGameTypes });
  };

  const handleSessionFormatToggle = (format: string) => {
    const newFormats = filters.sessionFormat.includes(format)
      ? filters.sessionFormat.filter(f => f !== format)
      : [...filters.sessionFormat, format];
    
    onFiltersChange({ ...filters, sessionFormat: newFormats });
  };

  const handleApply = () => {
    onApplyFilters();
    onOpenChange(false);
  };

  const handleExportClick = () => {
    setShowConfirmation(true);
  };

  const handleConfirmExport = () => {
    onExportPDF();
    setShowConfirmation(false);
    onOpenChange(false);
  };

  const handleCancelConfirmation = () => {
    setShowConfirmation(false);
  };

  const getFilterSummary = () => {
    const summary = [];
    
    // Timeframe
    if (filters.timeframeType === 'custom') {
      const start = filters.customStartDate ? format(filters.customStartDate, 'MMM dd, yyyy') : 'Start';
      const end = filters.customEndDate ? format(filters.customEndDate, 'MMM dd, yyyy') : 'End';
      summary.push(`Timeframe: ${start} - ${end}`);
    } else {
      summary.push(`Timeframe: ${filters.timeframeValue}`);
    }
    
    // Game Scope
    summary.push(`Game Scope: ${filters.gameScope === 'all' ? 'All' : filters.gameScope.charAt(0).toUpperCase() + filters.gameScope.slice(1)}`);
    
    // Game Types
    if (filters.gameTypes.length > 0) {
      summary.push(`Game Types: ${filters.gameTypes.join(', ')}`);
    }
    
    // Session Format
    if (filters.sessionFormat.length > 0) {
      summary.push(`Session Format: ${filters.sessionFormat.join(', ')}`);
    }
    
    return summary;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Quick Filters & Export</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Timeframe Selection */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Timeframe</h4>
            <div className="flex flex-wrap gap-2">
              {(['monthly', 'weekly', 'quick', 'yearly', 'custom'] as const).map(type => (
                <FilterChip
                  key={type}
                  label={type === 'quick' ? 'Quick Ranges' : type === 'custom' ? 'Custom Range' : type.charAt(0).toUpperCase() + type.slice(1)}
                  selected={filters.timeframeType === type}
                  onClick={() => handleTimeframeTypeChange(type)}
                />
              ))}
            </div>
            
            {/* Timeframe Value Selection */}
            {filters.timeframeType !== 'custom' && (
              <div className="flex flex-wrap gap-2 ml-4">
                {timeframeOptions[filters.timeframeType].map(value => (
                  <FilterChip
                    key={value}
                    label={value}
                    selected={filters.timeframeValue === value}
                    onClick={() => onFiltersChange({ ...filters, timeframeValue: value })}
                    className="text-xs"
                  />
                ))}
              </div>
            )}
            
            {/* Custom Date Range */}
            {filters.timeframeType === 'custom' && (
              <div className="flex gap-4 ml-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground">Start Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-[140px] justify-start text-left font-normal',
                          !filters.customStartDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.customStartDate ? format(filters.customStartDate, 'MMM dd') : 'Start'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.customStartDate}
                        onSelect={(date) => onFiltersChange({ ...filters, customStartDate: date })}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground">End Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-[140px] justify-start text-left font-normal',
                          !filters.customEndDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.customEndDate ? format(filters.customEndDate, 'MMM dd') : 'End'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.customEndDate}
                        onSelect={(date) => onFiltersChange({ ...filters, customEndDate: date })}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}
          </div>

          {/* Game Scope */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Game Scope</h4>
            <div className="flex flex-wrap gap-2">
              {(['all', 'cash', 'tournaments'] as const).map(scope => (
                <FilterChip
                  key={scope}
                  label={scope === 'all' ? 'All' : scope.charAt(0).toUpperCase() + scope.slice(1)}
                  selected={filters.gameScope === scope}
                  onClick={() => onFiltersChange({ ...filters, gameScope: scope })}
                />
              ))}
            </div>
          </div>

          {/* Game Type (Collapsible) */}
          <Collapsible open={gameTypeExpanded} onOpenChange={setGameTypeExpanded}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-0">
              <h4 className="text-sm font-medium">Game Type</h4>
              <ChevronDown className={cn('h-4 w-4 transition-transform', gameTypeExpanded && 'rotate-180')} />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 mt-3">
              <div className="flex flex-wrap gap-2">
                {gameTypeOptions.map(gameType => (
                  <FilterChip
                    key={gameType}
                    label={gameType}
                    selected={filters.gameTypes.includes(gameType)}
                    onClick={() => handleGameTypeToggle(gameType)}
                  />
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Session Format (Collapsible) */}
          <Collapsible open={sessionFormatExpanded} onOpenChange={setSessionFormatExpanded}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-0">
              <h4 className="text-sm font-medium">Session Format</h4>
              <ChevronDown className={cn('h-4 w-4 transition-transform', sessionFormatExpanded && 'rotate-180')} />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 mt-3">
              <div className="flex flex-wrap gap-2">
                {sessionFormatOptions.map(format => (
                  <FilterChip
                    key={format}
                    label={format}
                    selected={filters.sessionFormat.includes(format)}
                    onClick={() => handleSessionFormatToggle(format)}
                  />
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button variant="outline" onClick={handleExportClick}>
            Export to PDF
          </Button>
          <Button onClick={handleApply}>
            Apply Filters
          </Button>
        </DialogFooter>
      </DialogContent>
      
      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Export filtered stats to PDF?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <div className="text-sm">
                <p className="font-medium mb-2">Applied filters:</p>
                <ul className="space-y-1">
                  {getFilterSummary().map((filter, index) => (
                    <li key={index} className="text-muted-foreground">• {filter}</li>
                  ))}
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelConfirmation}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmExport}>
              Export to PDF
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};