import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ConsentData {
  data_field: string;
  granted: boolean;
  granted_at?: string;
  revoked_at?: string;
}

interface UseDataSharingConsentProps {
  coachId?: string;
  studentId?: string;
}

export const useDataSharingConsent = ({ coachId, studentId }: UseDataSharingConsentProps = {}) => {
  const [consents, setConsents] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  const loadConsents = async () => {
    if (!coachId && !studentId) return;
    
    setLoading(true);
    try {
      let query = supabase.from('student_data_sharing_consent').select('data_field, granted, granted_at, revoked_at');
      
      if (coachId) {
        query = query.eq('coach_id', coachId);
      }
      if (studentId) {
        query = query.eq('student_id', studentId);
      }

      const { data, error } = await query;

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

  const updateConsent = async (dataField: string, granted: boolean, targetCoachId?: string) => {
    if (!targetCoachId && !coachId) {
      toast.error('Coach ID is required to update consent');
      return false;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('student_data_sharing_consent')
        .upsert({
          student_id: user.id,
          coach_id: targetCoachId || coachId,
          data_field: dataField,
          granted,
          granted_at: granted ? new Date().toISOString() : null,
          revoked_at: !granted ? new Date().toISOString() : null,
        }, {
          onConflict: 'student_id,coach_id,data_field'
        });

      if (error) throw error;

      setConsents(prev => ({ ...prev, [dataField]: granted }));
      return true;
    } catch (error) {
      console.error('Error updating consent:', error);
      toast.error('Failed to update data sharing preference');
      return false;
    }
  };

  const hasConsent = (dataField: string): boolean => {
    return consents[dataField] || false;
  };

  const getConsentedFields = (): string[] => {
    return Object.entries(consents)
      .filter(([_, granted]) => granted)
      .map(([field, _]) => field);
  };

  useEffect(() => {
    loadConsents();
  }, [coachId, studentId]);

  return {
    consents,
    loading,
    loadConsents,
    updateConsent,
    hasConsent,
    getConsentedFields,
  };
};

export default useDataSharingConsent;