import React from 'react';
import { cn } from '@/lib/utils';

interface FilterChipProps {
  label: string;
  selected: boolean;
  onClick: () => void;
  className?: string;
}

export const FilterChip: React.FC<FilterChipProps> = ({
  label,
  selected,
  onClick,
  className
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 text-sm rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50',
        selected 
          ? 'bg-primary text-primary-foreground border-primary' 
          : 'bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground',
        className
      )}
    >
      {label}
    </button>
  );
};