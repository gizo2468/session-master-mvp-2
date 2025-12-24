
import { CoachTier, CoachTierDetails, UserRole } from '@/types/poker';

// Define the coach tiers
export const coachTiers: Record<CoachTier, CoachTierDetails> = {
  free: {
    name: 'Free',
    tier: 'free',
    price: 0,
    maxStudents: 5,
    features: ['Student Management', 'Comment Tagging'],
  },
  starter: {
    name: 'Starter Coach',
    tier: 'starter',
    price: 10,
    maxStudents: 10,
    features: [
      'Student Management',
      'Session Feedback',
      'Advanced Analytics',
      'Comment Tagging',
      'Student History View'
    ],
  },
  pro: {
    name: 'Pro Coach',
    tier: 'pro',
    price: 15,
    maxStudents: 15,
    features: [
      'Student Management',
      'Session Feedback',
      'Advanced Analytics',
      'Comment Tagging',
      'Student History View',
      'Notification System',
      'Priority Support'
    ],
  },
  elite: {
    name: 'Elite Coach',
    tier: 'elite',
    price: 25,
    maxStudents: 25,
    features: [
      'Student Management',
      'Session Feedback',
      'Advanced Analytics',
      'Comment Tagging',
      'Student History View',
      'Notification System',
      'Priority Support',
      'Custom Branding',
      'Export Tools'
    ],
  },
};

// Check if user has access to a specific feature based on their coach tier
export const hasFeatureAccess = (
  userRole: UserRole | undefined,
  userTier: CoachTier | undefined,
  featureName: string
): boolean => {
  if (!userRole || userRole !== 'coach') return false;
  if (!userTier) return false;
  
  const tierDetails = coachTiers[userTier];
  return tierDetails.features.includes(featureName);
};

// Check if user is at max student capacity
export const isAtStudentLimit = (
  userTier: CoachTier | undefined,
  currentStudentCount: number
): boolean => {
  if (!userTier) return true;
  
  const tierDetails = coachTiers[userTier];
  return currentStudentCount >= tierDetails.maxStudents;
};

// Get the maximum number of students for a coach tier
export const getMaxStudents = (userTier: CoachTier | undefined): number => {
  if (!userTier) return 0;
  return coachTiers[userTier].maxStudents;
};

// Get all available coach tiers for upgrade
export const getAvailableTiers = (currentTier: CoachTier | undefined): CoachTierDetails[] => {
  if (!currentTier) return Object.values(coachTiers);
  
  // Return all tiers except current tier and free tier (since you can't downgrade to free)
  return Object.values(coachTiers).filter(
    tier => tier.tier !== currentTier && tier.tier !== 'free'
  );
};
