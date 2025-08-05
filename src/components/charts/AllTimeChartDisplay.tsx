
import React from 'react';
import { ChartContainer, ChartTooltip } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format } from 'date-fns';

interface ChartDataPoint {
  date: string;
  profit: number;
  cumulativeProfit: number;
  sessionCount: number;
  tableCount?: number;
}

interface AllTimeChartDisplayProps {
  loading: boolean;
  chartData: ChartDataPoint[];
  filteredData: ChartDataPoint[];
  dateRange: { start: string; end: string };
  isMonthlyView: boolean;
  isWeeklyView: boolean;
  isDailyView: boolean;
  isLast30DaysView: boolean;
}

export const AllTimeChartDisplay: React.FC<AllTimeChartDisplayProps> = ({
  loading,
  chartData,
  filteredData,
  dateRange,
  isMonthlyView,
  isWeeklyView,
  isDailyView,
  isLast30DaysView
}) => {
  const chartConfig = {
    cumulativeProfit: {
      label: "Net Profit",
      color: "hsl(var(--primary))",
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading chart data...</div>
      </div>
    );
  }

  // Determine what data to display and chart mode
  const hasDateFilter = dateRange.start || dateRange.end;
  const dataToDisplay = (isMonthlyView || isWeeklyView || isDailyView || isLast30DaysView) ? filteredData : (hasDateFilter ? filteredData : chartData);
  const isTableMode = !isMonthlyView && !isWeeklyView && !isDailyView && !isLast30DaysView && !hasDateFilter;

  if (dataToDisplay.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">
          {hasDateFilter ? "No data available for selected dates" : "No session data available"}
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <ChartContainer config={chartConfig} className={`h-64 w-full ${isDailyView ? 'min-w-[400px]' : isLast30DaysView ? 'min-w-[1400px]' : isMonthlyView ? 'min-w-[500px]' : isWeeklyView ? 'min-w-[800px]' : dataToDisplay.length > 20 ? 'min-w-[1200px]' : dataToDisplay.length > 10 ? 'min-w-[600px]' : 'min-w-[300px]'}`}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dataToDisplay} margin={{ top: 5, right: 30, left: 5, bottom: 5 }}>
            <XAxis 
              dataKey={isTableMode ? "tableCount" : "date"}
              tick={{ fontSize: 12 }}
              type={isTableMode ? "number" : "category"}
              domain={isTableMode ? [0, 110] : ['dataMin', 'dataMax']}
              ticks={isTableMode ? [50, 100] : undefined}
              interval={isTableMode ? 0 : 0}
              angle={0}
              textAnchor="middle"
              height={60}
              axisLine={true}
              tickLine={true}
              tickFormatter={(value, index) => {
                if (isTableMode) {
                  const totalTables = dataToDisplay.length > 0 ? Math.max(...dataToDisplay.map(d => d.tableCount || 0)) : 0;
                  const currentTable = Number(value);
                  
                  // Show only fixed milestone labels: 50 and 100
                  if (currentTable === 50) return '50';
                  if (currentTable === 100) return '100';
                  
                  return '';
                } else if (isMonthlyView) {
                  const date = new Date(value);
                  if (isNaN(date.getTime())) return value;
                  return format(date, 'MMM');
                } else if (isWeeklyView) {
                  return value; // Weekly data is already formatted as "WEEK 1", "WEEK 2", etc.
                 } else if (isDailyView || isLast30DaysView) {
                   const date = new Date(value);
                   if (isNaN(date.getTime())) return value;
                   return format(date, 'dd/MM');
                }
                const date = new Date(value);
                if (isNaN(date.getTime())) return value;
                return format(date, 'dd/MM');
              }}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `$${value}`}
            />
            <ChartTooltip 
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const value = Number(payload[0].value);
                  const profitValue = Number(payload[0].payload?.profit || 0);
                  const sign = value >= 0 ? '+' : '−';
                  const colorClass = value >= 0 ? 'text-green-600' : 'text-red-600';
                  const profitSign = profitValue >= 0 ? '+' : '−';
                  const profitColorClass = profitValue >= 0 ? 'text-green-600' : 'text-red-600';
                  
                  // Handle different formats for different views
                  let displayLabel = label;
                  if (isTableMode) {
                    displayLabel = `Table ${label}`;
                  } else if (isWeeklyView) {
                    // For weekly view, generate the date range from the week number
                    const weekMatch = label.match(/WEEK (\d+)/);
                    if (weekMatch) {
                      const weekIndex = parseInt(weekMatch[1]) - 1;
                      const today = new Date();
                      const weekStart = new Date(today);
                      const daysToMonday = (weekStart.getDay() + 6) % 7;
                      weekStart.setDate(weekStart.getDate() - daysToMonday - ((11 - weekIndex) * 7));
                      const weekEnd = new Date(weekStart);
                      weekEnd.setDate(weekStart.getDate() + 6);
                      displayLabel = `${format(weekStart, 'dd/MM')}–${format(weekEnd, 'dd/MM')}`;
                    }
                  } else {
                    // Other views: parse and format the date
                    try {
                      const date = new Date(label);
                      if (!isNaN(date.getTime())) {
                        displayLabel = format(date, 'dd/MM/yyyy');
                      }
                    } catch (error) {
                      // Fallback to original label if parsing fails
                      displayLabel = label;
                    }
                  }
                  
                  return (
                    <div className="bg-background border border-border rounded-lg shadow-lg p-3">
                      <div className="text-center text-sm text-muted-foreground mb-1">
                        {displayLabel}
                      </div>
                      {isTableMode && (
                        <div className={`text-center text-sm mb-1 ${profitColorClass}`}>
                          Table P&L: {profitSign}₪{Math.abs(profitValue).toFixed(2)}
                        </div>
                      )}
                      <div className={`text-center font-semibold ${colorClass}`}>
                        {isTableMode ? 'Net Worth: ' : ''}{sign}₪{Math.abs(value).toFixed(2)}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            {isTableMode && (
              <ReferenceLine 
                y={0} 
                stroke="hsl(120, 60%, 30%)" 
                strokeWidth={1.5}
                strokeDasharray="none"
              />
            )}
            <Line
              type="monotone"
              dataKey="cumulativeProfit"
              stroke="var(--color-cumulativeProfit)"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
};
