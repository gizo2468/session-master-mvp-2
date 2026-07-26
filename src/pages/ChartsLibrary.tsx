import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/Lucide';
import PageContainer from '@/components/ui/PageContainer';
import PositionMatrix from '@/components/charts/PositionMatrix';
import SpotDetailView from '@/components/charts/SpotDetailView';
import CreateCollectionDialog from '@/components/charts/CreateCollectionDialog';
import CreateFolderDialog from '@/components/charts/CreateFolderDialog';
import CreateSolutionSheet from '@/components/charts/CreateSolutionSheet';
import {
  useChartFolders,
  useChartCollections,
  useChartSolutions,
  useDeleteCollection,
  useDeleteFolder,
  type ChartSolution,
  type ChartFolder,
  type ChartCollection,
} from '@/hooks/useChartsLibrary';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
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

type View =
  | { type: 'root' }
  | { type: 'folder'; folder: ChartFolder }
  | { type: 'collection'; collection: ChartCollection }
  | { type: 'spot'; solution: ChartSolution; collection: ChartCollection };

const ChartsLibrary: React.FC = () => {
  const navigate = useNavigate();
  const { data: folders, isLoading: foldersLoading } = useChartFolders();
  const { data: collections, isLoading: collectionsLoading } = useChartCollections();

  const [view, setView] = useState<View>({ type: 'root' });
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showCreateCollection, setShowCreateCollection] = useState(false);
  const [createCollectionFolderId, setCreateCollectionFolderId] = useState<string | null>(null);
  const [showCreateSolution, setShowCreateSolution] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ type: 'folder' | 'collection'; id: string; name: string } | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [createSpotPrefill, setCreateSpotPrefill] = useState<{
    hero: string;
    villain: string | null;
    actionType: string;
  } | null>(null);

  const deleteCollection = useDeleteCollection();
  const deleteFolder = useDeleteFolder();

  const activeCollectionId = view.type === 'collection' ? view.collection.id : view.type === 'spot' ? view.collection.id : null;
  const { data: solutions, isLoading: solutionsLoading } = useChartSolutions(activeCollectionId);

  const isLoading = foldersLoading || collectionsLoading;

  const collectionsInFolder = (folderId: string) =>
    collections?.filter(c => c.folder_id === folderId) || [];

  const unfiledCollections = collections?.filter(c => !c.folder_id) || [];

  const handleCreateSpot = (heroPos: string, scenario: { actionType: string; villain: string | null }) => {
    setCreateSpotPrefill({ hero: heroPos, villain: scenario.villain, actionType: scenario.actionType });
    setShowCreateSolution(true);
  };

  const handleDelete = async () => {
    if (!showDeleteConfirm) return;
    try {
      if (showDeleteConfirm.type === 'folder') {
        await deleteFolder.mutateAsync(showDeleteConfirm.id);
      } else {
        await deleteCollection.mutateAsync(showDeleteConfirm.id);
      }
      setView({ type: 'root' });
    } catch {
      toast.error(`Failed to delete ${showDeleteConfirm.type}`);
    }
    setShowDeleteConfirm(null);
  };

  const handleOpenCreateCollection = (folderId: string | null) => {
    setCreateCollectionFolderId(folderId);
    setShowCreateCollection(true);
  };

  // ── Spot detail view ──
  if (view.type === 'spot') {
    return (
      <PageContainer>
        <SpotDetailView
          solution={view.solution}
          stackDepth={view.collection.stack_depth_bb}
          onBack={() => setView({ type: 'collection', collection: view.collection })}
        />
      </PageContainer>
    );
  }

  // ── Collection / matrix view ──
  if (view.type === 'collection') {
    const col = view.collection;
    return (
      <PageContainer>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => {
              const parentFolder = folders?.find(f => f.id === col.folder_id);
              setView(parentFolder ? { type: 'folder', folder: parentFolder } : { type: 'root' });
            }} className="shrink-0">
              <Icon name="ArrowLeft" className="h-5 w-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold truncate">{col.name}</h1>
              <p className="text-sm text-muted-foreground">{col.stack_depth_bb}bb · {col.game_type}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowDeleteConfirm({ type: 'collection', id: col.id, name: col.name })}
              className="shrink-0 text-destructive hover:text-destructive"
            >
              <Icon name="Trash2" className="h-4 w-4" />
            </Button>
          </div>

          {solutionsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-11 w-full" />
              ))}
            </div>
          ) : (
            <PositionMatrix
              solutions={solutions || []}
              onSpotClick={(sol) => setView({ type: 'spot', solution: sol, collection: col })}
              stackDepth={col.stack_depth_bb}
              isUserOwned={true}
              onCreateSpot={handleCreateSpot}
            />
          )}
        </div>

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

        <AlertDialog open={!!showDeleteConfirm} onOpenChange={(open) => !open && setShowDeleteConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Collection</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete "{showDeleteConfirm?.name}" and all its solutions.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </PageContainer>
    );
  }

  // ── Folder view ──
  if (view.type === 'folder') {
    const folder = view.folder;
    const folderCollections = collectionsInFolder(folder.id);

    return (
      <PageContainer>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setView({ type: 'root' })} className="shrink-0">
              <Icon name="ArrowLeft" className="h-5 w-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold truncate">{folder.name}</h1>
              <p className="text-sm text-muted-foreground">{folderCollections.length} collection{folderCollections.length !== 1 ? 's' : ''}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowDeleteConfirm({ type: 'folder', id: folder.id, name: folder.name })}
              className="shrink-0 text-destructive hover:text-destructive"
            >
              <Icon name="Trash2" className="h-4 w-4" />
            </Button>
          </div>

          {folderCollections.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                <Icon name="Layers" className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground mb-3">No collections in this folder yet</p>
                <Button variant="outline" size="sm" onClick={() => handleOpenCreateCollection(folder.id)}>
                  <Icon name="Plus" className="h-4 w-4 mr-1" />
                  New Collection
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {folderCollections.map(col => (
                <Card
                  key={col.id}
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => setView({ type: 'collection', collection: col })}
                >
                  <CardContent className="flex items-center gap-3 p-4">
                    <Icon name="Grid3X3" className="h-5 w-5 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{col.name}</p>
                      <p className="text-xs text-muted-foreground">{col.stack_depth_bb}bb · {col.game_type}</p>
                    </div>
                    <Icon name="ChevronRight" className="h-4 w-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              ))}
              <Button variant="outline" size="sm" className="w-full" onClick={() => handleOpenCreateCollection(folder.id)}>
                <Icon name="Plus" className="h-4 w-4 mr-1" />
                New Collection
              </Button>
            </div>
          )}
        </div>

        <CreateCollectionDialog
          open={showCreateCollection}
          onOpenChange={setShowCreateCollection}
          folderId={createCollectionFolderId}
          onCreated={(id) => {
            const col = collections?.find(c => c.id === id);
            if (col) setView({ type: 'collection', collection: col });
          }}
        />

        <AlertDialog open={!!showDeleteConfirm} onOpenChange={(open) => !open && setShowDeleteConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Folder</AlertDialogTitle>
              <AlertDialogDescription>
                This will delete the folder "{showDeleteConfirm?.name}". Collections inside will become unfiled.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </PageContainer>
    );
  }

  // ── Root workspace view ──
  const isEmpty = !isLoading && (!folders || folders.length === 0) && (!collections || collections.length === 0);

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
          <Button variant="ghost" size="icon" onClick={() => setShowHelp(true)} className="shrink-0 rounded-full h-8 w-8">
            <Icon name="Info" className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowCreateFolder(true)}>
            <Icon name="FolderPlus" className="h-4 w-4 mr-1" />
            New Folder
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleOpenCreateCollection(null)}>
            <Icon name="Plus" className="h-4 w-4 mr-1" />
            New Collection
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : isEmpty ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Icon name="BookOpen" className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="font-semibold text-lg mb-1">No charts yet</h3>
              <p className="text-sm text-muted-foreground mb-5 max-w-[260px]">
                Create your first folder or collection to start building your GTO workspace.
              </p>
              <div className="flex gap-2">
                <Button variant="default" size="sm" onClick={() => setShowCreateFolder(true)}>
                  <Icon name="FolderPlus" className="h-4 w-4 mr-1" />
                  Create Folder
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {/* Folders */}
            {folders?.map(folder => {
              const count = collectionsInFolder(folder.id).length;
              return (
                <Card
                  key={folder.id}
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => setView({ type: 'folder', folder })}
                >
                  <CardContent className="flex items-center gap-3 p-4">
                    <Icon name="Folder" className="h-5 w-5 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{folder.name}</p>
                      <p className="text-xs text-muted-foreground">{count} collection{count !== 1 ? 's' : ''}</p>
                    </div>
                    <Icon name="ChevronRight" className="h-4 w-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              );
            })}

            {/* Unfiled collections */}
            {unfiledCollections.length > 0 && (
              <>
                {(folders?.length ?? 0) > 0 && (
                  <p className="text-xs text-muted-foreground font-medium pt-2 px-1">Unfiled</p>
                )}
                {unfiledCollections.map(col => (
                  <Card
                    key={col.id}
                    className="cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => setView({ type: 'collection', collection: col })}
                  >
                    <CardContent className="flex items-center gap-3 p-4">
                      <Icon name="Grid3X3" className="h-5 w-5 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{col.name}</p>
                        <p className="text-xs text-muted-foreground">{col.stack_depth_bb}bb · {col.game_type}</p>
                      </div>
                      <Icon name="ChevronRight" className="h-4 w-4 text-muted-foreground" />
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <CreateFolderDialog open={showCreateFolder} onOpenChange={setShowCreateFolder} />

      <CreateCollectionDialog
        open={showCreateCollection}
        onOpenChange={setShowCreateCollection}
        folderId={createCollectionFolderId}
        onCreated={(id) => {
          const col = collections?.find(c => c.id === id);
          if (col) setView({ type: 'collection', collection: col });
        }}
      />

      {/* Help dialog */}
      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent className="max-w-sm max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Charts Terminology</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-semibold text-foreground">RFI</p>
              <p className="text-muted-foreground">Raise First In — opening the pot with a raise when no one has entered yet.</p>
            </div>
            <div>
              <p className="font-semibold text-foreground">Table Positions</p>
              <p className="text-muted-foreground"><span className="font-medium text-foreground">UTG</span> (Under the Gun), <span className="font-medium text-foreground">MP</span> (Middle Position), <span className="font-medium text-foreground">LJ</span> (Lojack), <span className="font-medium text-foreground">HJ</span> (Hijack), <span className="font-medium text-foreground">CO</span> (Cutoff), <span className="font-medium text-foreground">BU</span> (Button), <span className="font-medium text-foreground">SB</span> (Small Blind), <span className="font-medium text-foreground">BB</span> (Big Blind) — ordered from earliest to latest position.</p>
            </div>
            <div>
              <p className="font-semibold text-foreground">vs UTG / vs MP / vs CO…</p>
              <p className="text-muted-foreground">How you should respond when a player in that position raised before you.</p>
            </div>
            <div>
              <p className="font-semibold text-foreground">3Bet vs …</p>
              <p className="text-muted-foreground">Re-raising against an opener from that position. A 3Bet is the second raise preflop.</p>
            </div>
            <div>
              <p className="font-semibold text-foreground">Percentages</p>
              <p className="text-muted-foreground">The portion of all possible starting hands included in a range. Higher % = wider range.</p>
            </div>
            <div>
              <p className="font-semibold text-foreground">Grid Colors</p>
              <p className="text-muted-foreground"><span className="text-red-500 font-medium">Red</span> = Raise, <span className="text-green-500 font-medium">Green</span> = Call, <span className="text-blue-400 font-medium">Blue</span> = Fold. Each cell shows the recommended action for that hand.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
};

export default ChartsLibrary;
