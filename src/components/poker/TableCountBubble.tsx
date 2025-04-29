
import React from "react";
import { useLanguage } from '@/context/LanguageContext';

interface TableCountBubbleProps {
  format: "Cash" | "Tournament";
  count: number;
}

const TableCountBubble: React.FC<TableCountBubbleProps> = ({ format, count }) => {
  const { t } = useLanguage();
  
  const getLabel = (format: "Cash" | "Tournament") => {
    return format === "Cash" ? t('cash_games_amount') : t('tournaments_amount');
  };

  return (
    <span className="inline-block bg-poker-feltGreen text-white text-xs font-semibold px-3 py-1 rounded-full shadow mx-2 rtl-fix-padding">
      {getLabel(format)}: {count}
    </span>
  );
};

export default TableCountBubble;
