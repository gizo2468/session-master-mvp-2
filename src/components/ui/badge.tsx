
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        success: "border-transparent bg-green-100 text-green-800 hover:bg-green-200",
        warning: "border-transparent bg-amber-100 text-amber-800 hover:bg-amber-200",
        info: "border-transparent bg-blue-100 text-blue-800 hover:bg-blue-200",
        poker: "border-transparent bg-green-600 text-white hover:bg-green-700",
        // New variants for session time badges
        timeStarted: "border-transparent bg-poker-cream text-poker-black rounded-xl",
        timeDuration: "border-transparent bg-gray-100 text-poker-black rounded-xl",
        timeEnded: "border-transparent bg-gray-200 text-poker-black rounded-xl",
        // Enhanced coach plan badge variants with modern styling
        planFree: "border-transparent bg-gray-600 text-white px-4 py-1 rounded-md shadow-sm hover:shadow-md transition-all",
        planStarter: "border-transparent bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-1 rounded-md shadow-sm hover:shadow-md transition-all",
        planPro: "border-transparent bg-gradient-to-r from-poker-gold to-poker-darkGold text-white px-4 py-1 rounded-md shadow-sm hover:shadow-md transition-all",
        planElite: "border-transparent bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-1 rounded-md shadow-sm hover:shadow-md transition-all",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
