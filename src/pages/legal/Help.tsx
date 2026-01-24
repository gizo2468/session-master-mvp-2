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

interface FaqItem {
  id: string;
  question: string;
  answer: React.ReactNode;
}

const faqItems: FaqItem[] = [
  {
    id: "start-session",
    question: "HOW DO I START A SESSION?",
    answer: (
      <>
        To start a new session, tap <strong>Start Session</strong>, choose the game type (<strong>Cash</strong> or <strong>Tournament</strong>), set the buy-in and game format, and begin playing.
        <br /><br />
        The session will remain active until you end it manually.
      </>
    )
  },
  {
    id: "close-session",
    question: "HOW DO I CLOSE AN ACTIVE SESSION?",
    answer: (
      <>
        To close an active session, tap <strong>End Session</strong>.
        <br />
        All tables within the session must be closed in order to fully close the session.
        <br />
        Only once there are no active tables remaining will the option to end the entire session become available.
        <br /><br />
        After closing the session, you can review the session summary, edit results, and add notes before saving.
      </>
    )
  },
  {
    id: "add-hand",
    question: "HOW DO I ADD A HAND MANUALLY?",
    answer: (
      <>
        <strong>1. From the live session screen</strong>
        <br />
        The <strong>Add Hand</strong> button on the main live session screen is a general action.
        <br />
        When tapped, it opens a list of all active tables in the session, allowing you to assign the hand to a specific table.
        <br /><br />
        <strong>2. From a specific table</strong>
        <br />
        Each table has its own <strong>Add Hand</strong> option.
        <br />
        Hands added this way are automatically linked to that table.
        <br /><br />
        <strong>3. After the session is finished</strong>
        <br />
        When editing a completed session, you can add hands retroactively if you forgot to add them during live play.
        <br /><br />
        In all hand-adding flows, you can enter the cards, board, and actions, assign the hand to a specific player in the app, and then save it for review and analysis.
      </>
    )
  },
  {
    id: "board-action",
    question: "HOW DO I USE THE BOARD / ACTION?",
    answer: (
      <>
        The <strong>Board</strong> and <strong>Action</strong> sections are available directly within the <strong>Add Hand</strong> screen.
        <br />
        The <strong>Board</strong> is used to enter the flop, turn, and river cards, while <strong>Action</strong> allows you to record the actions taken at each stage of the hand.
        <br /><br />
        This helps recreate an accurate hand history and review how the hand was played.
        <br /><br />
        In addition, the app includes an AI-based hand input option.
        <br />
        This feature is currently under development and will be fully available in a future version of the app.
      </>
    )
  },
  {
    id: "edit-summary",
    question: "HOW DO I EDIT THE SESSION SUMMARY?",
    answer: (
      <>
        Saved sessions are available under <strong>Recent Sessions</strong> on the app's main home screen, where they are displayed in chronological order.
        <br /><br />
        After closing a session, you can open the <strong>Session Summary</strong> to review your results.
        <br />
        From there, you can edit session details, update results, and add personal notes.
        <br /><br />
        To view all saved sessions, tap <strong>View All</strong>, which opens a full list where every session can be reviewed and edited individually.
        <br /><br />
        Session details can be edited at any time, allowing you to update and adjust your sessions whenever needed.
      </>
    )
  },
  {
    id: "connect-coach",
    question: "HOW DO I CONNECT A COACH TO A PLAYER?",
    answer: (
      <>
        The connection between a player and a coach can be initiated either by the player or by the coach, using the username.
        <br />
        This option is available inside the <strong>Dashboard</strong> screen, which can be accessed next to the <strong>Settings</strong> button.
        <br /><br />
        Once the connection is established, both the coach and the player can review sessions, hands, notes, and track the player's progress together.
      </>
    )
  },
  {
    id: "subscription",
    question: "WHAT DOES THE SUBSCRIPTION INCLUDE?",
    answer: (
      <>
        When you subscribe as a <strong>Premium</strong> user, all advanced features in the app are unlocked.
        <br /><br />
        Premium access includes:
        <br /><br />
        • Full access to the <strong>My Finance</strong> page, including advanced analytics and PDF export
        <br />
        • Unlimited player-to-coach connections
        <br />
        • Full access to the <strong>My Notes</strong> system
        <br />
        • Support for multiple currencies
        <br />
        • Full hand uploads across all streets
        <br />
        • Priority access to upcoming and future features
        <br /><br />
        The subscription is designed to provide a complete, unrestricted experience and support ongoing development of the app.
      </>
    )
  },
  {
    id: "online-game",
    question: 'WHAT DOES "ONLINE GAME" MEAN IN A LIVE SESSION?',
    answer: (
      <>
        When creating a new live session, you can enable the <strong>Online Game</strong> option to indicate that you are playing online from a device.
        <br /><br />
        This option is especially relevant for <strong>MTT</strong> sessions, where multiple tables are often played at the same time.
        <br /><br />
        In online MTT sessions, the app requires all tables within the session to be closed before the session itself can be ended.
        <br />
        The option to close the session becomes available only after every table has been closed.
        <br /><br />
        This behavior is built into the app to ensure consistent session tracking and a complete session summary.
      </>
    )
  },
  {
    id: "dashboard",
    question: "WHAT IS THE DASHBOARD USED FOR?",
    answer: (
      <>
        The <strong>Dashboard</strong> is your main overview screen, bringing together the most important information and tools in one place.
        <br /><br />
        It includes:
        <br /><br />
        • <strong>My Player / Coach Network</strong> – where players and coaches can connect and view shared sessions and data
        <br />
        • <strong>Session Stats</strong> – an expanded overview of your overall session performance with aggregated statistics
        <br />
        • <strong>My Finance</strong> – a financial overview with profit tracking and PDF export
        <br />
        • <strong>My Notes</strong> – notes you have created and attached to other players
        <br /><br />
        The <strong>Dashboard</strong> is designed to give you a clear, high-level view of your poker activity while keeping all key features easily accessible.
      </>
    )
  },
  {
    id: "overall-results",
    question: "WHAT HAPPENS WHEN I TAP 'OVERALL RESULTS'?",
    answer: (
      <>
        Tapping <strong>Overall Results</strong> opens the <strong>Currency Breakdown</strong> window.
        <br /><br />
        This window shows your results split by currency, so you can see how much you've won or lost in each currency you've played with.
        <br /><br />
        You can press <strong>Convert</strong> to convert results between currencies:
        <br /><br />
        • Choose a <strong>From</strong> currency (the one you want to convert)
        <br />
        • Choose a <strong>To</strong> currency (the one you want to convert into)
        <br />
        • Select <strong>Convert All</strong> or enter a custom amount
        <br />
        • Enter the exchange rate manually (a suggested rate is provided)
        <br /><br />
        After converting, the amounts update immediately. Each currency row still shows the original total in parentheses so you can always see what the value was before any conversions.
        <br /><br />
        The <strong>Overall Results</strong> value on the Home screen reflects the updated totals based on your preferred display currency.
      </>
    )
  },
  {
    id: "who-is-this-for",
    question: "WHO IS THIS APP FOR?",
    answer: (
      <>
        This app is designed to support a wide range of poker players and professionals, from beginners to experienced players and coaches.
        <br /><br />
        <strong>Beginner players</strong> can use the app to track sessions, record hands, understand results, and build good habits from the start without needing to fill in every detail.
        <br /><br />
        <strong>Professional players</strong> can take advantage of advanced session tracking, detailed statistics, hand history management, multi-table and MTT support, and financial analysis to review performance and optimize long-term results.
        <br /><br />
        <strong>Coaches</strong> can connect with players, review shared sessions and hands, leave notes, and follow player progress over time using the built-in network and analysis tools.
        <br /><br />
        The app is built to scale with your skill level, allowing you to use it as simply or as deeply as you choose.
      </>
    )
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
          <h1 className="text-2xl font-['Shippori_Antique_B1'] text-poker-gold mb-6 text-center">FAQ</h1>
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
                <AccordionContent className="px-6 pb-4 text-sm text-gray-600 leading-relaxed [&_strong]:text-poker-gold">
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
