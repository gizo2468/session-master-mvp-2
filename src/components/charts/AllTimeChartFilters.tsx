import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CurrencySelector } from '@/components/ui/CurrencySelector';
import { getCurrencySymbol } from '@/hooks/useDefaultCurrency';
import { usePremiumAccess } from '@/hooks/usePremiumAccess';

interface AllTimeChartFiltersProps {
  dateRange: { start: string; end: string };
  setDateRange: (range: { start: string; end: string } | ((prev: { start: string; end: string }) => { start: string; end: string })) => void;
  isMonthlyView: boolean;
  isWeeklyView: boolean;
  isDailyView: boolean;
  isLast30DaysView: boolean;
  selectedCurrency: string;
  availableCurrencies: string[];
  resetDateRange: () => void;
  toggleMonthlyView: () => void;
  toggleWeeklyView: () => void;
  toggleDailyView: () => void;
  toggleLast30DaysView: () => void;
  onCurrencyChange: (currency: string) => void;
}

export const AllTimeChartFilters: React.FC<AllTimeChartFiltersProps> = ({
  dateRange,
  setDateRange,
  isMonthlyView,
  isWeeklyView,
  isDailyView,
  isLast30DaysView,
  selectedCurrency,
  availableCurrencies,
  resetDateRange,
  toggleMonthlyView,
  toggleWeeklyView,
  toggleDailyView,
  toggleLast30DaysView,
  onCurrencyChange
}) => {
  const { isPremium } = usePremiumAccess();
  
  const getCurrentView = () => {
    if (isMonthlyView) return "monthly";
    if (isWeeklyView) return "weekly";
    if (isDailyView) return "daily";
    if (isLast30DaysView) return "last30days";
    return "all-time";
  };

  const handleViewChange = (value: string) => {
    switch (value) {
      case "all-time":
        resetDateRange();
        break;
      case "daily":
        toggleDailyView();
        break;
      case "last30days":
        toggleLast30DaysView();
        break;
      case "weekly":
        toggleWeeklyView();
        break;
      case "monthly":
        toggleMonthlyView();
        break;
    }
  };

  return (
    <div className="flex flex-col gap-4 mt-4">
      <div className="grid grid-cols-2 gap-4">
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
      <div className="flex justify-start gap-4">
        <Select value={getCurrentView()} onValueChange={handleViewChange}>
          <SelectTrigger className="w-32 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-time">All Time</SelectItem>
            <SelectItem value="daily">Last 7 Days</SelectItem>
            <SelectItem value="last30days">Last 30 Days</SelectItem>
            <SelectItem value="weekly">Last 3 Months</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
          </SelectContent>
        </Select>
        {isPremium ? (
          <Select value={selectedCurrency} onValueChange={onCurrencyChange}>
            <SelectTrigger className="w-32 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(availableCurrencies || []).map(currency => (
                <SelectItem key={currency} value={currency}>
                  {getCurrencySymbol(currency)} {currency}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="w-32">
            <CurrencySelector
              value={selectedCurrency}
              onValueChange={onCurrencyChange}
              className="text-sm"
            />
          </div>
        )}
      </div>
    </div>
  );
};