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
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, isSameMonth, isSameDay } from 'date-fns';

interface ChartDataPoint {
  date: string;
  profit: number;
  cumulativeProfit: number;
  sessionCount: number;
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
      
      // Process monthly data by default
      const monthlyData = processMonthlyData(completedSessions);
      setChartData(monthlyData);
    } catch (error) {
      console.error('Error loading session data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processMonthlyData = (sessions: PokerSession[]): ChartDataPoint[] => {
    if (sessions.length === 0) return [];

    // Get the range from first session to current month
    const firstSessionDate = new Date(sessions[0].startTime);
    const currentDate = new Date();
    const firstMonth = startOfMonth(firstSessionDate);
    const currentMonth = startOfMonth(currentDate);

    // Generate all months in the range
    const months = eachMonthOfInterval({ start: firstMonth, end: currentMonth });

    let cumulativeProfit = 0;
    const monthlyData: ChartDataPoint[] = months.map(month => {
      // Find all sessions in this month
      const monthSessions = sessions.filter(session =>
        isSameMonth(new Date(session.startTime), month)
      );

      // Calculate total profit for this month
      const monthProfit = monthSessions.reduce((total, session) => {
        return total + calculateSessionProfit(session);
      }, 0);

      cumulativeProfit += monthProfit;

      return {
        date: format(month, 'yyyy-MM-dd'),
        profit: monthProfit,
        cumulativeProfit,
        sessionCount: monthSessions.length
      };
    });

    return monthlyData;
  };

  const processDailyData = (sessions: PokerSession[], startDate: Date, endDate: Date): ChartDataPoint[] => {
    // Filter sessions within the date range
    const filteredSessions = sessions.filter(session => {
      const sessionDate = new Date(session.startTime);
      return sessionDate >= startDate && sessionDate <= endDate;
    });

    // Group sessions by day
    const sessionsByDay = new Map<string, PokerSession[]>();
    filteredSessions.forEach(session => {
      const dayKey = format(new Date(session.startTime), 'yyyy-MM-dd');
      if (!sessionsByDay.has(dayKey)) {
        sessionsByDay.set(dayKey, []);
      }
      sessionsByDay.get(dayKey)!.push(session);
    });

    // Convert to chart data points
    let cumulativeProfit = 0;
    const dailyData: ChartDataPoint[] = Array.from(sessionsByDay.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, daySessions]) => {
        const dayProfit = daySessions.reduce((total, session) => {
          return total + calculateSessionProfit(session);
        }, 0);

        cumulativeProfit += dayProfit;

        return {
          date,
          profit: dayProfit,
          cumulativeProfit,
          sessionCount: daySessions.length
        };
      });

    // Always extend chart to the selected end date if needed
    const endDateString = format(endDate, 'yyyy-MM-dd');
    const lastDataPoint = dailyData[dailyData.length - 1];
    
    if (dailyData.length > 0 && lastDataPoint && lastDataPoint.date < endDateString) {
      // Add a virtual point at the end date to extend the chart
      dailyData.push({
        date: endDateString,
        profit: 0, // No new profit for this virtual point
        cumulativeProfit: lastDataPoint.cumulativeProfit, // Same cumulative value
        sessionCount: 0 // No sessions on this virtual point
      });
    }

    return dailyData;
  };

  const filterDataByDateRange = () => {
    const hasDateFilter = dateRange.start || dateRange.end;
    
    if (!hasDateFilter) {
      // No filter - show monthly data
      const monthlyData = processMonthlyData(sessions);
      setFilteredData(monthlyData);
      return;
    }

    // Date filter applied - switch to daily view
    const startDate = dateRange.start ? new Date(dateRange.start + 'T00:00:00') : new Date(sessions[0]?.startTime || new Date());
    const endDate = dateRange.end ? new Date(dateRange.end + 'T23:59:59') : new Date();
    
    const dailyData = processDailyData(sessions, startDate, endDate);
    setFilteredData(dailyData);
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
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return hasDateFilter ? format(date, 'MMM dd') : format(date, 'MMM yyyy');
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
                      
                      return (
                        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
                          <div className="text-center text-sm text-muted-foreground mb-1">
                            {format(new Date(label), 'MMM dd, yyyy')}
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
        )}
      </CardContent>
    </Card>
  );
};

export default PlayerAllTimeChart;