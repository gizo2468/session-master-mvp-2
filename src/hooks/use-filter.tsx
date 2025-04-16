
import { useState, useMemo } from 'react';
import { SessionFilter } from '@/types/poker';

interface FilterOption {
  key: string;
  options: string[];
}

interface UseFilterProps<T> {
  items: T[];
  filterOptions: FilterOption[];
  customFilter?: (item: T, filters: Record<string, string>) => boolean;
}

export function useFilter<T>({ 
  items, 
  filterOptions,
  customFilter 
}: UseFilterProps<T>) {
  const [filters, setFilters] = useState<Record<string, string>>({});

  // Initialize default filters
  useState(() => {
    const defaultFilters: Record<string, string> = {};
    filterOptions.forEach(option => {
      defaultFilters[option.key] = option.options[0];
    });
    setFilters(defaultFilters);
  });

  const filteredItems = useMemo(() => {
    if (!items) return [];
    
    return items.filter(item => {
      if (customFilter) {
        return customFilter(item, filters);
      }
      
      // Default filter implementation if custom filter not provided
      return true;
    });
  }, [items, filters, customFilter]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return { filters, filteredItems, handleFilterChange };
}
