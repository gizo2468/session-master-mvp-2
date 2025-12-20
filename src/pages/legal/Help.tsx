import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/Lucide';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqItems = [
  {
    id: "close-session",
    question: "HOW DO I CLOSE AN ACTIVE SESSION?",
    answer: `To close an active session, tap End Session.
All tables within the session must be closed in order to fully close the session.
Only once there are no active tables remaining will the option to end the entire session become available.

After closing the session, you can review the session summary, edit results, and add notes before saving.`
  },
  {
    id: "add-hand",
    question: "HOW DO I ADD A HAND MANUALLY?",
    answer: `1. From the live session screen
The Add Hand button on the main live session screen is a general action.
When tapped, it opens a list of all active tables in the session, allowing you to assign the hand to a specific table.

2. From a specific table
Each table has its own Add Hand option.
Hands added this way are automatically linked to that table.

3. After the session is finished
When editing a completed session, you can add hands retroactively if you forgot to add them during live play.

In all hand-adding flows, you can enter the cards, board, and actions, assign the hand to a specific player in the app, and then save it for review and analysis.`
  },
  {
    id: "board-action",
    question: "HOW DO I USE THE BOARD / ACTION?",
    answer: `The Board and Action sections are available directly within the Add Hand screen.
The Board is used to enter the flop, turn, and river cards, while Action allows you to record the actions taken at each stage of the hand.

This helps recreate an accurate hand history and review how the hand was played.

In addition, the app includes an AI-based hand input option.
This feature is currently under development and will be fully available in a future version of the app.`
  },
  {
    id: "edit-summary",
    question: "HOW DO I EDIT THE SESSION SUMMARY?",
    answer: `Saved sessions are available under Recent Sessions on the app's main home screen, where they are displayed in chronological order.

After closing a session, you can open the Session Summary to review your results.
From there, you can edit session details, update results, and add personal notes.

To view all saved sessions, tap View All, which opens a full list where every session can be reviewed and edited individually.

Session details can be edited at any time, allowing you to update and adjust your sessions whenever needed.`
  },
  {
    id: "connect-coach",
    question: "HOW DO I CONNECT A COACH TO A PLAYER?",
    answer: `The connection between a player and a coach can be initiated either by the player or by the coach, using the username.
This option is available inside the Dashboard screen, which can be accessed next to the Settings button.

Once the connection is established, both the coach and the player can review sessions, hands, notes, and track the player's progress together.`
  },
  {
    id: "subscription",
    question: "WHAT DOES THE SUBSCRIPTION INCLUDE?",
    answer: `When you subscribe as a Premium user, all advanced features in the app are unlocked.

Premium access includes:

• Full access to the My Finance page, including advanced analytics and PDF export
• Unlimited player-to-coach connections
• Full access to the My Notes system
• Support for multiple currencies
• Full hand uploads across all streets
• Priority access to upcoming and future features

The subscription is designed to provide a complete, unrestricted experience and support ongoing development of the app.`
  },
  {
    id: "online-game",
    question: 'WHAT DOES "ONLINE GAME" MEAN IN A LIVE SESSION?',
    answer: `When creating a new live session, you can enable the Online Game option to indicate that you are playing online from a device.

This option is especially relevant for MTT sessions, where multiple tables are often played at the same time.

In online MTT sessions, the app requires all tables within the session to be closed before the session itself can be ended.
The option to close the session becomes available only after every table has been closed.

This behavior is built into the app to ensure consistent session tracking and a complete session summary.`
  },
  {
    id: "dashboard",
    question: "WHAT IS THE DASHBOARD USED FOR?",
    answer: `The Dashboard is your main overview screen, bringing together the most important information and tools in one place.

It includes:

• My Player / Coach Network – where players and coaches can connect and view shared sessions and data
• Session Stats – an expanded overview of your overall session performance with aggregated statistics
• My Finance – a financial overview with profit tracking and PDF export
• My Notes – notes you have created and attached to other players

The Dashboard is designed to give you a clear, high-level view of your poker activity while keeping all key features easily accessible.`
  }
];

const Help: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <Button 
            onClick={() => navigate(-1)} 
            variant="ghost"
            className="text-primary mb-4 flex items-center gap-1 hover:bg-transparent hover:text-primary/80"
          >
            <Icon name="ArrowLeft" size={16} />
            <span>Back</span>
          </Button>
          <h1 className="text-2xl font-serif font-bold text-foreground mb-6">Help</h1>
        </header>

        <div className="bg-card rounded-lg shadow-sm">
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, index) => (
              <AccordionItem 
                key={item.id} 
                value={item.id}
                className={index === faqItems.length - 1 ? "border-b-0" : ""}
              >
                <AccordionTrigger className="px-6 py-4 text-left text-sm font-medium text-foreground hover:no-underline hover:bg-muted/50 transition-colors">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  );
};

export default Help;
