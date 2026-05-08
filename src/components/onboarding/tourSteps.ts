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
      body: 'Select your preferred game type and format. These settings help us categorize your data correctly.',
      interactive: true,
      route: '/new-session',
    },
    {
      selector: '[data-tour="stakes"]',
      title: 'Set the Stakes',
      body: 'Buy-in is the only field you need to start a session — everything else is optional. Enter your starting buy-in to continue, or adjust the blinds if you want more accurate stats.',
      interactive: true,
      route: '/new-session',
    },
    {
      selector: '[data-tour="optional-details"]',
      title: 'Optional Details (Optional)',
      body: "Give your session or first table a custom name so it's easier to find in your history. You can also log the location or online poker site here. Don't worry, you can skip this if you're in a rush!",
      interactive: true,
      route: '/new-session',
      prepare: openAdvanced,
    },
    {
      selector: '[data-tour="advanced-online"]',
      title: 'Online Game',
      body: "Toggle this on if you're playing online. You can also note where you're playing from.",
      interactive: true,
      route: '/new-session',
      prepare: openAdvanced,
    },
    {
      selector: '[data-tour="advanced-multiday"]',
      title: 'Multi-Day Tournament',
      body: 'For tournaments that span multiple days, enable this so we track each day correctly.',
      interactive: true,
      route: '/new-session',
      prepare: openAdvanced,
    },
    {
      selector: '[data-tour="advanced-late-reg"]',
      title: 'Late Registration',
      body: 'Enable this if late registration is still available for the tournament.',
      interactive: true,
      route: '/new-session',
      prepare: openAdvanced,
    },
    {
      selector: '[data-tour="submit-session"]',
      title: "You're All Set!",
      body: "Fill in the details and hit 'Start Session' to begin tracking. Good luck at the tables!",
      interactive: true,
      route: '/new-session',
    },
    {
      selector: '[data-tour="live-scoreboard"]',
      title: 'Track Your Edge',
      body: 'This is your live scoreboard. Watch your profit or loss update in real-time as you log your hands and actions.',
      interactive: true,
      route: '/session',
    },
    {
      selector: '[data-tour="live-actions"]',
      title: 'Stay Active',
      body: "Use these buttons to log every important moment. Whether it's a big pot or a strategic note, keep your data fresh!",
      interactive: true,
      route: '/session',
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
