import React, { useState, useEffect } from 'react';
import { Control, useController } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { supabase } from '@/integrations/supabase/client';
import { X, Search, Plus } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

interface OpponentProfile {
  id: string;
  nickname: string;
  image_url: string | null;
  color: string | null;
}

interface OpponentLinkSectionProps {
  control: Control<any>;
}

const OpponentLinkSection: React.FC<OpponentLinkSectionProps> = ({ control }) => {
  const [opponents, setOpponents] = useState<OpponentProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  // Use controller to get/set array of opponent IDs
  const { field } = useController({
    control,
    name: 'opponentProfileIds',
    defaultValue: [],
  });

  const selectedIds: string[] = field.value || [];

  useEffect(() => {
    fetchOpponents();
  }, []);

  const fetchOpponents = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('opponent_profiles')
        .select('id, nickname, image_url, color')
        .eq('user_id', user.id)
        .order('nickname');

      if (error) throw error;
      setOpponents(data || []);
    } catch (error) {
      console.error('Error fetching opponents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddOpponent = (opponentId: string) => {
    if (!selectedIds.includes(opponentId)) {
      field.onChange([...selectedIds, opponentId]);
    }
    setOpen(false);
  };

  const handleRemoveOpponent = (opponentId: string) => {
    field.onChange(selectedIds.filter(id => id !== opponentId));
  };

  const selectedOpponents = opponents.filter(opp => selectedIds.includes(opp.id));
  const availableOpponents = opponents.filter(opp => !selectedIds.includes(opp.id));

  return (
    <FormItem>
      <FormLabel className="text-sm font-medium">Link to Opponent (Optional)</FormLabel>
      <FormControl>
        <div className="space-y-2">
          {/* Selected opponents list */}
          {selectedOpponents.length > 0 && (
            <div className="space-y-2">
              {selectedOpponents.map((opponent) => (
                <div 
                  key={opponent.id}
                  className="flex items-center gap-2 p-2 border rounded-md bg-muted/30"
                >
                  <div
                    className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-medium"
                    style={{ backgroundColor: opponent.color || '#ffffff' }}
                  >
                    {opponent.image_url ? (
                      <img
                        src={opponent.image_url}
                        alt={opponent.nickname}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-600">
                        {opponent.nickname.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className="flex-1 font-medium">{opponent.nickname}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveOpponent(opponent.id)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Add opponent button/dropdown */}
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between text-muted-foreground"
              >
                <div className="flex items-center gap-2">
                  {selectedOpponents.length > 0 ? (
                    <>
                      <Plus className="h-4 w-4" />
                      Add another opponent...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4" />
                      Select opponent from My Notes...
                    </>
                  )}
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput placeholder="Search opponents..." />
                <CommandList>
                  <CommandEmpty>
                    {loading ? 'Loading...' : availableOpponents.length === 0 
                      ? (opponents.length === 0 ? 'No opponents found in My Notes' : 'All opponents already added')
                      : 'No matching opponents'}
                  </CommandEmpty>
                  <CommandGroup>
                    {availableOpponents.map((opponent) => (
                      <CommandItem
                        key={opponent.id}
                        value={opponent.nickname}
                        onSelect={() => handleAddOpponent(opponent.id)}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <div
                          className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-medium"
                          style={{ backgroundColor: opponent.color || '#ffffff' }}
                        >
                          {opponent.image_url ? (
                            <img
                              src={opponent.image_url}
                              alt={opponent.nickname}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-gray-600">
                              {opponent.nickname.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <span>{opponent.nickname}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </FormControl>
    </FormItem>
  );
};

export default OpponentLinkSection;