import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export interface ChartCollection {
  id: string;
  name: string;
  stack_depth_bb: number;
  game_type: string;
  is_default: boolean;
  user_id: string | null;
}

export interface ChartSolution {
  id: string;
  collection_id: string;
  hero_position: string;
  villain_position: string | null;
  action_type: string;
  spot_label: string;
  range_data: Record<string, any>;
  notes: string | null;
  is_default: boolean;
  user_id: string | null;
}

export function useChartCollections() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['chart-collections', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chart_collections' as any)
        .select('*')
        .or(`is_default.eq.true,user_id.eq.${user?.id}`)
        .order('stack_depth_bb', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as ChartCollection[];
    },
    enabled: !!user,
  });
}

export function useChartSolutions(collectionId: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['chart-solutions', collectionId, user?.id],
    queryFn: async () => {
      if (!collectionId) return [];

      const { data, error } = await supabase
        .from('chart_solutions' as any)
        .select('*')
        .eq('collection_id', collectionId)
        .or(`is_default.eq.true,user_id.eq.${user?.id}`)
        .order('hero_position');

      if (error) throw error;
      return (data || []) as unknown as ChartSolution[];
    },
    enabled: !!user && !!collectionId,
  });
}

export function useChartSolution(solutionId: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['chart-solution', solutionId],
    queryFn: async () => {
      if (!solutionId) return null;

      const { data, error } = await supabase
        .from('chart_solutions' as any)
        .select('*')
        .eq('id', solutionId)
        .single();

      if (error) throw error;
      return data as unknown as ChartSolution;
    },
    enabled: !!user && !!solutionId,
  });
}

export function useCreateCollection() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { name: string; stack_depth_bb: number; game_type: string }) => {
      const { data, error } = await supabase
        .from('chart_collections' as any)
        .insert({
          name: params.name,
          stack_depth_bb: params.stack_depth_bb,
          game_type: params.game_type,
          user_id: user?.id,
          is_default: false,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as ChartCollection;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chart-collections'] });
    },
  });
}

export function useCreateSolution() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      collection_id: string;
      hero_position: string;
      villain_position: string | null;
      action_type: string;
      spot_label: string;
      range_data: Record<string, string>;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('chart_solutions' as any)
        .insert({
          collection_id: params.collection_id,
          hero_position: params.hero_position,
          villain_position: params.villain_position,
          action_type: params.action_type,
          spot_label: params.spot_label,
          range_data: params.range_data,
          notes: params.notes || null,
          user_id: user?.id,
          is_default: false,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as ChartSolution;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chart-solutions', variables.collection_id] });
    },
  });
}

export function useDeleteSolution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: string; collection_id: string }) => {
      const { error } = await supabase
        .from('chart_solutions' as any)
        .delete()
        .eq('id', params.id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chart-solutions', variables.collection_id] });
    },
  });
}

export function useDeleteCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Delete all solutions in the collection first
      await supabase
        .from('chart_solutions' as any)
        .delete()
        .eq('collection_id', id);

      const { error } = await supabase
        .from('chart_collections' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chart-collections'] });
      queryClient.invalidateQueries({ queryKey: ['chart-solutions'] });
    },
  });
}

// Position ordering for the matrix
export const POSITIONS = ['UTG', 'MP', 'LJ', 'HJ', 'CO', 'BU', 'SB', 'BB'] as const;
export type Position = typeof POSITIONS[number];

// Card ranks for the 13x13 hand range grid
export const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'] as const;

// Helper to get hand label from grid coordinates
export function getHandLabel(row: number, col: number): string {
  if (row === col) return `${RANKS[row]}${RANKS[col]}`;
  if (col > row) return `${RANKS[row]}${RANKS[col]}s`;
  return `${RANKS[col]}${RANKS[row]}o`;
}

// Helper to determine hand type
export function getHandType(row: number, col: number): 'pair' | 'suited' | 'offsuit' {
  if (row === col) return 'pair';
  if (col > row) return 'suited';
  return 'offsuit';
}

// Action types
export const ACTION_TYPES = [
  { value: 'RFI', label: 'RFI (Raise First In)' },
  { value: 'DEFEND', label: 'Defend vs Raise' },
  { value: '3BET', label: '3-Bet' },
] as const;
