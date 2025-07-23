import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface Currency {
  code: string;
  symbol: string;
  name: string;
}

export const CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$', name: 'USD ($)' },
  { code: 'EUR', symbol: '€', name: 'EUR (€)' },
  { code: 'GBP', symbol: '£', name: 'GBP (£)' },
  { code: 'ILS', symbol: '₪', name: 'ILS (₪)' },
  { code: 'BRL', symbol: 'R$', name: 'BRL (R$)' },
  { code: 'CNY', symbol: '¥', name: 'CNY (¥)' },
  { code: 'THB', symbol: '฿', name: 'THB (฿)' },
  { code: 'INR', symbol: '₹', name: 'INR (₹)' },
];

export const getCurrencySymbol = (currencyCode: string): string => {
  const currency = CURRENCIES.find(c => c.code === currencyCode);
  return currency?.symbol || '$';
};

export const getCurrencyName = (currencyCode: string): string => {
  const currency = CURRENCIES.find(c => c.code === currencyCode);
  return currency?.name || 'USD ($)';
};

export const useDefaultCurrency = () => {
  const { user } = useAuth();
  const [defaultCurrency, setDefaultCurrency] = useState<string>('USD');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDefaultCurrency = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('default_currency')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching default currency:', error);
          setDefaultCurrency('USD');
        } else if (data?.default_currency) {
          setDefaultCurrency(data.default_currency);
        } else {
          setDefaultCurrency('USD');
        }
      } catch (error) {
        console.error('Error fetching default currency:', error);
        setDefaultCurrency('USD');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDefaultCurrency();
  }, [user?.id]);

  return {
    defaultCurrency,
    isLoading,
    getCurrencySymbol: (code?: string) => getCurrencySymbol(code || defaultCurrency),
    getCurrencyName: (code?: string) => getCurrencyName(code || defaultCurrency),
  };
};