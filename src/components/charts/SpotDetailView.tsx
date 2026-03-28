import React from 'react';
import { ChartSolution } from '@/hooks/useChartsLibrary';
import HandRangeGrid from './HandRangeGrid';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/Lucide';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SpotDetailViewProps {
  solution: ChartSolution;
  stackDepth: number;
  onBack: () => void;
}

const SpotDetailView: React.FC<SpotDetailViewProps> = ({ solution, stackDepth, onBack }) => {
  const freq = solution.range_data?.frequency;
  const description = solution.range_data?.description;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <Icon name="ArrowLeft" className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-lg truncate">{solution.spot_label}</h2>
          <p className="text-sm text-muted-foreground">
            {stackDepth}bb · {solution.action_type}
            {freq && ` · ${freq}%`}
          </p>
        </div>
      </div>

      {/* Description card */}
      {description && (
        <Card className="border-primary/20">
          <CardContent className="p-3">
            <p className="text-sm text-muted-foreground">{description}</p>
          </CardContent>
        </Card>
      )}

      {/* Hand Range Grid */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-semibold">Hand Range Matrix</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center pb-4 px-2 overflow-x-auto">
          <HandRangeGrid rangeData={solution.range_data} />
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-red-500/80" />
          <span>Raise</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-emerald-500/70" />
          <span>Call</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-blue-900/40" />
          <span>Fold</span>
        </div>
      </div>

      {/* Notes */}
      {solution.notes && (
        <Card>
          <CardContent className="p-3">
            <p className="text-xs font-medium text-muted-foreground mb-1">Notes</p>
            <p className="text-sm">{solution.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SpotDetailView;
