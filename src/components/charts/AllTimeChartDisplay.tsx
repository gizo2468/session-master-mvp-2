import React from 'react';
import { ChartContainer, ChartTooltip } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

interface ChartDataPoint {
  date: string;
  profit: number;
  cumulativeProfit: number;
  sessionCount: number;
}

interface AllTimeChartDisplayProps {
  loading: boolean;
  chartData: ChartDataPoint[];
  filteredData: ChartDataPoint[];
  dateRange: { start: string; end: string };
  isMonthlyView: boolean;
  isWeeklyView: boolean;
  isDailyView: boolean;
}

export const AllTimeChartDisplay: React.FC<AllTimeChartDisplayProps> = ({
  loading,
  chartData,
  filteredData,
  dateRange,
  isMonthlyView,
  isWeeklyView,
  isDailyView
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

  // Determine what data to display
  const hasDateFilter = dateRange.start || dateRange.end;
  const dataToDisplay = (isMonthlyView || isWeeklyView || isDailyView) ? filteredData : (hasDateFilter ? filteredData : chartData);

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
      <ChartContainer config={chartConfig} className={`h-64 w-full ${(isMonthlyView || isWeeklyView || isDailyView) ? 'min-w-[800px]' : dataToDisplay.length > 20 ? 'min-w-[1200px]' : dataToDisplay.length > 10 ? 'min-w-[600px]' : 'min-w-[300px]'}`}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dataToDisplay} margin={{ top: 5, right: 30, left: 5, bottom: 5 }}>
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              type="category"
              domain={['dataMin', 'dataMax']}
              interval={0}
              angle={0}
              textAnchor="middle"
              height={60}
              tickFormatter={(value) => {
                if (isMonthlyView) {
                  const date = new Date(value);
                  return format(date, 'MMM');
                } else if (isWeeklyView) {
                  return value; // Weekly data already formatted as MM/DD–MM/DD
                } else if (isDailyView) {
                  const date = new Date(value);
                  return format(date, 'MM/dd');
                }
                const date = new Date(value);
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
                  const sign = value >= 0 ? '+' : '−';
                  const colorClass = value >= 0 ? 'text-green-600' : 'text-red-600';
                  
                  // Handle different date formats for different views
                  let displayDate = label;
                  if (isWeeklyView) {
                    // Weekly view: label is already formatted as "MM/dd–MM/dd"
                    displayDate = label;
                  } else {
                    // Other views: parse and format the date
                    try {
                      const date = new Date(label);
                      if (!isNaN(date.getTime())) {
                        displayDate = format(date, 'dd/MM/yyyy');
                      }
                    } catch (error) {
                      // Fallback to original label if parsing fails
                      displayDate = label;
                    }
                  }
                  
                  return (
                    <div className="bg-background border border-border rounded-lg shadow-lg p-3">
                      <div className="text-center text-sm text-muted-foreground mb-1">
                        {displayDate}
                      </div>
                      <div className={`text-center font-semibold ${colorClass}`}>
                        {sign}₪{Math.abs(value).toFixed(2)}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
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