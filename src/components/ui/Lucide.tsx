
import * as React from "react";
import { LucideProps, icons } from "lucide-react";

export interface IconProps extends Omit<LucideProps, "ref"> {
  name: string; // Changed from 'keyof typeof icons' to accept any string
}

const Icon = ({ name, ...props }: IconProps) => {
  // Convert PascalCase to kebab-case for compatibility
  const kebabCaseName = name
    .replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2')
    .toLowerCase();
    
  // Try to find the icon by PascalCase or kebab-case
  const LucideIcon = icons[name] || icons[kebabCaseName];
  
  if (!LucideIcon) {
    console.error(`Icon '${name}' not found in lucide-react icons`);
    return null;
  }
  
  return <LucideIcon {...props} />;
};

export default Icon;
