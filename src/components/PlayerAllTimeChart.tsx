import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { fetchUserSessions } from '@/utils/database/sessionFetcher';
import { calculateSessionProfit } from '@/utils/sessionCalculations';
import { PokerSession } from '@/types/poker';
import { format } from 'date-fns';

interface ChartDataPoint {
  date: string;
  profit: number;
  cumulativeProfit: number;
  sessionId: string;
}

const PlayerAllTimeChart: React.FC = () => {
  const [sessions, setSessions] = useState<PokerSession[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{start: string; end: string}>({
    start: '',
    end: ''
  });
  const [filteredData, setFilteredData] = useState<ChartDataPoint[]>([]);

  useEffect(() => {
    loadSessionData();
  }, []);

  useEffect(() => {
    filterDataByDateRange();
  }, [chartData, dateRange]);

  const loadSessionData = async () => {
    try {
      setLoading(true);
      const userSessions = await fetchUserSessions();
      
      // Filter completed sessions only and sort by date
      const completedSessions = userSessions
        .filter(session => !session.isActive && session.endTime)
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

      setSessions(completedSessions);
      
      // Process data for chart
      let cumulativeProfit = 0;
      const processedData: ChartDataPoint[] = completedSessions.map(session => {
        const sessionProfit = calculateSessionProfit(session);
        cumulativeProfit += sessionProfit;
        
        return {
          date: format(new Date(session.startTime), 'yyyy-MM-dd'),
          profit: sessionProfit,
          cumulativeProfit,
          sessionId: session.id
        };
      });

      setChartData(processedData);
    } catch (error) {
      console.error('Error loading session data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterDataByDateRange = () => {
    if (!dateRange.start && !dateRange.end) {
      setFilteredData(chartData);
      return;
    }

    const filtered = chartData.filter(point => {
      const pointDate = new Date(point.date);
      const startDate = dateRange.start ? new Date(dateRange.start + 'T00:00:00') : null;
      const endDate = dateRange.end ? new Date(dateRange.end + 'T23:59:59') : null;
      
      if (startDate && endDate) {
        return pointDate >= startDate && pointDate <= endDate;
      } else if (startDate) {
        return pointDate >= startDate;
      } else if (endDate) {
        return pointDate <= endDate;
      }
      return true;
    });

    // Recalculate cumulative for filtered data
    let cumulativeProfit = 0;
    const recalculatedData = filtered.map(point => {
      cumulativeProfit += point.profit;
      return {
        ...point,
        cumulativeProfit
      };
    });

    setFilteredData(recalculatedData);
  };

  const resetDateRange = () => {
    setDateRange({ start: '', end: '' });
  };

  const chartConfig = {
    cumulativeProfit: {
      label: "Net Profit",
      color: "hsl(var(--primary))",
    },
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>All Time Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading chart data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Determine what data to display
  const hasDateFilter = dateRange.start || dateRange.end;
  const dataToDisplay = hasDateFilter ? filteredData : chartData;

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Time Chart</CardTitle>
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
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {dataToDisplay.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">
              {hasDateFilter ? "No data available for selected dates" : "No session data available"}
            </div>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dataToDisplay}>
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `$${value}`}
                />
                <ChartTooltip 
                  content={
                    <ChartTooltipContent 
                      formatter={(value, name) => [
                        `$${Number(value).toFixed(2)}`,
                        name === 'cumulativeProfit' ? 'Cumulative Profit' : name
                      ]}
                      labelFormatter={(label) => format(new Date(label), 'MMM dd, yyyy')}
                    />
                  }
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
        )}
      </CardContent>
    </Card>
  );
};

export default PlayerAllTimeChart;