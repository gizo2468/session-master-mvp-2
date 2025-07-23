
import * as React from "react";
import { LucideProps, icons } from "lucide-react";

export interface IconProps extends Omit<LucideProps, "ref"> {
  name: string;
}

const Icon = ({ name, ...props }: IconProps) => {
  // Convert kebab-case to camelCase for compatibility
  const formattedName = name.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
  
  // Handle special cases - common icon name differences
  const iconMappings: Record<string, string> = {
    "BarChart2": "BarChart", // Map BarChart2 to BarChart
    "barChart2": "BarChart",
    "bar-chart-2": "BarChart",
    "edit": "Pencil",
    "trash-2": "Trash2",
    "trash": "Trash2",
  };
  
  // Check if this is a special case name that needs mapping
  const mappedName = iconMappings[name] || iconMappings[formattedName];
  
  // Try to find the icon by various formats
  const LucideIcon = mappedName ? icons[mappedName] : 
                    icons[name] || 
                    icons[formattedName] || 
                    icons[name.charAt(0).toUpperCase() + name.slice(1)] ||
                    icons[formattedName.charAt(0).toUpperCase() + formattedName.slice(1)];
  
  if (!LucideIcon) {
    console.error(`Icon '${name}' not found in lucide-react icons. Using ExternalLink as fallback.`);
    return icons.ExternalLink ? <icons.ExternalLink {...props} /> : null;
  }
  
  return <LucideIcon {...props} />;
};

export default Icon;
