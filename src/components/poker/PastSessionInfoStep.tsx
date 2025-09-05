
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { DateTimePicker } from '@/components/ui/datetime-picker';

const sessionInfoSchema = z.object({
  startTime: z.date(),
  endTime: z.date(),
  location: z.string().min(1, 'Location is required'),
  notes: z.string().optional(),
});

type SessionInfoFormData = z.infer<typeof sessionInfoSchema>;

interface SessionInfo {
  startTime: Date;
  endTime: Date;
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
    const sessionInfo: SessionInfo = {
      startTime: data.startTime,
      endTime: data.endTime,
      location: data.location,
      notes: data.notes
    };
    onSubmit(sessionInfo);
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6" autoComplete="off">
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
                    // Auto-fill end date with the same date as start date
                    form.setValue('endTime', date);
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
            <Label htmlFor="location">Physical Location</Label>
            <Input
              id="location"
              {...form.register('location')}
              placeholder="Venue or site"
              autoComplete="off"
              data-form-type="other"
            />
            {form.formState.errors.location && (
              <p className="text-sm text-red-500 mt-1">{form.formState.errors.location.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="notes">Session Notes (Optional)</Label>
            <Textarea
              id="notes"
              {...form.register('notes')}
              placeholder="Session notes"
              autoComplete="off"
              data-form-type="other"
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
