import React from 'react';
import { FormField, FormItem, FormControl, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { Control } from 'react-hook-form';
import { FormValues } from '@/utils/handFormHelpers';

interface NotesSectionProps {
  control: Control<FormValues>;
  isNotesOpen: boolean;
  setIsNotesOpen: (open: boolean) => void;
}

const NotesSection: React.FC<NotesSectionProps> = ({
  control,
  isNotesOpen,
  setIsNotesOpen
}) => {
  return (
    <Collapsible open={isNotesOpen} onOpenChange={setIsNotesOpen}>
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center justify-between w-full py-2 font-bold text-foreground transition-colors">
          <span>Notes</span>
          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isNotesOpen ? 'rotate-180' : ''}`} />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2">
        <FormField
          control={control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea 
                  placeholder="Hand notes (reads, decisions, strategy)" 
                  className="h-20"
                  autoComplete="off"
                  data-form-type="other"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CollapsibleContent>
    </Collapsible>
  );
};

export default NotesSection;
