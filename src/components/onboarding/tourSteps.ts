export interface TourStep {
  selector: string;
  title: string;
  body: string;
  /** When true, the spotlight is click-through and underlying UI stays interactive. */
  interactive?: boolean;
  /** When true, render a circular spotlight instead of a rounded rectangle. */
  circle?: boolean;
  /** Route this step lives on, used to know when to render the tour on each page. */
  route: '/' | '/new-session' | '/session';
  /** Run before measuring; use to open accordions, switch tabs, etc. Return when DOM is ready. */
  prepare?: () => void | Promise<void>;
  /** When true, the tooltip uses tighter padding/gap and a larger gap from the spotlight. */
  compact?: boolean;
  /** Force tooltip placement relative to the spotlight. Defaults to auto. */
  placement?: 'auto' | 'above' | 'below';
}

export type TourPathId = 'start-session' | 'home-guide' | 'dashboard-guide';

const openAdvanced = () => {
  window.dispatchEvent(new CustomEvent('onboarding:open-advanced'));
  return new Promise<void>((r) => setTimeout(r, 280));
};

export const TOUR_PATHS: Record<TourPathId, TourStep[]> = {
  'start-session': [
    {
      selector: '[data-tour="start-session"]',
      title: 'Start a Session',
      body: 'Click the chip to start your first session and see the app in action!',
      interactive: true,
      circle: true,
      route: '/',
    },
    {
      selector: '[data-tour="game-setup"]',
      title: 'Define Your Game',
      body: 'Select the **game type** and **format** for your first table. This ensures your session starts with the correct settings and tracking.',
      interactive: true,
      route: '/new-session',
    },
    {
      selector: '[data-tour="stakes"]',
      title: 'Set the Stakes',
      body: 'Enter the **buy-in** of your first table in your session. This is the only field you **must** fill.',
      interactive: true,
      route: '/new-session',
    },
    {
      selector: '[data-tour="optional-details"]',
      title: 'Session Name',
      body: 'Give your session a custom name to easily identify it in your history later.',
      interactive: true,
      compact: true,
      route: '/new-session',
      prepare: openAdvanced,
    },
    {
      selector: '[data-tour="advanced-checkboxes"]',
      title: 'Advanced Options (Optional)',
      body: 'Select any that apply to your session for accurate tracking and specialized features.',
      interactive: true,
      route: '/new-session',
      prepare: openAdvanced,
      compact: true,
    },
    {
      selector: '[data-tour="additional-details"]',
      title: 'Additional Details (Optional)',
      body: 'Specify a starting table name or group this session under a major poker festival.',
      interactive: true,
      route: '/new-session',
      prepare: openAdvanced,
      compact: true,
    },
    {
      selector: '[data-tour="submit-session"]',
      title: "You're All Set!",
      body: "Fill in the details and hit 'Start Session' to begin tracking. Good luck at the tables!",
      interactive: true,
      route: '/new-session',
    },
    {
      selector: '[data-tour="live-overview"]',
      title: 'Live Session Tracking',
      body: 'Monitor your total session duration and overall investment in real-time.',
      interactive: true,
      route: '/session',
      compact: true,
    },
    {
      selector: '[data-tour="live-add-table"]',
      title: 'Expand Your Session',
      body: 'Quickly add new tables or tournaments to your active session as you play.',
      interactive: true,
      route: '/session',
      compact: true,
    },
    {
      selector: '[data-tour="live-actions"]',
      title: 'Stay Active',
      body: "Use these buttons to log every important moment. Whether it's a specific player read or a note on an opponent, keep your data fresh!",
      interactive: true,
      route: '/session',
    },
    {
      selector: '[data-tour="live-session-details"]',
      title: 'Session Details',
      body: 'View all the essential information about your session. From here, you can also share your live session with your coach for real-time review and feedback.',
      interactive: true,
      route: '/session',
      compact: true,
    },
    {
      selector: '[data-tour="table-stats"]',
      title: 'Active Tables',
      body: 'All your currently running tables and tournaments will appear here. You can track individual progress and update results for each one.',
      interactive: true,
      route: '/session',
      compact: true,
      placement: 'below',
    },
    {
      selector: '[data-tour="table-actions"]',
      title: 'Active Tables',
      body: "Log a Rebuy or Hand History instantly for your records. Note: To end your session later, you must first close all tables individually. Let's try it now—tap End Table to see how it works.",
      interactive: true,
      route: '/session',
      compact: true,
      placement: 'above',
    },
    {
      selector: '[data-tour="end-table-cashout"]',
      title: 'Enter Your Payout',
      body: 'Enter your final payout amount here. This value is required to calculate your net profit or loss for this specific table.',
      interactive: true,
      compact: true,
      route: '/session',
      placement: 'below',
    },
    {
      selector: '[data-tour="end-table-confirm"]',
      title: 'Finalize This Table',
      body: 'Now, tap End Table to finalize this game and save your data.',
      interactive: true,
      compact: true,
      route: '/session',
      placement: 'above',
    },
    {
      selector: '[data-tour="live-controls"]',
      title: 'Finishing Up',
      body: "When you're done for the day, click here to wrap up. We'll save all your stats and add them to your overall record.",
      interactive: true,
      route: '/session',
    },
  ],
  'home-guide': [
    {
      selector: '[data-tour="logo"]',
      title: 'Home Page Guide',
      body: "More home tips coming soon! For now, explore the chips, stats, and notes on this screen at your own pace.",
      interactive: true,
      route: '/',
    },
  ],
  'dashboard-guide': [
    {
      selector: '[data-tour="logo"]',
      title: 'Dashboard Guide',
      body: "Dashboard guide coming soon! Head to the Dashboard from the menu to see your full stats breakdown.",
      interactive: true,
      route: '/',
    },
  ],
};

/** Backwards compat re-export for any leftover imports. */
export const TOUR_STEPS: TourStep[] = TOUR_PATHS['start-session'];
