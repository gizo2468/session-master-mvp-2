import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/Lucide';
import PageContainer from '@/components/ui/PageContainer';
import PositionMatrix from '@/components/charts/PositionMatrix';
import SpotDetailView from '@/components/charts/SpotDetailView';
import { useChartCollections, useChartSolutions, type ChartSolution } from '@/hooks/useChartsLibrary';
import { Skeleton } from '@/components/ui/skeleton';

const ChartsLibrary: React.FC = () => {
  const navigate = useNavigate();
  const { data: collections, isLoading: collectionsLoading } = useChartCollections();
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [selectedSolution, setSelectedSolution] = useState<ChartSolution | null>(null);

  // Auto-select first collection
  const activeCollectionId = selectedCollectionId || collections?.[0]?.id || null;
  const activeCollection = collections?.find(c => c.id === activeCollectionId);

  const { data: solutions, isLoading: solutionsLoading } = useChartSolutions(activeCollectionId);

  const isLoading = collectionsLoading || solutionsLoading;

  if (selectedSolution && activeCollection) {
    return (
      <PageContainer>
        <SpotDetailView
          solution={selectedSolution}
          stackDepth={activeCollection.stack_depth_bb}
          onBack={() => setSelectedSolution(null)}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="shrink-0"
          >
            <Icon name="ArrowLeft" className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Charts Library</h1>
            <p className="text-sm text-muted-foreground">GTO Solutions Workspace</p>
          </div>
        </div>

        {/* Collection selector */}
        <div className="flex items-center gap-2">
          <Icon name="Layers" className="h-4 w-4 text-muted-foreground" />
          {collectionsLoading ? (
            <Skeleton className="h-9 w-48" />
          ) : (
            <Select
              value={activeCollectionId || ''}
              onValueChange={setSelectedCollectionId}
            >
              <SelectTrigger className="w-auto min-w-[180px]">
                <SelectValue placeholder="Select collection" />
              </SelectTrigger>
              <SelectContent>
                {collections?.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} ({c.stack_depth_bb}bb)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Matrix */}
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-11 w-full" />
            ))}
          </div>
        ) : solutions && solutions.length > 0 ? (
          <PositionMatrix
            solutions={solutions}
            onSpotClick={setSelectedSolution}
            stackDepth={activeCollection?.stack_depth_bb || 100}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Icon name="LayoutGrid" className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground font-medium">No solutions available</p>
            <p className="text-sm text-muted-foreground/70">Select a collection to browse spots</p>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default ChartsLibrary;
