import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { CURRENCIES, getCurrencySymbol } from '@/hooks/useDefaultCurrency';
import { usePremiumAccess } from '@/hooks/usePremiumAccess';
import Icon from '@/components/ui/Lucide';

interface CurrencySelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  value,
  onValueChange,
  placeholder = "Select currency",
  className
}) => {
  const { isPremium } = usePremiumAccess();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = React.useState(false);

  // For premium users, show normal selector
  if (isPremium) {
    return (
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className={className}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="bg-background border-border">
          {CURRENCIES.map((currency) => (
            <SelectItem key={currency.code} value={currency.code}>
              {currency.symbol} {currency.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  // Free currency codes
  const freeCurrencies = ['USD', 'EUR'];
  
  // For non-premium users, show USD and EUR with upgrade prompt for others
  return (
    <Select 
      value={value} 
      onValueChange={(val) => {
        // Only allow free currency selection
        if (freeCurrencies.includes(val)) {
          onValueChange(val);
        }
      }}
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="bg-background border-border z-[100] w-[280px] sm:w-[320px]">
        <SelectItem value="USD">
          {getCurrencySymbol('USD')} USD ($)
        </SelectItem>
        <SelectItem value="EUR">
          {getCurrencySymbol('EUR')} EUR (€)
        </SelectItem>
        <div className="px-4 py-4 border-t border-border bg-background">
          <p className="text-sm text-muted-foreground mb-3 text-center leading-relaxed">
            To use other currencies, please upgrade to Premium.
          </p>
          <Button
            onClick={(e) => {
              e.preventDefault();
              setIsOpen(false);
              navigate('/subscription');
            }}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
            size="sm"
          >
            <Icon name="Crown" className="mr-2 h-4 w-4 flex-shrink-0" />
            <span className="whitespace-nowrap">Upgrade to Premium</span>
          </Button>
        </div>
      </SelectContent>
    </Select>
  );
};

export default CurrencySelector;
