
import React from 'react';
import { Table } from '@/types/poker';
import TableDetailsCard from '@/components/poker/TableDetailsCard';

interface TablesListProps {
  tables: Table[];
}

const TablesList: React.FC<TablesListProps> = ({ tables }) => {
  if (!tables || tables.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <h2 className="text-lg font-bold mb-4">Tables Played</h2>
      {tables.map(table => (
        <TableDetailsCard key={table.id} table={table} />
      ))}
    </div>
  );
};

export default TablesList;
