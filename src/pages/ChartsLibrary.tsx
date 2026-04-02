import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/Lucide';
import PageContainer from '@/components/ui/PageContainer';
import PositionMatrix from '@/components/charts/PositionMatrix';
import SpotDetailView from '@/components/charts/SpotDetailView';
import CreateCollectionDialog from '@/components/charts/CreateCollectionDialog';
import CreateSolutionSheet from '@/components/charts/CreateSolutionSheet';
import { useChartCollections, useChartSolutions, useDeleteCollection, type ChartSolution } from '@/hooks/useChartsLibrary';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const ChartsLibrary: React.FC = () => {
  const navigate = useNavigate();
  const { data: collections, isLoading: collectionsLoading } = useChartCollections();
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [selectedSolution, setSelectedSolution] = useState<ChartSolution | null>(null);
  const [showCreateCollection, setShowCreateCollection] = useState(false);
  const [showCreateSolution, setShowCreateSolution] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [createSpotPrefill, setCreateSpotPrefill] = useState<{
    hero: string;
    villain: string | null;
    actionType: string;
  } | null>(null);

  const deleteCollection = useDeleteCollection();

  const activeCollectionId = selectedCollectionId || collections?.[0]?.id || null;
  const activeCollection = collections?.find(c => c.id === activeCollectionId);
  const isUserOwned = activeCollection ? !activeCollection.is_default : false;

  const { data: solutions, isLoading: solutionsLoading } = useChartSolutions(activeCollectionId);
  const isLoading = collectionsLoading || solutionsLoading;

  const handleCreateSpot = (heroPos: string, scenario: { actionType: string; villain: string | null }) => {
    setCreateSpotPrefill({ hero: heroPos, villain: scenario.villain, actionType: scenario.actionType });
    setShowCreateSolution(true);
  };

  const handleDeleteCollection = async () => {
    if (!activeCollectionId) return;
    try {
      await deleteCollection.mutateAsync(activeCollectionId);
      setSelectedCollectionId(null);
      toast.success('Collection deleted');
    } catch {
      toast.error('Failed to delete collection');
    }
    setShowDeleteConfirm(false);
  };

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
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
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
            <Select value={activeCollectionId || ''} onValueChange={setSelectedCollectionId}>
              <SelectTrigger className="w-auto min-w-[180px]">
                <SelectValue placeholder="Select collection" />
              </SelectTrigger>
              <SelectContent>
                {collections?.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} ({c.stack_depth_bb}bb){!c.is_default && ' ✦'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button variant="ghost" size="icon" onClick={() => setShowCreateCollection(true)} className="shrink-0">
            <Icon name="Plus" className="h-4 w-4" />
          </Button>
          {isUserOwned && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowDeleteConfirm(true)}
              className="shrink-0 text-destructive hover:text-destructive"
            >
              <Icon name="Trash2" className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Matrix */}
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-11 w-full" />
            ))}
          </div>
        ) : (
          <PositionMatrix
            solutions={solutions || []}
            onSpotClick={setSelectedSolution}
            stackDepth={activeCollection?.stack_depth_bb || 100}
            isUserOwned={isUserOwned}
            onCreateSpot={handleCreateSpot}
          />
        )}
      </div>

      {/* Dialogs */}
      <CreateCollectionDialog
        open={showCreateCollection}
        onOpenChange={setShowCreateCollection}
        onCreated={(id) => setSelectedCollectionId(id)}
      />

      {activeCollectionId && (
        <CreateSolutionSheet
          open={showCreateSolution}
          onOpenChange={setShowCreateSolution}
          collectionId={activeCollectionId}
          prefillHero={createSpotPrefill?.hero}
          prefillVillain={createSpotPrefill?.villain}
          prefillActionType={createSpotPrefill?.actionType}
        />
      )}

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Collection</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{activeCollection?.name}" and all its solutions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCollection} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
};

export default ChartsLibrary;
