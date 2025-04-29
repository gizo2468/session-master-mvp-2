
import React from 'react';
import { format } from 'date-fns';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/context/LanguageContext';
import { PokerSession } from '@/types/poker';

interface SessionStatsCardProps {
  session: PokerSession;
}

const SessionStatsCard: React.FC<SessionStatsCardProps> = ({ session }) => {
  const { t } = useLanguage();
  
  // Calculate profit/loss
  const profit = session.cashOut !== undefined ? session.cashOut - session.buyIn : 0;
  const isProfit = profit >= 0;
  
  // Calculate session duration
  const duration = session.sessionDuration || 0;
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;
  
  // Format time displays
  const durationDisplay = `${hours > 0 ? `${hours}${t('hours_short')} ` : ''}${minutes}${t('minutes_short')}`;
  const startTimeDisplay = format(new Date(session.startTime), 'p');
  const endTimeDisplay = session.endTime ? format(new Date(session.endTime), 'p') : t('in_progress');

  return (
    <Card className="p-4 mb-6 bg-white rounded-lg shadow">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm text-gray-500">{t('buy_in')}</h3>
          <p className="text-xl font-bold">${session.buyIn}</p>
        </div>
        
        <div>
          <h3 className="text-sm text-gray-500">{t('cash_out')}</h3>
          <p className="text-xl font-bold">${session.cashOut || 0}</p>
        </div>
        
        <div>
          <h3 className="text-sm text-gray-500">{t('profit_loss')}</h3>
          <p className={`text-xl font-bold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
            {isProfit ? '+' : ''}{profit}
          </p>
        </div>
        
        <div>
          <h3 className="text-sm text-gray-500">{t('duration')}</h3>
          <p className="text-xl font-bold">{durationDisplay}</p>
        </div>
        
        <div>
          <h3 className="text-sm text-gray-500">{t('start_time')}</h3>
          <p className="font-medium">{startTimeDisplay}</p>
        </div>
        
        <div>
          <h3 className="text-sm text-gray-500">{t('end_time')}</h3>
          <p className="font-medium">{endTimeDisplay}</p>
        </div>
      </div>
    </Card>
  );
};

export default SessionStatsCard;
