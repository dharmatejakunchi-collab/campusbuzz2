import { HashtagType } from '../types';

export interface HashtagInfo {
  tag: HashtagType;
  displayName: string;
  badgeLabel: string;
  description: string;
  actionTitle: string;
  actionIcon: string;
  requiresTimer: boolean;
  colorClass: {
    bg: string;
    text: string;
    border: string;
    pill: string;
    accent: string;
    glow: string;
  };
}

export const HASHTAG_CONFIGS: Record<HashtagType, HashtagInfo> = {
  foodsplit: {
    tag: 'foodsplit',
    displayName: '#foodsplit',
    badgeLabel: 'Food Order Split',
    description: 'Pool orders together to meet minimum delivery thresholds and split delivery fees/tips.',
    actionTitle: 'Join Live Order Room',
    actionIcon: 'UtensilsCrossed',
    requiresTimer: true,
    colorClass: {
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-200',
      pill: 'bg-amber-100 text-amber-900 border-amber-200 shadow-xs',
      accent: 'bg-gradient-to-r from-amber-400 to-orange-400',
      glow: 'shadow-amber-200/50'
    }
  },
  cabsplit: {
    tag: 'cabsplit',
    displayName: '#cabsplit',
    badgeLabel: 'Ride & Fare Split',
    description: 'Find campus companions heading the same direction to share Uber/Lyft/cabs.',
    actionTitle: 'Join Ride Room',
    actionIcon: 'Car',
    requiresTimer: true,
    colorClass: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-800',
      border: 'border-emerald-200',
      pill: 'bg-emerald-100 text-emerald-900 border-emerald-200 shadow-xs',
      accent: 'bg-gradient-to-r from-emerald-400 to-teal-400',
      glow: 'shadow-emerald-200/50'
    }
  },
  resell: {
    tag: 'resell',
    displayName: '#resell',
    badgeLabel: 'Campus Resale',
    description: 'Buy & sell textbooks, electronics, cycles, and room decor directly with campus peers.',
    actionTitle: 'Open Resell Room',
    actionIcon: 'Tag',
    requiresTimer: false,
    colorClass: {
      bg: 'bg-purple-50',
      text: 'text-purple-800',
      border: 'border-purple-200',
      pill: 'bg-purple-100 text-purple-900 border-purple-200 shadow-xs',
      accent: 'bg-gradient-to-r from-purple-400 to-pink-400',
      glow: 'shadow-purple-200/50'
    }
  },
  lost: {
    tag: 'lost',
    displayName: '#lost',
    badgeLabel: 'Lost Item',
    description: 'Post missing items to alert campus peers with direct private contact info.',
    actionTitle: 'View Contact Info',
    actionIcon: 'HelpCircle',
    requiresTimer: false,
    colorClass: {
      bg: 'bg-rose-50',
      text: 'text-rose-800',
      border: 'border-rose-200',
      pill: 'bg-rose-100 text-rose-900 border-rose-200 shadow-xs',
      accent: 'bg-gradient-to-r from-rose-400 to-pink-400',
      glow: 'shadow-rose-200/50'
    }
  },
  found: {
    tag: 'found',
    displayName: '#found',
    badgeLabel: 'Found Item',
    description: 'Found unattended belongings on campus. Connect privately with the rightful owner.',
    actionTitle: 'Contact Finder',
    actionIcon: 'Compass',
    requiresTimer: false,
    colorClass: {
      bg: 'bg-sky-50',
      text: 'text-sky-800',
      border: 'border-sky-200',
      pill: 'bg-sky-100 text-sky-900 border-sky-200 shadow-xs',
      accent: 'bg-gradient-to-r from-sky-400 to-indigo-400',
      glow: 'shadow-sky-200/50'
    }
  },
  general: {
    tag: 'general',
    displayName: '#campus',
    badgeLabel: 'Campus Discussion',
    description: 'General campus buzz and announcements.',
    actionTitle: 'View Discussion',
    actionIcon: 'MessageSquare',
    requiresTimer: false,
    colorClass: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-800',
      border: 'border-indigo-200',
      pill: 'bg-indigo-100 text-indigo-900 border-indigo-200 shadow-xs',
      accent: 'bg-gradient-to-r from-indigo-400 to-purple-400',
      glow: 'shadow-indigo-200/50'
    }
  }
};

export function extractPrimaryHashtag(hashtags: string[]): HashtagType {
  if (!hashtags || hashtags.length === 0) return 'general';
  for (const h of hashtags) {
    const clean = h.replace(/^#/, '').toLowerCase().trim();
    if (clean in HASHTAG_CONFIGS) {
      return clean as HashtagType;
    }
  }
  return 'general';
}
