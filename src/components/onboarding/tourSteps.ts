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
}

export const TOUR_STEPS: TourStep[] = [
  {
    selector: '[data-tour="logo"]',
    title: 'Welcome to Session Master',
    body: "We're glad to have you here! Before you jump into the action, let's take a quick 30-second tour to show you where everything is and how to track your first winning session.",
    route: '/',
  },
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
    body: 'Enter your starting buy-in and the table blinds. This is essential for calculating your profit and loss accurately.',
    interactive: true,
    route: '/new-session',
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
];
