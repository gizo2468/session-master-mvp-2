import React, { useState, useEffect, useRef } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { User, Plus } from 'lucide-react';
import { SELECTABLE_COLORS, PlayerColorId } from './playerColors';

interface OpponentProfile {
  id: string;
  nickname: string;
  image_url: string | null;
  color: string | null;
}

interface OpponentAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelectProfile: (profile: OpponentProfile) => void;
  disabled?: boolean;
  placeholder?: string;
}

const OpponentAutocomplete: React.FC<OpponentAutocompleteProps> = ({
  value,
  onChange,
  onSelectProfile,
  disabled = false,
  placeholder = "Enter player nickname...",
}) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [profiles, setProfiles] = useState<OpponentProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  // Safari autofill workaround - start readonly then enable on focus
  const [isReadOnly, setIsReadOnly] = useState(true);

  // Fetch existing opponent profiles when component mounts or user changes
  useEffect(() => {
    const fetchProfiles = async () => {
      if (!user?.id) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('opponent_profiles')
          .select('id, nickname, image_url, color')
          .eq('user_id', user.id)
          .order('nickname', { ascending: true });

        if (error) throw error;
        setProfiles(data || []);
      } catch (error) {
        console.error('Error fetching opponent profiles:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfiles();
  }, [user?.id]);

  // Filter profiles based on input value
  const filteredProfiles = profiles.filter((profile) =>
    profile.nickname.toLowerCase().includes(value.toLowerCase().trim())
  );

  // Check if current input matches an existing profile exactly
  const exactMatch = profiles.find(
    (p) => p.nickname.toLowerCase() === value.toLowerCase().trim()
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    if (!open && e.target.value.length > 0) {
      setOpen(true);
    }
  };

  const handleFocus = () => {
    // Safari autofill workaround - remove readonly on first focus
    if (isReadOnly) {
      setIsReadOnly(false);
      setTimeout(() => inputRef.current?.focus(), 10);
      return;
    }
    if (value.length > 0) {
      setOpen(true);
    }
  };

  const handleSelectProfile = (profile: OpponentProfile) => {
    onChange(profile.nickname);
    onSelectProfile(profile);
    setOpen(false);
  };

  const getColorHex = (colorId: string | null): string => {
    if (!colorId) return 'transparent';
    const color = SELECTABLE_COLORS.find((c) => c.id === colorId);
    return color?.hex || 'transparent';
  };

  return (
    <Popover open={open && !disabled} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative w-full">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleInputChange}
            onFocus={handleFocus}
            disabled={disabled}
            placeholder={placeholder}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            // Safari autofill workaround - start readonly
            readOnly={isReadOnly}
            // Static neutral name to avoid credential detection
            name="opponent_search_field"
            id="opponent-nickname-input"
            // Multiple autocomplete blocking strategies
            autoComplete="new-password"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            inputMode="text"
            // ARIA attributes to signal this is NOT a login field
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={open}
            // Block all password managers
            data-form-type="other"
            data-1p-ignore="true"
            data-lpignore="true"
            data-bwignore="true"
            data-protonpass-ignore="true"
          />
          {/* Status indicator */}
          {value.trim() && !disabled && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {exactMatch ? (
                <span className="text-xs text-green-500 font-medium">Existing</span>
              ) : (
                <span className="text-xs text-blue-500 font-medium">New</span>
              )}
            </div>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[--radix-popover-trigger-width] p-0" 
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command shouldFilter={false}>
          <CommandList>
            {isLoading ? (
              <div className="py-3 text-center text-sm text-muted-foreground">
                Loading...
              </div>
            ) : filteredProfiles.length === 0 ? (
              <CommandEmpty>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Plus className="h-4 w-4" />
                  <span>Create new opponent "{value.trim()}"</span>
                </div>
              </CommandEmpty>
            ) : (
              <CommandGroup heading="Existing Opponents">
                {filteredProfiles.map((profile) => (
                  <CommandItem
                    key={profile.id}
                    value={profile.nickname}
                    onSelect={() => handleSelectProfile(profile)}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    {/* Color indicator */}
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: getColorHex(profile.color) }}
                    />
                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {profile.image_url ? (
                        <img
                          src={profile.image_url}
                          alt={profile.nickname}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    {/* Nickname */}
                    <span className="truncate">{profile.nickname}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            
            {/* Show "Create new" option when there's input but no exact match */}
            {value.trim() && !exactMatch && filteredProfiles.length > 0 && (
              <CommandGroup heading="Or create new">
                <CommandItem
                  onSelect={() => setOpen(false)}
                  className="flex items-center gap-2 text-blue-500 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create new opponent "{value.trim()}"</span>
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default OpponentAutocomplete;
