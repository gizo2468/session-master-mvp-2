
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PokerChip } from '@/components/Icons';

const tips = [
  {
    title: "Position is Power",
    description: "Acting last gives you more information. Use position to play more hands and control pot sizes."
  },
  {
    title: "Manage Your Bankroll",
    description: "Never play with more than 5% of your total bankroll in a single cash game session."
  },
  {
    title: "Pay Attention to Patterns",
    description: "Observe how your opponents play and adjust accordingly. Look for betting patterns and timing tells."
  },
  {
    title: "Value Bet Thin",
    description: "Against calling stations, extract maximum value with your strong hands by betting thinly."
  },
  {
    title: "3-Bet with Purpose",
    description: "Have a balanced 3-betting range that includes premium hands and strategic bluffs."
  },
  {
    title: "Fold More Often",
    description: "One of the biggest leaks for novice players is playing too many hands. Be selective pre-flop."
  },
  {
    title: "Protect Your Mental Game",
    description: "Take breaks, avoid tilt, and don't chase losses. Emotional control is crucial to long-term success."
  },
  {
    title: "Table Selection Matters",
    description: "Always look for tables with weaker players. It's often more profitable than improving your strategy."
  }
];

export function PokerTips() {
  return (
    <div className="space-y-4">
      {tips.map((tip, index) => (
        <Card key={index} className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-serif flex items-center">
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
