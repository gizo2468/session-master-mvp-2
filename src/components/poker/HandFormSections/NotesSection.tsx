import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Control } from 'react-hook-form';
import { FormValues } from '@/utils/handFormHelpers';

interface NotesSectionProps {
  control: Control<FormValues>;
}

const NotesSection: React.FC<NotesSectionProps> = ({
  control
}) => {
  return (
    <FormField
      control={control}
      name="notes"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Notes</FormLabel>
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
  );
};

export default NotesSection;