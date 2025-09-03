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
              placeholder="Any additional details or thoughts about the hand..."
              className="h-20"
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