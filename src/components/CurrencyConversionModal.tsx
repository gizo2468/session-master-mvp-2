import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { getCurrencySymbol } from '@/hooks/useDefaultCurrency';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { ArrowRight, Trash2, Loader2 } from 'lucide-react';
import { getSuggestedExchangeRate } from '@/services/exchangeRateService';

interface CurrencyConversion {
  id: string;
  from_currency: string;
  to_currency: string;
  original_amount: number;
  converted_amount: number;
  exchange_rate: number;
  created_at: string;
}

interface CurrencyConversionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currencyBreakdown: Record<string, number>;
  onConversionComplete: () => void;
  conversions: CurrencyConversion[];
}

const CurrencyConversionModal: React.FC<CurrencyConversionModalProps> = ({
  open,
  onOpenChange,
  currencyBreakdown,
  onConversionComplete,
  conversions,
}) => {
  const { user } = useAuth();
  const [fromCurrency, setFromCurrency] = useState<string>('');
  const [toCurrency, setToCurrency] = useState<string>('');
  const [exchangeRate, setExchangeRate] = useState<string>('');
  const [convertAll, setConvertAll] = useState(true);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestedRate, setSuggestedRate] = useState<number | null>(null);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);

  // Get available currencies (those with non-zero balances after adjustments)
  const availableCurrencies = Object.keys(currencyBreakdown).filter(
    (cur) => currencyBreakdown[cur] !== 0
  );

  // All currencies for target selection
  const allCurrencies = ['USD', 'EUR', 'ILS', 'GBP', 'CAD', 'AUD'];
  const targetCurrencies = allCurrencies.filter((cur) => cur !== fromCurrency);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setFromCurrency('');
      setToCurrency('');
      setExchangeRate('');
      setConvertAll(true);
      setCustomAmount('');
      setSuggestedRate(null);
    }
  }, [open]);

  // Fetch suggested rate when currencies change
  useEffect(() => {
    const fetchSuggested = async () => {
      if (!fromCurrency || !toCurrency) {
        setSuggestedRate(null);
        return;
      }

      setLoadingSuggestion(true);
      try {
        const rate = await getSuggestedExchangeRate(fromCurrency, toCurrency);
        setSuggestedRate(rate);
      } catch (e) {
        console.error('Failed to get suggested rate:', e);
        setSuggestedRate(null);
      } finally {
        setLoadingSuggestion(false);
      }
    };

    fetchSuggested();
  }, [fromCurrency, toCurrency]);

  const getSourceAmount = () => {
    if (!fromCurrency) return 0;
    return currencyBreakdown[fromCurrency] || 0;
  };

  const getAmountToConvert = () => {
    if (convertAll) {
      return getSourceAmount();
    }
    return parseFloat(customAmount) || 0;
  };

  const getConvertedAmount = () => {
    const amount = getAmountToConvert();
    const rate = parseFloat(exchangeRate) || 0;
    return amount * rate;
  };

  const formatCurrency = (amount: number): string => {
    return Math.abs(amount).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleConvert = async () => {
    if (!fromCurrency || !toCurrency || !exchangeRate) {
      toast.error('Please fill in all fields');
      return;
    }

    const rate = parseFloat(exchangeRate);
    if (rate <= 0) {
      toast.error('Exchange rate must be greater than 0');
      return;
    }

    const amountToConvert = getAmountToConvert();
    if (amountToConvert === 0) {
      toast.error('Amount to convert cannot be zero');
      return;
    }

    const convertedAmount = amountToConvert * rate;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('currency_conversions').insert({
        user_id: user?.id,
        from_currency: fromCurrency,
        to_currency: toCurrency,
        original_amount: amountToConvert,
        converted_amount: convertedAmount,
        exchange_rate: rate,
      });

      if (error) throw error;

      toast.success('Conversion saved successfully');
      onConversionComplete();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving conversion:', error);
      toast.error('Failed to save conversion');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConversion = async (conversionId: string) => {
    try {
      const { error } = await supabase
        .from('currency_conversions')
        .delete()
        .eq('id', conversionId);

      if (error) throw error;

      toast.success('Conversion removed');
      onConversionComplete();
    } catch (error) {
      console.error('Error deleting conversion:', error);
      toast.error('Failed to remove conversion');
    }
  };

  const fromSymbol = getCurrencySymbol(fromCurrency);
  const toSymbol = getCurrencySymbol(toCurrency);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Convert Currency</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* From Currency */}
          <div className="space-y-2">
            <Label>From Currency</Label>
            <Select value={fromCurrency} onValueChange={setFromCurrency}>
              <SelectTrigger>
                <SelectValue placeholder="Select source currency" />
              </SelectTrigger>
              <SelectContent>
                {availableCurrencies.map((cur) => (
                  <SelectItem key={cur} value={cur}>
                    {cur} ({getCurrencySymbol(cur)}
                    {formatCurrency(currencyBreakdown[cur])})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* To Currency */}
          <div className="space-y-2">
            <Label>To Currency</Label>
            <Select value={toCurrency} onValueChange={setToCurrency}>
              <SelectTrigger>
                <SelectValue placeholder="Select target currency" />
              </SelectTrigger>
              <SelectContent>
                {targetCurrencies.map((cur) => (
                  <SelectItem key={cur} value={cur}>
                    {cur} ({getCurrencySymbol(cur)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount Options */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Convert All</Label>
              <Switch checked={convertAll} onCheckedChange={setConvertAll} />
            </div>
            {!convertAll && (
              <div className="space-y-2">
                <Label>Custom Amount</Label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Exchange Rate */}
          <div className="space-y-2">
            <Label>
              Exchange Rate (1 {fromCurrency || '?'} = ? {toCurrency || '?'})
            </Label>
            <Input
              type="number"
              step="0.0001"
              placeholder=""
              value={exchangeRate}
              onChange={(e) => setExchangeRate(e.target.value)}
            />
            {/* Suggested Rate */}
            {fromCurrency && toCurrency && (
              <div className="text-xs text-muted-foreground mt-1">
                {loadingSuggestion ? (
                  <span className="flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Loading suggested rate...
                  </span>
                ) : suggestedRate ? (
                  <span className="flex items-center gap-1 flex-wrap">
                    Suggested: 1 {fromCurrency} ≈ {suggestedRate.toFixed(4)} {toCurrency}
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="h-auto p-0 ml-1 text-xs"
                      onClick={() => setExchangeRate(suggestedRate.toFixed(4))}
                    >
                      Use
                    </Button>
                  </span>
                ) : (
                  <span className="text-destructive">Could not fetch suggested rate</span>
                )}
              </div>
            )}
          </div>

          {/* Preview */}
          {fromCurrency && toCurrency && exchangeRate && (
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Preview:</p>
              <div className="flex items-center gap-2 text-sm font-medium">
                <span>
                  {fromSymbol}
                  {formatCurrency(getAmountToConvert())} {fromCurrency}
                </span>
                <ArrowRight className="h-4 w-4" />
                <span>
                  {toSymbol}
                  {formatCurrency(Math.abs(getConvertedAmount()))} {toCurrency}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Rate: 1 {fromCurrency} = {exchangeRate} {toCurrency}
              </p>
            </div>
          )}

          {/* Past Conversions */}
          {conversions.length > 0 && (
            <div className="border-t pt-4">
              <Label className="text-sm font-medium mb-2 block">
                Past Conversions
              </Label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {conversions.map((conv) => (
                  <div
                    key={conv.id}
                    className="flex items-center justify-between text-sm bg-muted/50 p-2 rounded"
                  >
                    <span>
                      {getCurrencySymbol(conv.from_currency)}
                      {formatCurrency(Math.abs(conv.original_amount))}{' '}
                      {conv.from_currency} → {getCurrencySymbol(conv.to_currency)}
                      {formatCurrency(Math.abs(conv.converted_amount))}{' '}
                      {conv.to_currency}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteConversion(conv.id)}
                      className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConvert} disabled={isSubmitting}>
            {isSubmitting ? 'Converting...' : 'Convert'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CurrencyConversionModal;
