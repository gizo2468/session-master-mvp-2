
import { useSessionContext } from '@/context/SessionContext';
import { useLanguage } from '@/context/LanguageContext';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const FilterBar = () => {
  const { filters, setFilters } = useSessionContext();
  const { t } = useLanguage();
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="location-filter" className="text-sm font-medium mb-1 block">
            {t('location')}
          </Label>
          <Input 
            id="location-filter"
            type="text" 
            placeholder={t('search')}
            value={filters.location || ''}
            onChange={(e) => setFilters({ ...filters, location: e.target.value })}
            className="w-full"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="game-filter" className="text-sm font-medium mb-1 block">
              {t('game')}
            </Label>
            <Select
              value={filters.gameType || 'All'}
              onValueChange={(value) => setFilters({ ...filters, gameType: value })}
            >
              <SelectTrigger id="game-filter" className="w-full">
                <SelectValue placeholder={t('all_games')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">{t('all_games')}</SelectItem>
                <SelectItem value="NLH">NLH</SelectItem>
                <SelectItem value="PLO">PLO</SelectItem>
                <SelectItem value="Mixed">Mixed</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="format-filter" className="text-sm font-medium mb-1 block">
              {t('format')}
            </Label>
            <Select
              value={filters.format || 'All'}
              onValueChange={(value) => setFilters({ ...filters, format: value })}
            >
              <SelectTrigger id="format-filter" className="w-full">
                <SelectValue placeholder={t('all_formats')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">{t('all_formats')}</SelectItem>
                <SelectItem value="Cash">{t('cash_game')}</SelectItem>
                <SelectItem value="Tournament">{t('tournament')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
