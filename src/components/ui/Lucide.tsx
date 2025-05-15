import * as React from "react";
import { LucideProps, icons } from "lucide-react";

export interface IconProps extends Omit<LucideProps, "ref"> {
  name: string;
}

// Map of custom icon name mappings for backward compatibility
const iconMappings: Record<string, string> = {
  "BarChart2": "BarChart3", // Map BarChart2 to BarChart3 which exists in lucide
};

// Keep track of warned icons to avoid console spam
const warnedIcons = new Set<string>();

const Icon = ({ name, ...props }: IconProps) => {
  // Check for icon name mapping first
  const mappedName = iconMappings[name] || name;
  
  // Convert kebab-case to camelCase for compatibility
  const formattedName = mappedName.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
  
  // Try to find the icon by various formats
  const LucideIcon = icons[mappedName] || icons[formattedName] || 
                     icons[mappedName.charAt(0).toUpperCase() + mappedName.slice(1)] ||
                     icons[formattedName.charAt(0).toUpperCase() + formattedName.slice(1)];
  
  if (!LucideIcon) {
    // Only log warning once per icon name to reduce console spam
    if (!warnedIcons.has(name)) {
      console.warn(`Icon '${name}' not found in lucide-react icons. Using ExternalLink as fallback.`);
      warnedIcons.add(name);
    }
    return icons.ExternalLink ? <icons.ExternalLink {...props} /> : null;
  }
  
  return <LucideIcon {...props} />;
};

export default Icon;
