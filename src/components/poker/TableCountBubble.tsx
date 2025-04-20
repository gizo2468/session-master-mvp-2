
import React from "react";

interface TableCountBubbleProps {
  format: "Cash" | "Tournament";
  count: number;
}

const labelMap = {
  Cash: "Cash Games Amount",
  Tournament: "Tournaments Amount",
};

const TableCountBubble: React.FC<TableCountBubbleProps> = ({ format, count }) => {
  return (
    <span className="inline-block bg-poker-feltGreen text-white text-xs font-semibold px-3 py-1 rounded-full shadow ml-2">
      {labelMap[format]}: {count}
    </span>
  );
};

export default TableCountBubble;
