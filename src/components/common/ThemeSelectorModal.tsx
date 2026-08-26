import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Palette, Check, Sparkles, X, Heart, Flower2, Cloud, Sun, Leaf } from 'lucide-react';
import { useTheme, PASTEL_THEMES } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

interface ThemeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThemeSelectorModal: React.FC<ThemeSelectorModalProps> = ({ isOpen, onClose }) => {
  const { themeId, setTheme, currentTheme } = useTheme();
  const { profile, updateProfileData } = useAuth();

  const handleSelectTheme = (id: string) => {
    setTheme(id);
    if (profile?.uid) {
      updateProfileData({ preferredTheme: id });
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Pastel Floral':
        return <Flower2 className="w-3.5 h-3.5 text-pink-400" />;
      case 'Pastel Sky':
        return <Cloud className="w-3.5 h-3.5 text-sky-400" />;
      case 'Pastel Botanical':
        return <Leaf className="w-3.5 h-3.5 text-emerald-400" />;
      case 'Pastel Sweet':
        return <Heart className="w-3.5 h-3.5 text-rose-400" />;
      default:
        return <Sun className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-purple-950/20 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-xl bg-white/95 rounded-3xl shadow-2xl border border-purple-100/90 overflow-hidden z-10 p-6 space-y-6"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between border-b border-purple-100 pb-4">
            <div className="flex items-center space-x-3">
              <div className={`p-2.5 rounded-2xl bg-gradient-to-tr ${currentTheme.gradient} text-white shadow-md shadow-purple-200`}>
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display font-black text-xl text-slate-800 flex items-center gap-2">
                  <span>Light Pastel Theme Studio</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 font-bold border border-purple-200">
                    {PASTEL_THEMES.length} Palettes
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  Select a soothing light pastel aesthetic for your campus dashboard
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-purple-50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Theme Choices Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
            {PASTEL_THEMES.map((theme) => {
              const isSelected = themeId === theme.id;
              return (
                <motion.button
                  key={theme.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelectTheme(theme.id)}
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between space-y-3 transition-all relative overflow-hidden ${
                    isSelected
                      ? 'bg-purple-50/70 border-2 border-purple-400 shadow-md shadow-purple-200/50 ring-2 ring-purple-300/30'
                      : 'bg-white border-purple-100/80 hover:border-purple-200 hover:bg-purple-50/30'
                  }`}
                >
                  {/* Selected check ribbon */}
                  {isSelected && (
                    <div className="absolute top-2.5 right-2.5 flex items-center space-x-1 px-2 py-0.5 rounded-full bg-purple-500 text-white text-[10px] font-black uppercase shadow-xs">
                      <Check className="w-3 h-3 stroke-[3]" />
                      <span>Selected</span>
                    </div>
                  )}

                  <div>
                    {/* Color Swatch Dots */}
                    <div className="flex items-center space-x-1.5 mb-2.5">
                      {theme.previewColors.map((col, idx) => (
                        <div
                          key={idx}
                          className="w-4 h-4 rounded-full shadow-xs border border-white ring-1 ring-slate-200"
                          style={{ backgroundColor: col }}
                        />
                      ))}
                      <span className="text-[10px] uppercase font-bold text-slate-500 ml-1 flex items-center gap-1">
                        {getCategoryIcon(theme.category)}
                        {theme.category}
                      </span>
                    </div>

                    {/* Theme Name */}
                    <div className="font-display font-extrabold text-sm text-slate-800 flex items-center space-x-1.5">
                      <span>{theme.name}</span>
                    </div>

                    {/* Tagline */}
                    <p className="text-xs text-slate-500 mt-1 leading-snug">
                      {theme.tagline}
                    </p>
                  </div>

                  {/* Gradient preview bar */}
                  <div className={`h-2.5 w-full rounded-full bg-gradient-to-r ${theme.gradient} shadow-xs border border-white/50`} />
                </motion.button>
              );
            })}
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-purple-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center space-x-1.5 text-purple-600 font-medium">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Pastel palette applied instantly</span>
            </span>
            <button
              onClick={onClose}
              className={`px-5 py-2 ${currentTheme.buttonGradient} font-bold rounded-xl shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]`}
            >
              Enjoy Pastel Theme
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
