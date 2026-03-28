import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import Icon from '@/components/ui/Lucide';

interface ConsentedDataDisplayProps {
  studentId: string;
  studentName: string;
  showTitle?: boolean;
  compact?: boolean;
}

interface StudentData {
  id: string;
  full_name?: string;
  email?: string;
  phone_number?: string;
  profile_picture?: string;
  address?: any;
  date_of_birth?: string;
}

export const ConsentedDataDisplay: React.FC<ConsentedDataDisplayProps> = ({
  studentId,
  studentName,
  showTitle = true,
  compact = false
}) => {
  const [data, setData] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadConsentedData();
  }, [studentId]);

  const loadConsentedData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: result, error } = await supabase
        .rpc('get_consented_student_data', { p_student_id: studentId });

      if (error) throw error;

      setData(result?.[0] || null);
    } catch (err) {
      console.error('Error loading consented data:', err);
      setError('Failed to load student information');
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (address: any): string => {
    if (!address) return '';
    if (typeof address === 'string') return address;
    
    const parts = [];
    if (address.street) parts.push(address.street);
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    if (address.zip) parts.push(address.zip);
    if (address.country) parts.push(address.country);
    
    return parts.join(', ');
  };

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <Card className={compact ? 'p-4' : ''}>
        {showTitle && (
          <CardHeader className={compact ? 'p-0 pb-4' : ''}>
            <CardTitle className="flex items-center gap-2">
              <Icon name="user" size={20} />
              Student Information
            </CardTitle>
          </CardHeader>
        )}
        <CardContent className={compact ? 'p-0' : ''}>
          <div className="space-y-3 animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-muted rounded w-48"></div>
            <div className="h-4 bg-gray-200 dark:bg-muted rounded w-32"></div>
            <div className="h-4 bg-gray-200 dark:bg-muted rounded w-56"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <Icon name="alert-circle" className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const hasAnyData = data && Object.values(data).some(value => 
    value !== null && value !== undefined && value !== ''
  );

  return (
    <Card className={compact ? 'p-4' : ''}>
      {showTitle && (
        <CardHeader className={compact ? 'p-0 pb-4' : ''}>
          <CardTitle className="flex items-center gap-2">
            <Icon name="user" size={20} />
            {studentName} - Shared Information
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className={compact ? 'p-0' : ''}>
        {!hasAnyData ? (
          <Alert>
            <Icon name="shield-x" className="h-4 w-4" />
            <AlertDescription>
              {studentName} hasn't shared any personal information with you yet. 
              Ask them to update their data sharing preferences if needed.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-3">
            {data?.full_name && (
              <div className="flex items-center gap-2">
                <Icon name="user" size={16} className="text-gray-500 dark:text-muted-foreground" />
                <span className="font-medium">Name:</span>
                <span>{data.full_name}</span>
              </div>
            )}

            {data?.email && (
              <div className="flex items-center gap-2">
                <Icon name="mail" size={16} className="text-gray-500 dark:text-muted-foreground" />
                <span className="font-medium">Email:</span>
                <a 
                  href={`mailto:${data.email}`}
                  className="text-blue-600 hover:underline"
                >
                  {data.email}
                </a>
              </div>
            )}

            {data?.phone_number && (
              <div className="flex items-center gap-2">
                <Icon name="phone" size={16} className="text-gray-500 dark:text-muted-foreground" />
                <span className="font-medium">Phone:</span>
                <a 
                  href={`tel:${data.phone_number}`}
                  className="text-blue-600 hover:underline"
                >
                  {data.phone_number}
                </a>
              </div>
            )}

            {data?.date_of_birth && (
              <div className="flex items-center gap-2">
                <Icon name="calendar" size={16} className="text-gray-500 dark:text-muted-foreground" />
                <span className="font-medium">Date of Birth:</span>
                <span>{formatDate(data.date_of_birth)}</span>
              </div>
            )}

            {data?.address && (
              <div className="flex items-start gap-2">
                <Icon name="map-pin" size={16} className="text-gray-500 dark:text-muted-foreground mt-0.5" />
                <div>
                  <span className="font-medium">Address:</span>
                  <div className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500 mt-1">
                    {formatAddress(data.address)}
                  </div>
                </div>
              </div>
            )}

            <div className="pt-3 border-t">
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-muted-foreground">
                <Icon name="shield-check" size={12} />
                Only information explicitly shared by the student is displayed
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ConsentedDataDisplay;