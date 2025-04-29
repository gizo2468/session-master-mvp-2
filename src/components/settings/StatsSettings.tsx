
import React from 'react';
import { Separator } from '@/components/ui/separator';
import TopPlayersBySessionsTable from '@/components/TopPlayersBySessionsTable';
import StatsQuickView from '@/components/StatsQuickView';

export default function StatsSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Statistics</h3>
        <p className="text-sm text-muted-foreground">
          View player statistics and session metrics
        </p>
      </div>
      <Separator />
      
      <div className="space-y-6">
        <StatsQuickView />
        <TopPlayersBySessionsTable />
      </div>
    </div>
  );
}
