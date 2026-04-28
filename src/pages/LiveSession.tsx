import React, { useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import SessionTimerCard from '@/components/poker/SessionTimerCard';
import SessionDetailsCard from '@/components/poker/SessionDetailsCard';
import AddTableForm from '@/components/poker/AddTableForm';
import EndSessionSheet from '@/components/poker/EndSessionSheet';
import RebuyConfirmationDialog from '@/components/poker/RebuyConfirmationDialog';
import EndTableDialog from '@/components/poker/EndTableDialog';
import LiveSessionHeader from '@/components/poker/LiveSessionHeader';
import LiveSessionTables from '@/components/poker/LiveSessionTables';
import { useSessionLoader } from '@/hooks/useSessionLoader';
import { useSessionActions } from '@/hooks/useSessionActions';
import { useRebuyActions } from '@/hooks/useRebuyActions';
import { useEndTableActions } from '@/hooks/useEndTableActions';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import OnboardingTour from '@/components/onboarding/OnboardingTour';
import { TOUR_PATHS } from '@/components/onboarding/tourSteps';
import { useOnboardingTour } from '@/hooks/useOnboardingTour';

export default function LiveSession() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if navigated from stack_check notification to auto-open BB/Stack modal
  const shouldOpenBBStackModal = location.state?.openBBStackModal === true;
  
  const { currentSession, isLoadingSession, loadingError } = useSessionLoader(id);
  const sessionActions = useSessionActions(currentSession);
  const rebuyActions = useRebuyActions(currentSession?.id);
  const endTableActions = useEndTableActions(currentSession);

  const {
    shouldShow: showOnboardingTour,
    currentStep: tourStep,
    activePath: tourPath,
    setStep: setTourStep,
    selectPath: selectTourPath,
    returnToMenu: returnToTourMenu,
    dismiss: dismissOnboardingTour,
  } = useOnboardingTour();
  const tourSteps = tourPath ? TOUR_PATHS[tourPath] : [];
  const isLiveTourStep =
    tourPath === 'start-session' && tourSteps[tourStep]?.route === '/session';

  // Scroll to top when component mounts and clear navigation state
  useEffect(() => {
    window.scrollTo(0, 0);
    
    // Clear the navigation state after reading it to prevent re-opening on refresh
    if (location.state?.openBBStackModal) {
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.pathname, location.state, navigate]);
  
  // Loading state with better error handling
  if (isLoadingSession) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-poker-feltGreen mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 dark:text-gray-500">Loading session...</p>
        </div>
      </div>
    );
  }
  
  // Error state - only show if there's a real error AND no session data
  if (loadingError && !currentSession) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-background flex flex-col items-center justify-center p-4">
        <div className="bg-white dark:bg-card rounded-lg shadow-md dark:shadow-black/30 p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-600">Session Error</h1>
          <p className="text-gray-600 dark:text-gray-400 dark:text-gray-500 mb-6">{loadingError}</p>
          <div className="flex gap-2">
            <Button 
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
            >
              Retry
            </Button>
            <Button 
              onClick={() => navigate('/')}
              className="bg-poker-gold hover:bg-poker-darkGold text-white flex-1"
            >
              Return to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  // No session found state
  if (!currentSession) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-background flex flex-col items-center justify-center p-4">
        <div className="bg-white dark:bg-card rounded-lg shadow-md dark:shadow-black/30 p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4">No Active Session</h1>
          <p className="text-gray-600 dark:text-gray-400 dark:text-gray-500 mb-6">There is no active poker session at the moment.</p>
          <Button 
            onClick={() => navigate('/')}
            className="bg-poker-gold hover:bg-poker-darkGold text-white"
          >
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  // Validate session data before rendering components
  if (!currentSession.startTime || !currentSession.gameType || !currentSession.format) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-background flex flex-col items-center justify-center p-4">
        <div className="bg-white dark:bg-card rounded-lg shadow-md dark:shadow-black/30 p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-600">Invalid Session Data</h1>
          <p className="text-gray-600 dark:text-gray-400 dark:text-gray-500 mb-6">The session data appears to be corrupted or incomplete.</p>
          <Button 
            onClick={() => navigate('/')}
            className="bg-poker-gold hover:bg-poker-darkGold text-white"
          >
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  // Map session format to AddTableForm format
  const getTableFormat = (sessionFormat: string): 'Cash' | 'Tournament' => {
    if (sessionFormat.includes('Tournament')) return 'Tournament';
    return 'Cash';
  };

  // Debug logging for tables
  console.log('🔍 LiveSession render:', {
    sessionId: currentSession.id,
    totalTables: currentSession.tables?.length || 0,
    activeTables: currentSession.tables?.filter(table => table.isActive).length || 0,
    tables: currentSession.tables
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background flex flex-col">
      <LiveSessionHeader />
      
      <main className="flex-1 pt-4">
        <div className="container mx-auto max-w-md px-4 pb-8">
          <SessionTimerCard 
            startTime={currentSession.startTime}
            startTimeUTC={currentSession.startTimeUTC}
            gameType={currentSession.gameType}
            format={currentSession.format}
            smallBlind={currentSession.smallBlind}
            bigBlind={currentSession.bigBlind}
            currency={currentSession.currency}
            sessionId={currentSession.id}
            onEndSession={() => sessionActions.setShowEndSessionSheet(true)}
            onAddTable={() => sessionActions.setShowAddTableForm(true)}
            onBBStackUpdate={() => {
              // Force re-render of table cards to refresh blind history
              window.dispatchEvent(new CustomEvent('refreshBlindHistory'));
            }}
            activeTables={currentSession.tables?.filter(table => table.isActive) || []}
            autoOpenBBStackModal={shouldOpenBBStackModal}
          />
          
          <SessionDetailsCard 
            session={{
              ...currentSession,
              location: currentSession.tableName || currentSession.location
            }}
          />
          
          <LiveSessionTables
            currentSession={currentSession}
            onEndTable={sessionActions.handleEndTable}
            onAddTableRebuy={sessionActions.handleAddTableRebuy}
          />
        </div>
      </main>
      
      <EndSessionSheet
        open={sessionActions.showEndSessionSheet}
        onOpenChange={sessionActions.setShowEndSessionSheet}
        session={currentSession}
        autoCashOutAmount={sessionActions.autoCashOutAmount}
        sessionNotes={sessionActions.sessionNotes}
        onSessionNotesChange={sessionActions.setSessionNotes}
        onEndSession={sessionActions.handleEndSession}
        currency={currentSession.currency}
        onCustomDurationChange={sessionActions.handleCustomDurationChange}
      />
      
      <RebuyConfirmationDialog
        open={rebuyActions.showRebuyConfirmDialog}
        onOpenChange={rebuyActions.setShowRebuyConfirmDialog}
        amount={rebuyActions.pendingRebuyAmount}
        onConfirm={rebuyActions.handleConfirmRebuy}
        onCancel={rebuyActions.handleCancelRebuy}
      />
      
      <EndTableDialog
        open={endTableActions.showEndTableDialog}
        onOpenChange={endTableActions.setShowEndTableDialog}
        table={endTableActions.pendingTable}
        cashOutAmount={endTableActions.cashOutAmount}
        onCashOutAmountChange={endTableActions.setCashOutAmount}
        tableNotes={endTableActions.tableNotes}
        onTableNotesChange={endTableActions.setTableNotes}
        bountyCount={endTableActions.bountyCount}
        onBountyCountChange={endTableActions.setBountyCount}
        bountyAmount={endTableActions.bountyAmount}
        onBountyAmountChange={endTableActions.setBountyAmount}
        finalPosition={endTableActions.finalPosition}
        onFinalPositionChange={endTableActions.setFinalPosition}
        endReason={endTableActions.endReason}
        onEndReasonChange={endTableActions.setEndReason}
        nextDayStart={endTableActions.nextDayStart}
        onNextDayStartChange={endTableActions.setNextDayStart}
        chipsCarryover={endTableActions.chipsCarryover}
        onChipsCarryoverChange={endTableActions.setChipsCarryover}
        onConfirm={endTableActions.handleConfirmEndTable}
        onCancel={endTableActions.resetEndTableStates}
        currency={currentSession.currency}
      />
      
      <AddTableForm
        open={sessionActions.showAddTableForm}
        onOpenChange={sessionActions.setShowAddTableForm}
        sessionFormat={getTableFormat(currentSession.format)}
        sessionCurrency={currentSession.currency}
        onAddTable={sessionActions.handleAddTable}
      />

      {showOnboardingTour && isLiveTourStep && (
        <OnboardingTour
          steps={tourSteps}
          currentStep={tourStep}
          onStepChange={setTourStep}
          onClose={dismissOnboardingTour}
          activePath={tourPath}
          onSelectPath={selectTourPath}
          onReturnToMenu={returnToTourMenu}
        />
      )}
    </div>
  );
}
