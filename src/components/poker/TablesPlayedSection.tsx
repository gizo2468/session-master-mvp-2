import React, { useState, useMemo } from 'react';
import { TableData } from '@/types/poker';
import { TableFilters, TableFiltersState, defaultFilters } from './TableFilters';
import TableDetailsCard from './TableDetailsCard';

interface TablesPlayedSectionProps {
  tables: TableData[];
  sessionCurrency?: string;
}

export const TablesPlayedSection: React.FC<TablesPlayedSectionProps> = ({
  tables,
  sessionCurrency
}) => {
  const [filters, setFilters] = useState<TableFiltersState>(defaultFilters);

  const filteredAndSortedTables = useMemo(() => {
    let filtered = [...tables];

    // Apply game format filter
    if (filters.gameFormat !== 'all') {
      filtered = filtered.filter(table => table.format === filters.gameFormat);
    }

    // Apply game type filter
    if (filters.gameType !== 'all') {
      filtered = filtered.filter(table => table.gameType === filters.gameType);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (filters.sortBy) {
        case 'startTime':
          comparison = new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
          break;
        
        case 'buyIn':
          comparison = (a.buyIn || 0) - (b.buyIn || 0);
          break;
        
        case 'duration':
          const aDuration = a.endTime && a.startTime 
            ? new Date(a.endTime).getTime() - new Date(a.startTime).getTime() 
            : 0;
          const bDuration = b.endTime && b.startTime 
            ? new Date(b.endTime).getTime() - new Date(b.startTime).getTime() 
            : 0;
          comparison = aDuration - bDuration;
          break;
        
        case 'result':
          const aResult = (a.cashOut || 0) - (a.buyIn || 0);
          const bResult = (b.cashOut || 0) - (b.buyIn || 0);
          comparison = aResult - bResult;
          break;
        
        default:
          comparison = 0;
      }

      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [tables, filters]);

  if (!tables || tables.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <h2 className="text-lg font-bold mb-4 session-summary-title">Tables Played</h2>
      
      <TableFilters
        filters={filters}
        onFiltersChange={setFilters}
        totalTables={tables.length}
        filteredCount={filteredAndSortedTables.length}
      />
      
      {filteredAndSortedTables.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No tables match the selected filters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAndSortedTables.map(table => (
          <TableDetailsCard 
            key={table.id} 
            table={table} 
            sessionCurrency={table.currency || sessionCurrency}
          />
          ))}
        </div>
      )}
    </div>
  );
};