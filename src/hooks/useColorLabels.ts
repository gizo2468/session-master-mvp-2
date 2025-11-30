import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SELECTABLE_COLORS, PlayerColor } from '@/components/notes/playerColors';

interface ColorLabel {
  id: string;
  user_id: string;
  color_id: string;
  custom_label: string;
}

export function useColorLabels() {
  const queryClient = useQueryClient();

  const { data: customLabels = [], isLoading } = useQuery({
    queryKey: ['color-labels'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_color_labels')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching color labels:', error);
        return [];
      }

      return data as ColorLabel[];
    },
  });

  const updateLabelMutation = useMutation({
    mutationFn: async ({ colorId, label }: { colorId: string; label: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_color_labels')
        .upsert({
          user_id: user.id,
          color_id: colorId,
          custom_label: label,
        }, {
          onConflict: 'user_id,color_id',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['color-labels'] });
    },
  });

  const deleteLabelMutation = useMutation({
    mutationFn: async (colorId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_color_labels')
        .delete()
        .eq('user_id', user.id)
        .eq('color_id', colorId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['color-labels'] });
    },
  });

  // Get the label for a color (custom if exists, otherwise default)
  const getLabel = (colorId: string): string => {
    const customLabel = customLabels.find(l => l.color_id === colorId);
    if (customLabel) return customLabel.custom_label;
    
    const defaultColor = SELECTABLE_COLORS.find(c => c.id === colorId);
    return defaultColor?.label || colorId;
  };

  // Get colors with merged labels
  const getColorsWithLabels = (): (PlayerColor & { customLabel?: string })[] => {
    return SELECTABLE_COLORS.map(color => {
      const customLabel = customLabels.find(l => l.color_id === color.id);
      return {
        ...color,
        customLabel: customLabel?.custom_label,
      };
    });
  };

  return {
    customLabels,
    isLoading,
    getLabel,
    getColorsWithLabels,
    updateLabel: updateLabelMutation.mutate,
    deleteLabel: deleteLabelMutation.mutate,
    isUpdating: updateLabelMutation.isPending,
  };
}
