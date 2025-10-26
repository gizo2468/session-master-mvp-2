/**
 * App-Specific Profiles
 * Configuration for different poker applications
 */

export interface AppProfile {
  dealerButton: {
    color: string;
    shape: string;
    text: string;
  };
  heroPosition: string;
  colorScheme: 'ggpoker' | 'pokerstars' | 'standard';
  actionPanelPosition: string;
  heroHighlightColor: string;
  description: string;
}

export const APP_PROFILES: Record<string, AppProfile> = {
  ggpoker: {
    dealerButton: { 
      color: 'yellow', 
      shape: 'circle', 
      text: 'D' 
    },
    heroPosition: 'BOTTOM_CENTER',
    colorScheme: 'ggpoker',
    actionPanelPosition: 'left',
    heroHighlightColor: 'yellow',
    description: 'GGPoker uses a yellow circular dealer button, four-color deck (red/blue/green/black), and action panel on the left'
  },
  
  clubgg: {
    dealerButton: { 
      color: 'yellow', 
      shape: 'circle', 
      text: 'D' 
    },
    heroPosition: 'BOTTOM_CENTER',
    colorScheme: 'ggpoker',
    actionPanelPosition: 'left',
    heroHighlightColor: 'yellow',
    description: 'ClubGG uses GGPoker-style interface with yellow dealer button and four-color deck'
  },
  
  pokerstars: {
    dealerButton: { 
      color: 'white', 
      shape: 'circle', 
      text: 'D' 
    },
    heroPosition: 'BOTTOM_CENTER',
    colorScheme: 'pokerstars',
    actionPanelPosition: 'bottom',
    heroHighlightColor: 'blue',
    description: 'PokerStars uses a white/blue dealer button and may use four-color deck (red/blue/green/orange) or traditional'
  },
  
  '888poker': {
    dealerButton: { 
      color: 'gold', 
      shape: 'rounded', 
      text: 'BTN' 
    },
    heroPosition: 'BOTTOM_CENTER',
    colorScheme: 'standard',
    actionPanelPosition: 'bottom',
    heroHighlightColor: 'orange',
    description: '888poker uses gold dealer button with "BTN" text and traditional deck with thicker borders'
  },
  
  partypoker: {
    dealerButton: { 
      color: 'white', 
      shape: 'rounded', 
      text: 'D' 
    },
    heroPosition: 'BOTTOM_CENTER',
    colorScheme: 'standard',
    actionPanelPosition: 'left',
    heroHighlightColor: 'green',
    description: 'PartyPoker uses white rounded dealer button and traditional deck'
  },
  
  unknown: {
    dealerButton: { 
      color: 'any', 
      shape: 'any', 
      text: 'D or BTN' 
    },
    heroPosition: 'BOTTOM_CENTER',
    colorScheme: 'standard',
    actionPanelPosition: 'bottom',
    heroHighlightColor: 'yellow',
    description: 'Unknown app - using generic detection with fallback logic'
  }
};

/**
 * Get app profile with fallback
 */
export function getAppProfile(appName: string): AppProfile {
  return APP_PROFILES[appName] || APP_PROFILES.unknown;
}

/**
 * Color scheme mappings
 */
export const COLOR_SCHEMES = {
  ggpoker: {
    red: 'h',
    blue: 'd',
    green: 'c',
    black: 's'
  },
  pokerstars: {
    red: 'h',
    blue: 'd',
    green: 'c',
    orange: 's',
    yellow: 's'
  },
  standard: {
    // Traditional symbol-based detection
  }
};

/**
 * Map color to suit using app-specific scheme
 */
export function mapColorToSuit(color: string, scheme: 'ggpoker' | 'pokerstars' | 'standard' = 'ggpoker'): string {
  const colorLower = color.toLowerCase();
  const mapping = COLOR_SCHEMES[scheme];
  
  if (!mapping || scheme === 'standard') {
    // For standard decks, rely on symbol detection
    return '?';
  }
  
  return mapping[colorLower as keyof typeof mapping] || '?';
}
