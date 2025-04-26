
import * as React from "react";
import { LucideProps, icons } from "lucide-react";

export interface IconProps extends Omit<LucideProps, "ref"> {
  name: keyof typeof icons;
}

const Icon = ({ name, ...props }: IconProps) => {
  const LucideIcon = icons[name];
  
  if (!LucideIcon) {
    console.error(`Icon '${name}' not found in lucide-react icons`);
    return null;
  }
  
  return <LucideIcon {...props} />;
};

export default Icon;
