import React from 'react';
import { FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { AdaptiveTooltip } from '@/components/ui/adaptive-tooltip';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { CircleHelp } from 'lucide-react';
import { Control } from 'react-hook-form';
import { FormValues, actionTypes, tooltipContent } from '@/utils/handFormHelpers';

interface ActionSectionProps {
  control: Control<FormValues>;
}

const ActionSection: React.FC<ActionSectionProps> = ({
  control
}) => {
  return (
    <FormField
      control={control}
      name="action"
      render={({ field }) => (
        <FormItem>
          <div className="flex items-center gap-2">
            <FormLabel>Action Type</FormLabel>
            <AdaptiveTooltip content={tooltipContent.action}>
              <CircleHelp className="h-4 w-4 text-gray-500" />
            </AdaptiveTooltip>
          </div>
          <FormControl>
            <ToggleGroup 
              type="single" 
              value={field.value || 'Open / Flat'} // Default to Open/Flat
              onValueChange={(value) => {
                if (value) field.onChange(value);
              }}
              className="grid grid-cols-2 gap-2"
            >
              {actionTypes.map((actionType) => (
                <ToggleGroupItem
                  key={actionType.value}
                  value={actionType.value}
                  variant="outline"
                  className="data-[state=on]:bg-poker-gold data-[state=on]:text-white data-[state=on]:border-poker-gold"
                >
                  {actionType.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </FormControl>
        </FormItem>
      )}
    />
  );
};

export default ActionSection;