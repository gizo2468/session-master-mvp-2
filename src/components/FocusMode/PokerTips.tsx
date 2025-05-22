
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PokerChip } from '@/components/Icons';

const tips = [
  {
    title: "Reset Between Hands",
    description: "Bad beat? Cooler? Let it go before your next decision. Good players recover instantly to protect their edge."
  },
  {
    title: "No Hero Mode",
    description: "Don't force genius plays to \"prove\" something. Stick to solid lines unless you have clear reads."
  },
  {
    title: "Anchor to Process Not Results",
    description: "When variance hits, fall back on logic. If the line you took was +EV the result doesn't change that."
  },
  {
    title: "Pattern Recognition Beats Memory",
    description: "Instead of trying to recall every detail train yourself to spot behavior patterns — it's faster under pressure."
  },
  {
    title: "Know When You're Not Thinking Clearly",
    description: "If you start hoping instead of analyzing it's time for a break even mid session."
  },
  {
    title: "[ONLINE TIP] Prioritize Table Attention",
    description: "When multi tabling some spots are autopilot but big pots and tough decisions need real focus. Spot them fast."
  },
  {
    title: "[ONLINE TIP] Build a Layout That Supports Focus",
    description: "Use stacking tiling or priority tables based on how you think best not what looks fancy."
  },
  {
    title: "[ONLINE TIP] Take Notes Mid Hand If Needed",
    description: "When a weird line appears note it right away. Online play gives you tools to track patterns across sessions."
  }
];

export function PokerTips() {
  return (
    <div className="space-y-4">
      {tips.map((tip, index) => (
        <Card key={index} className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-extrabold tracking-tight flex items-center">
              <PokerChip className="mr-2 h-5 w-5 text-poker-red" />
              {tip.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>{tip.description}</CardDescription>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
