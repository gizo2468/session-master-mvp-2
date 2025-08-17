
import React from 'react';
import { PokerSession, TableData, HandData } from '@/types/poker';
import TableSelectionModal from './TableSelectionModal';
import EditTableForm from './EditTableForm';
import AddTableForm from './AddTableForm';

interface SessionModalsProps {
  session: PokerSession;
  showDeleteModal: boolean;
  showEndSessionModal: boolean;
  showTableSelection: boolean;
  showEditTable: boolean;
  showAddTable?: boolean;
  selectedTable: TableData | null;
  cashOutAmount: string;
  onDeleteModalClose: () => void;
  onEndSessionModalClose: () => void;
  onTableSelectionClose: () => void;
  onEditTableClose: () => void;
  onAddTableClose?: () => void;
  onTableSelect: (table: TableData) => void;
  onTableUpdate: (table: TableData) => void;
  onAddTable?: (tableData: Omit<TableData, 'id' | 'startTime' | 'isActive'>) => void;
  onAddTableButtonClick?: () => void;
  onDeleteTable?: (tableId: string) => void;
  onDelete: () => void;
  onEndSession: () => void;
  onCashOutAmountChange: (amount: string) => void;
  onNotesChange: (notes: string) => void;
  onAddHand?: (tableId: string, hand: Omit<HandData, 'id' | 'createdAt' | 'tableId'>) => void;
  onEditHand?: (tableId: string, hand: HandData) => void;
  onDeleteHand?: (tableId: string, handId: string) => void;
}

const SessionModals: React.FC<SessionModalsProps> = ({
  session,
  showDeleteModal,
  showEndSessionModal,
  showTableSelection,
  showEditTable,
  showAddTable,
  selectedTable,
  cashOutAmount,
  onDeleteModalClose,
  onEndSessionModalClose,
  onTableSelectionClose,
  onEditTableClose,
  onAddTableClose,
  onTableSelect,
  onTableUpdate,
  onAddTable,
  onAddTableButtonClick,
  onDeleteTable,
  onDelete,
  onEndSession,
  onCashOutAmountChange,
  onNotesChange,
  onAddHand,
  onEditHand,
  onDeleteHand
}) => {
  return (
    <>
      {/* Table Selection Modal */}
      <TableSelectionModal
        open={showTableSelection}
        onOpenChange={onTableSelectionClose}
        tables={session.tables || []}
        onSelectTable={onTableSelect}
        onAddTable={onAddTableButtonClick}
        onDeleteTable={onDeleteTable}
        onAddHand={onAddHand}
        onEditHand={onEditHand}
        onDeleteHand={onDeleteHand}
      />

      {/* Add Table Modal */}
      {showAddTable && onAddTable && onAddTableClose && (
        <AddTableForm
          open={showAddTable}
          onOpenChange={onAddTableClose}
          onAddTable={onAddTable}
          sessionFormat={session.format === 'Tournament' || session.format?.includes('Tournament') ? 'Tournament' : 'Cash'}
          isCompletedSession={!session.isActive}
        />
      )}

      {/* Edit Table Modal */}
      {selectedTable && (
        <EditTableForm
          open={showEditTable}
          onOpenChange={onEditTableClose}
          table={selectedTable}
          onSave={onTableUpdate}
        />
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Delete Session</h2>
            <p className="mb-6">Are you sure you want to delete this session? This action cannot be undone.</p>
            
            <div className="flex gap-4">
              <button
                onClick={onDelete}
                className="flex-1 py-2 px-4 bg-poker-red hover:bg-red-700 text-white font-bold rounded-md"
              >
                Delete
              </button>
              
              <button
                onClick={onDeleteModalClose}
                className="flex-1 py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-md"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* End Session Modal - Only show for active sessions */}
      {showEndSessionModal && session.isActive && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">End Session</h2>
            <p className="mb-4">Please enter your cash out amount:</p>
            
            <div className="mb-6">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <span className="text-gray-500">$</span>
                </div>
                <input
                  type="number"
                  placeholder="0.00"
                  className="w-full p-3 pl-8 border border-gray-300 rounded-md"
                  value={cashOutAmount}
                  onChange={(e) => onCashOutAmountChange(e.target.value)}
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 mb-2" htmlFor="notes">Session Notes</label>
              <textarea
                id="notes"
                placeholder="How did your session go? Note any significant hands, reads, or things to improve..."
                className="w-full p-3 border border-gray-300 rounded-md min-h-[100px]"
                value={session.notes || ''}
                onChange={(e) => onNotesChange(e.target.value)}
              ></textarea>
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={onEndSession}
                className="flex-1 py-2 px-4 bg-poker-gold hover:bg-poker-darkGold text-white font-bold rounded-md"
                disabled={!cashOutAmount}
              >
                End Session
              </button>
              
              <button
                onClick={onEndSessionModalClose}
                className="flex-1 py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-md"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SessionModals;
