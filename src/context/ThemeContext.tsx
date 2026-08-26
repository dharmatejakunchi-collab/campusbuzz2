import React, { createContext, useContext, useState, useEffect } from 'react';

export interface PastelThemeOption {
  id: string;
  name: string;
  tagline: string;
  category: 'Pastel Floral' | 'Pastel Sky' | 'Pastel Botanical' | 'Pastel Sweet' | 'Pastel Sunset';
  previewColors: string[];
  gradient: string;
  primaryClass: string;
  bgCanvas: string;
  textAccent: string;
  textPrimary: string;
  textMuted: string;
  borderAccent: string;
  bgAccent: string;
  activePillBg: string;
  activePillText: string;
  buttonGradient: string;
  bannerGradient: string;
  bannerText: string;
  bannerSubtext: string;
  cardStyle: string;
  badgeBg: string;
  ringFocus: string;
}

export const PASTEL_THEMES: PastelThemeOption[] = [
  {
    id: 'pastel-lilac',
    name: 'Lilac Blossom & Rose',
    tagline: 'Soft lavender mist, delicate baby pink, powdery cloud & sweet lilac accents (Default)',
    category: 'Pastel Floral',
    previewColors: ['#E9D5FF', '#FBCFE8', '#BAE6FD', '#DDD6FE'],
    gradient: 'from-purple-300 via-pink-300 to-indigo-300',
    primaryClass: 'purple',
    bgCanvas: 'bg-gradient-to-br from-purple-50/90 via-pink-50/70 to-indigo-50/80',
    textAccent: 'text-purple-600',
    textPrimary: 'text-slate-800',
    textMuted: 'text-slate-600',
    borderAccent: 'border-purple-200/80',
    bgAccent: 'bg-purple-100/60',
    activePillBg: 'bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 text-white shadow-md shadow-purple-200',
    activePillText: 'text-purple-700',
    buttonGradient: 'bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 hover:from-purple-500 hover:to-pink-500 text-white shadow-md shadow-purple-200/60 active:scale-[0.98]',
    bannerGradient: 'from-purple-100/95 via-pink-100/80 to-purple-50 border-purple-200/90 shadow-sm shadow-purple-100',
    bannerText: 'text-purple-950',
    bannerSubtext: 'text-purple-800/85',
    cardStyle: 'bg-white/95 border-purple-100/90 shadow-sm shadow-purple-100/40 hover:border-purple-300/80',
    badgeBg: 'bg-purple-100 text-purple-700 border-purple-200',
    ringFocus: 'focus:ring-purple-300',
  },
  {
    id: 'pastel-mint',
    name: 'Mint Matcha & Pistachio',
    tagline: 'Refreshing seafoam, soft sage green, pale honeydew & spring quad breeze',
    category: 'Pastel Botanical',
    previewColors: ['#A7F3D0', '#6EE7B7', '#D1FAE5', '#FEF08A'],
    gradient: 'from-emerald-300 via-teal-300 to-lime-300',
    primaryClass: 'emerald',
    bgCanvas: 'bg-gradient-to-br from-emerald-50/90 via-teal-50/70 to-lime-50/60',
    textAccent: 'text-emerald-600',
    textPrimary: 'text-slate-800',
    textMuted: 'text-slate-600',
    borderAccent: 'border-emerald-200/80',
    bgAccent: 'bg-emerald-100/60',
    activePillBg: 'bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400 text-white shadow-md shadow-emerald-200',
    activePillText: 'text-emerald-700',
    buttonGradient: 'bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-200/60 active:scale-[0.98]',
    bannerGradient: 'from-emerald-100/95 via-teal-100/80 to-lime-50 border-emerald-200/90 shadow-sm shadow-emerald-100',
    bannerText: 'text-emerald-950',
    bannerSubtext: 'text-emerald-800/85',
    cardStyle: 'bg-white/95 border-emerald-100/90 shadow-sm shadow-emerald-100/40 hover:border-emerald-300/80',
    badgeBg: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    ringFocus: 'focus:ring-emerald-300',
  },
  {
    id: 'pastel-sky',
    name: 'Cotton Candy Sky & Cloud',
    tagline: 'Soft baby blue, cotton candy powder pink, pale periwinkle & dreamy airy breeze',
    category: 'Pastel Sky',
    previewColors: ['#BAE6FD', '#FBCFE8', '#E0E7FF', '#93C5FD'],
    gradient: 'from-sky-300 via-indigo-300 to-pink-300',
    primaryClass: 'sky',
    bgCanvas: 'bg-gradient-to-br from-sky-50/90 via-indigo-50/60 to-pink-50/70',
    textAccent: 'text-sky-600',
    textPrimary: 'text-slate-800',
    textMuted: 'text-slate-600',
    borderAccent: 'border-sky-200/80',
    bgAccent: 'bg-sky-100/60',
    activePillBg: 'bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-400 text-white shadow-md shadow-sky-200',
    activePillText: 'text-sky-700',
    buttonGradient: 'bg-gradient-to-r from-sky-400 via-indigo-400 to-pink-400 hover:from-sky-500 hover:to-indigo-500 text-white shadow-md shadow-sky-200/60 active:scale-[0.98]',
    bannerGradient: 'from-sky-100/95 via-indigo-100/80 to-pink-50 border-sky-200/90 shadow-sm shadow-sky-100',
    bannerText: 'text-sky-950',
    bannerSubtext: 'text-sky-800/85',
    cardStyle: 'bg-white/95 border-sky-100/90 shadow-sm shadow-sky-100/40 hover:border-sky-300/80',
    badgeBg: 'bg-sky-100 text-sky-700 border-sky-200',
    ringFocus: 'focus:ring-sky-300',
  },
  {
    id: 'pastel-peach',
    name: 'Peach Sorbet & Buttercup',
    tagline: 'Warm pastel apricot, soft custard yellow, peach blossom & honey quad glow',
    category: 'Pastel Sweet',
    previewColors: ['#FED7AA', '#FEF08A', '#FBCFE8', '#FFEDD5'],
    gradient: 'from-amber-300 via-orange-300 to-rose-300',
    primaryClass: 'amber',
    bgCanvas: 'bg-gradient-to-br from-amber-50/90 via-orange-50/60 to-rose-50/70',
    textAccent: 'text-amber-600',
    textPrimary: 'text-slate-800',
    textMuted: 'text-slate-600',
    borderAccent: 'border-amber-200/80',
    bgAccent: 'bg-amber-100/60',
    activePillBg: 'bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 text-white shadow-md shadow-amber-200',
    activePillText: 'text-amber-700',
    buttonGradient: 'bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 hover:from-amber-500 hover:to-orange-500 text-white shadow-md shadow-amber-200/60 active:scale-[0.98]',
    bannerGradient: 'from-amber-100/95 via-orange-100/80 to-rose-50 border-amber-200/90 shadow-sm shadow-amber-100',
    bannerText: 'text-amber-950',
    bannerSubtext: 'text-amber-850',
    cardStyle: 'bg-white/95 border-amber-100/90 shadow-sm shadow-amber-100/40 hover:border-amber-300/80',
    badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
    ringFocus: 'focus:ring-amber-300',
  },
  {
    id: 'pastel-periwinkle',
    name: 'Periwinkle Lavender',
    tagline: 'Soothing soft wisteria, gentle indigo blue, powdered violet & serene calm',
    category: 'Pastel Floral',
    previewColors: ['#C7D2FE', '#DDD6FE', '#BAE6FD', '#E0E7FF'],
    gradient: 'from-indigo-300 via-purple-300 to-blue-300',
    primaryClass: 'indigo',
    bgCanvas: 'bg-gradient-to-br from-indigo-50/90 via-purple-50/70 to-blue-50/80',
    textAccent: 'text-indigo-600',
    textPrimary: 'text-slate-800',
    textMuted: 'text-slate-600',
    borderAccent: 'border-indigo-200/80',
    bgAccent: 'bg-indigo-100/60',
    activePillBg: 'bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 text-white shadow-md shadow-indigo-200',
    activePillText: 'text-indigo-700',
    buttonGradient: 'bg-gradient-to-r from-indigo-400 via-purple-400 to-blue-400 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md shadow-indigo-200/60 active:scale-[0.98]',
    bannerGradient: 'from-indigo-100/95 via-purple-100/80 to-blue-50 border-indigo-200/90 shadow-sm shadow-indigo-100',
    bannerText: 'text-indigo-950',
    bannerSubtext: 'text-indigo-800/85',
    cardStyle: 'bg-white/95 border-indigo-100/90 shadow-sm shadow-indigo-100/40 hover:border-indigo-300/80',
    badgeBg: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    ringFocus: 'focus:ring-indigo-300',
  },
  {
    id: 'pastel-rosewater',
    name: 'Rosewater & Strawberry Cream',
    tagline: 'Velvet soft blush, strawberry milk, creamy vanilla & floral campus glow',
    category: 'Pastel Sweet',
    previewColors: ['#FECDD3', '#FFE4E6', '#FBCFE8', '#FED7AA'],
    gradient: 'from-rose-300 via-pink-300 to-amber-200',
    primaryClass: 'rose',
    bgCanvas: 'bg-gradient-to-br from-rose-50/90 via-pink-50/70 to-amber-50/60',
    textAccent: 'text-rose-600',
    textPrimary: 'text-slate-800',
    textMuted: 'text-slate-600',
    borderAccent: 'border-rose-200/80',
    bgAccent: 'bg-rose-100/60',
    activePillBg: 'bg-gradient-to-r from-rose-400 via-pink-400 to-rose-400 text-white shadow-md shadow-rose-200',
    activePillText: 'text-rose-700',
    buttonGradient: 'bg-gradient-to-r from-rose-400 via-pink-400 to-rose-400 hover:from-rose-500 hover:to-pink-500 text-white shadow-md shadow-rose-200/60 active:scale-[0.98]',
    bannerGradient: 'from-rose-100/95 via-pink-100/80 to-amber-50 border-rose-200/90 shadow-sm shadow-rose-100',
    bannerText: 'text-rose-950',
    bannerSubtext: 'text-rose-800/85',
    cardStyle: 'bg-white/95 border-rose-100/90 shadow-sm shadow-rose-100/40 hover:border-rose-300/80',
    badgeBg: 'bg-rose-100 text-rose-700 border-rose-200',
    ringFocus: 'focus:ring-rose-300',
  }
];

export type ThemeOption = PastelThemeOption;
export const THEMES: PastelThemeOption[] = PASTEL_THEMES;

interface ThemeContextType {
  currentTheme: PastelThemeOption;
  themeId: string;
  setTheme: (themeId: string) => void;
  cycleNextTheme: () => void;
  themes: PastelThemeOption[];
}

const ThemeContext = createContext<ThemeContextType>({
  currentTheme: PASTEL_THEMES[0],
  themeId: 'pastel-lilac',
  setTheme: () => {},
  cycleNextTheme: () => {},
  themes: PASTEL_THEMES,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeId, setThemeId] = useState<string>(() => {
    const saved = localStorage.getItem('campus_buzz_pastel_theme');
    if (saved && PASTEL_THEMES.some((t) => t.id === saved)) {
      return saved;
    }
    return 'pastel-lilac';
  });

  const currentTheme = PASTEL_THEMES.find((t) => t.id === themeId) || PASTEL_THEMES[0];

  const setTheme = (newThemeId: string) => {
    setThemeId(newThemeId);
    localStorage.setItem('campus_buzz_pastel_theme', newThemeId);
  };

  const cycleNextTheme = () => {
    const currentIndex = PASTEL_THEMES.findIndex((t) => t.id === themeId);
    const nextIndex = (currentIndex + 1) % PASTEL_THEMES.length;
    const nextTheme = PASTEL_THEMES[nextIndex];
    setTheme(nextTheme.id);
  };

  useEffect(() => {
    // Keep document element in Light Pastel mode by default
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
    document.documentElement.setAttribute('data-theme', currentTheme.id);
  }, [currentTheme]);

  return (
    <ThemeContext.Provider value={{ currentTheme, themeId, setTheme, cycleNextTheme, themes: PASTEL_THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
