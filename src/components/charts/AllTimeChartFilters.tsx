import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AllTimeChartFiltersProps {
  dateRange: { start: string; end: string };
  setDateRange: (range: { start: string; end: string } | ((prev: { start: string; end: string }) => { start: string; end: string })) => void;
  isMonthlyView: boolean;
  isWeeklyView: boolean;
  resetDateRange: () => void;
  toggleMonthlyView: () => void;
  toggleWeeklyView: () => void;
}

export const AllTimeChartFilters: React.FC<AllTimeChartFiltersProps> = ({
  dateRange,
  setDateRange,
  isMonthlyView,
  isWeeklyView,
  resetDateRange,
  toggleMonthlyView,
  toggleWeeklyView
}) => {
  return (
    <div className="flex flex-col gap-4 mt-4">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor="startDate" className="text-sm">Start Date</Label>
          <Input
            id="startDate"
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            className="text-sm"
          />
        </div>
        <div>
          <Label htmlFor="endDate" className="text-sm">End Date</Label>
          <Input
            id="endDate"
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            className="text-sm"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={resetDateRange}
          className="text-xs"
        >
          All Time
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={toggleWeeklyView}
          className="text-xs"
        >
          Daily
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={toggleMonthlyView}
          className="text-xs"
        >
          Monthly
        </Button>
      </div>
    </div>
  );
};