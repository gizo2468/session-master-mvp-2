
import * as React from "react";
import { LucideProps, icons } from "lucide-react";

export interface IconProps extends Omit<LucideProps, "ref"> {
  name: string;
}

const Icon = ({ name, ...props }: IconProps) => {
  // Convert kebab-case to camelCase for compatibility
  const formattedName = name.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
  
  // Try to find the icon by various formats
  const LucideIcon = icons[name] || icons[formattedName] || 
                     icons[name.charAt(0).toUpperCase() + name.slice(1)] ||
                     icons[formattedName.charAt(0).toUpperCase() + formattedName.slice(1)];
  
  if (!LucideIcon) {
    console.error(`Icon '${name}' not found in lucide-react icons. Using ExternalLink as fallback.`);
    return icons.ExternalLink ? <icons.ExternalLink {...props} /> : null;
  }
  
  return <LucideIcon {...props} />;
};

export default Icon;
