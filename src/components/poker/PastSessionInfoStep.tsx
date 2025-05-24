
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { DateTimePicker } from '@/components/ui/datetime-picker';

const sessionInfoSchema = z.object({
  startTime: z.date(),
  endTime: z.date(),
  isOnline: z.boolean().default(false),
  isMultiDay: z.boolean().default(false),
  location: z.string().min(1, 'Location is required'),
  notes: z.string().optional(),
});

type SessionInfoFormData = z.infer<typeof sessionInfoSchema>;

interface SessionInfo {
  startTime: Date;
  endTime: Date;
  isOnline: boolean;
  isMultiDay: boolean;
  location: string;
  notes?: string;
}

interface PastSessionInfoStepProps {
  initialData: SessionInfo;
  onSubmit: (data: SessionInfo) => void;
  onCancel: () => void;
}

const PastSessionInfoStep: React.FC<PastSessionInfoStepProps> = ({
  initialData,
  onSubmit,
  onCancel
}) => {
  const form = useForm<SessionInfoFormData>({
    resolver: zodResolver(sessionInfoSchema),
    defaultValues: initialData,
  });

  const handleSubmit = (data: SessionInfoFormData) => {
    // Ensure all required fields are present and properly typed
    const sessionInfo: SessionInfo = {
      startTime: data.startTime,
      endTime: data.endTime,
      isOnline: data.isOnline,
      isMultiDay: data.isMultiDay,
      location: data.location,
      notes: data.notes
    };
    onSubmit(sessionInfo);
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Session Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <DateTimePicker
                date={form.watch('startTime')}
                onDateChange={(date) => {
                  if (date) {
                    form.setValue('startTime', date);
                  }
                }}
                label="Start Time"
                badgeVariant="success"
              />

              <DateTimePicker
                date={form.watch('endTime')}
                onDateChange={(date) => {
                  if (date) {
                    form.setValue('endTime', date);
                  }
                }}
                label="End Time"
                badgeVariant="destructive"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="location">Location / Table Name</Label>
            <Input
              id="location"
              {...form.register('location')}
              placeholder="Casino name or online site"
            />
            {form.formState.errors.location && (
              <p className="text-sm text-red-500 mt-1">{form.formState.errors.location.message}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isOnline"
              checked={form.watch('isOnline')}
              onCheckedChange={(checked) => form.setValue('isOnline', !!checked)}
            />
            <Label htmlFor="isOnline">Online Game</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isMultiDay"
              checked={form.watch('isMultiDay')}
              onCheckedChange={(checked) => form.setValue('isMultiDay', !!checked)}
            />
            <Label htmlFor="isMultiDay">Multi-Day Tournament</Label>
          </div>

          <div>
            <Label htmlFor="notes">Session Notes (Optional)</Label>
            <Textarea
              id="notes"
              {...form.register('notes')}
              placeholder="Any notes about the session..."
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" variant="poker" className="flex-1">
          Continue to Tables
        </Button>
      </div>
    </form>
  );
};

export default PastSessionInfoStep;
