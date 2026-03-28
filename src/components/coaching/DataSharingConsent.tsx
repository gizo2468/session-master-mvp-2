import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import Icon from '@/components/ui/Lucide';

interface DataSharingConsentProps {
  coachId: string;
  coachName: string;
  onConsentChange?: () => void;
}

interface ConsentData {
  data_field: string;
  granted: boolean;
  granted_at?: string;
}

const DATA_FIELDS = [
  { key: 'full_name', label: 'Full Name', description: 'Your full legal name' },
  { key: 'email', label: 'Email Address', description: 'Your email contact information' },
  { key: 'phone_number', label: 'Phone Number', description: 'Your phone contact information' },
  { key: 'profile_picture', label: 'Profile Picture', description: 'Your profile photo' },
  { key: 'address', label: 'Address', description: 'Your residential address' },
  { key: 'date_of_birth', label: 'Date of Birth', description: 'Your birth date' },
];

export const DataSharingConsent: React.FC<DataSharingConsentProps> = ({
  coachId,
  coachName,
  onConsentChange
}) => {
  const [consents, setConsents] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadConsents();
  }, [coachId]);

  const loadConsents = async () => {
    try {
      const { data, error } = await supabase
        .from('student_data_sharing_consent')
        .select('data_field, granted')
        .eq('coach_id', coachId);

      if (error) throw error;

      const consentMap: Record<string, boolean> = {};
      data?.forEach((consent: ConsentData) => {
        consentMap[consent.data_field] = consent.granted;
      });

      setConsents(consentMap);
    } catch (error) {
      console.error('Error loading consents:', error);
      toast.error('Failed to load data sharing preferences');
    } finally {
      setLoading(false);
    }
  };

  const updateConsent = async (dataField: string, granted: boolean) => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('student_data_sharing_consent')
        .upsert({
          student_id: user.id,
          coach_id: coachId,
          data_field: dataField,
          granted,
          granted_at: granted ? new Date().toISOString() : null,
          revoked_at: !granted ? new Date().toISOString() : null,
        }, {
          onConflict: 'student_id,coach_id,data_field'
        });

      if (error) throw error;

      setConsents(prev => ({ ...prev, [dataField]: granted }));
      toast.success(`Data sharing ${granted ? 'enabled' : 'disabled'} for ${DATA_FIELDS.find(f => f.key === dataField)?.label}`);
      onConsentChange?.();
    } catch (error) {
      console.error('Error updating consent:', error);
      toast.error('Failed to update data sharing preference');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="shield-check" size={20} />
            Loading Privacy Settings...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center justify-between animate-pulse">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-muted rounded w-32"></div>
                  <div className="h-3 bg-gray-100 dark:bg-muted rounded w-48"></div>
                </div>
                <div className="h-6 w-11 bg-gray-200 dark:bg-muted rounded-full"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="shield-check" size={20} />
          Data Sharing with {coachName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Icon name="info" className="h-4 w-4" />
          <AlertDescription>
            Control what personal information you share with your coach. You can change these settings at any time.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          {DATA_FIELDS.map(field => (
            <div key={field.key} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-border last:border-0">
              <div className="space-y-1 flex-1">
                <Label htmlFor={field.key} className="text-sm font-medium">
                  {field.label}
                </Label>
                <p className="text-xs text-gray-600 dark:text-gray-400 dark:text-gray-500">{field.description}</p>
              </div>
              <Switch
                id={field.key}
                checked={consents[field.key] || false}
                onCheckedChange={(checked) => updateConsent(field.key, checked)}
                disabled={saving}
                className="ml-4"
              />
            </div>
          ))}
        </div>

        <div className="pt-4 border-t">
          <p className="text-xs text-gray-500 dark:text-muted-foreground">
            <Icon name="lock" className="inline h-3 w-3 mr-1" />
            Your privacy is protected. Only the information you explicitly consent to share will be visible to your coach.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataSharingConsent;