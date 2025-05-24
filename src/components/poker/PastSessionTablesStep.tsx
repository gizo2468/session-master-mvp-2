import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { TableData } from '@/types/poker';
import PastTableCard from './PastTableCard';
import PastAddTableForm from './PastAddTableForm';

interface SessionInfo {
  startTime: Date;
  endTime: Date;
  isOnline: boolean;
  isMultiDay: boolean;
  location: string;
  notes?: string;
}

interface PastSessionTablesStepProps {
  sessionInfo: SessionInfo;
  tables: TableData[];
  onAddTable: (table: Omit<TableData, 'id' | 'startTime' | 'isActive'>) => void;
  onUpdateTable: (tableId: string, table: TableData) => void;
  onDeleteTable: (tableId: string) => void;
  onSave: () => void;
  onBack: () => void;
}

const PastSessionTablesStep: React.FC<PastSessionTablesStepProps> = ({
  sessionInfo,
  tables,
  onAddTable,
  onUpdateTable,
  onDeleteTable,
  onSave,
  onBack
}) => {
  const [showAddTableForm, setShowAddTableForm] = useState(false);

  const totalProfit = tables.reduce((sum, table) => {
    const tableProfit = (table.cashOut || 0) - table.buyIn;
    return sum + tableProfit;
  }, 0);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Session Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Location:</span>
            <p className="font-medium">{sessionInfo.location}</p>
          </div>
          <div>
            <span className="text-gray-600">Type:</span>
            <p className="font-medium">
              {sessionInfo.isOnline ? 'Online' : 'Live'}
              {sessionInfo.isMultiDay && ' • Multi-Day'}
            </p>
          </div>
          <div>
            <span className="text-gray-600">Tables:</span>
            <p className="font-medium">{tables.length}</p>
          </div>
          <div>
            <span className="text-gray-600">Total P/L:</span>
            <p className={`font-medium ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalProfit >= 0 ? '+' : ''}${totalProfit.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold">Tables</h3>
          <Button 
            onClick={() => setShowAddTableForm(true)}
            variant="poker"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" /> 
            Add Table
          </Button>
        </div>

        {tables.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
            <p>No tables added yet. Click "Add Table" to get started.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tables.map((table) => (
              <PastTableCard
                key={table.id}
                table={table}
                onUpdate={(updatedTable) => onUpdateTable(table.id, updatedTable)}
                onDelete={() => onDeleteTable(table.id)}
              />
            ))}
          </div>
        )}
      </div>

      <PastAddTableForm
        open={showAddTableForm}
        onOpenChange={setShowAddTableForm}
        sessionLocation={sessionInfo.location}
        onSubmit={(tableData) => {
          onAddTable(tableData);
          setShowAddTableForm(false);
        }}
      />

      <div className="flex gap-4 pt-6 border-t">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          Back to Session Info
        </Button>
        <Button 
          onClick={onSave} 
          variant="poker" 
          className="flex-1"
          disabled={tables.length === 0}
        >
          Save Session
        </Button>
      </div>
    </div>
  );
};

export default PastSessionTablesStep;
