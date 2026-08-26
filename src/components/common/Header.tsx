import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Flame, 
  Sparkles, 
  Calendar, 
  ShieldAlert, 
  Building2, 
  Plus, 
  LogIn, 
  LogOut, 
  UserCheck, 
  ChevronDown,
  Compass,
  Radio,
  Sun,
  Moon,
  Zap,
  Check,
  Palette,
  ShieldCheck,
  Megaphone,
  X
} from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { ThemeSelectorModal } from './ThemeSelectorModal';
import { INITIAL_USERS } from '../../lib/seedData';
import { NavigationTab, UserProfile } from '../../types';

interface HeaderProps {
  activeTab: NavigationTab;
  setActiveTab?: (tab: NavigationTab) => void;
  onTabChange?: (tab: NavigationTab) => void;
  onOpenCreatePost: () => void;
  onOpenProfile?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onTabChange,
  onOpenCreatePost,
  onOpenProfile
}) => {
  const { user, profile, role, loginWithGoogle, logout, setDemoUser } = useAuth();
  const { currentTheme } = useTheme();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [broadcastData, setBroadcastData] = useState<{ message?: string; active?: boolean; type?: string } | null>(null);
  const [dismissBroadcast, setDismissBroadcast] = useState(false);

  useEffect(() => {
    // Listen for real-time broadcast banner
    const unsub = onSnapshot(
      doc(db, 'system_config', 'broadcast'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setBroadcastData(data);
          setDismissBroadcast(false);
        } else {
          setBroadcastData(null);
        }
      },
      (err) => {
        console.warn('Notice reading broadcast config:', err.message);
      }
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    // Check initial dark mode
    if (document.documentElement.classList.contains('dark') || 
        (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches) ||
        localStorage.theme === 'dark') {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
      setIsDark(true);
    }
  };

  const handleTabSelect = (tab: NavigationTab) => {
    setActiveTab?.(tab);
    onTabChange?.(tab);
  };

  const getRoleBadge = () => {
    switch (role) {
      case 'admin':
        return { label: 'Admin', color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30' };
      case 'club':
        return { label: 'Club Rep', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30' };
      case 'committee':
        return { label: 'Committee', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30' };
      default:
        return { label: 'Student', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' };
    }
  };

  const badge = getRoleBadge();

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-purple-100/80 transition-colors shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo & Brand */}
            <div 
              className="flex items-center space-x-3 cursor-pointer group" 
              onClick={() => handleTabSelect('feed')}
            >
              <div className={`w-10 h-10 rounded-2xl bg-gradient-to-tr ${currentTheme.gradient} flex items-center justify-center shadow-md shadow-purple-200 text-white font-black text-xl tracking-wider group-hover:scale-105 transition-transform duration-200`}>
                <Flame className="w-5.5 h-5.5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-display font-black text-xl tracking-tight text-slate-800">
                    Campus<span className={currentTheme.textAccent}>Buzz</span>
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mr-1.5 animate-ping" />
                    Pastel Quad
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                  Campus Coordination & Community Platform
                </p>
              </div>
            </div>

            {/* Center Navigation Links with Framer Motion Sliding Pill */}
            <nav className="hidden md:flex items-center space-x-1 bg-purple-50/70 p-1.5 rounded-2xl border border-purple-100/90 relative">
              <button
                id="nav-feed-tab"
                onClick={() => handleTabSelect('feed')}
                className={`relative z-10 flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors duration-150 ${
                  activeTab === 'feed'
                    ? 'text-purple-900 font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {activeTab === 'feed' && (
                  <motion.div
                    layoutId="header-active-tab-pill"
                    className="absolute inset-0 bg-white rounded-xl shadow-xs border border-purple-200/60 -z-10"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <Flame className="w-4 h-4 text-purple-500" />
                <span>Buzz Feed</span>
              </button>

              <button
                id="nav-clubs-tab"
                onClick={() => handleTabSelect('clubs')}
                className={`relative z-10 flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors duration-150 ${
                  activeTab === 'clubs'
                    ? 'text-pink-900 font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {activeTab === 'clubs' && (
                  <motion.div
                    layoutId="header-active-tab-pill"
                    className="absolute inset-0 bg-white rounded-xl shadow-xs border border-pink-200/60 -z-10"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <Building2 className="w-4 h-4 text-pink-500" />
                <span>Clubs & Hub</span>
                {(role === 'club' || role === 'committee' || role === 'admin') && (
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
                )}
              </button>

              <button
                id="nav-calendar-tab"
                onClick={() => handleTabSelect('calendar')}
                className={`relative z-10 flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors duration-150 ${
                  activeTab === 'calendar'
                    ? 'text-sky-900 font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {activeTab === 'calendar' && (
                  <motion.div
                    layoutId="header-active-tab-pill"
                    className="absolute inset-0 bg-white rounded-xl shadow-xs border border-sky-200/60 -z-10"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <Calendar className="w-4 h-4 text-sky-500" />
                <span>Campus Events</span>
              </button>

              <button
                id="nav-complaints-tab"
                onClick={() => handleTabSelect('complaints')}
                className={`relative z-10 flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors duration-150 ${
                  activeTab === 'complaints'
                    ? 'text-rose-900 font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {activeTab === 'complaints' && (
                  <motion.div
                    layoutId="header-active-tab-pill"
                    className="absolute inset-0 bg-white rounded-xl shadow-xs border border-rose-200/60 -z-10"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <ShieldAlert className="w-4 h-4 text-rose-500" />
                <span>Grievances</span>
              </button>

              {role === 'admin' && (
                <button
                  id="nav-admin-tab"
                  onClick={() => handleTabSelect('admin')}
                  className={`relative z-10 flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors duration-150 ${
                    activeTab === 'admin'
                      ? 'text-purple-900 font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {activeTab === 'admin' && (
                    <motion.div
                      layoutId="header-active-tab-pill"
                      className="absolute inset-0 bg-white rounded-xl shadow-xs border border-purple-300/60 -z-10"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  <span>Admin Panel</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-pulse" />
                </button>
              )}
            </nav>

            {/* Right Action Area */}
            <div className="flex items-center space-x-2">
              
              {/* Theme Palette Chooser Button */}
              <button
                id="theme-palette-btn"
                onClick={() => setShowThemeModal(true)}
                title={`Theme: ${currentTheme.name}. Click to change theme`}
                className="flex items-center space-x-1.5 p-2 sm:px-3 sm:py-2 rounded-xl border border-purple-200/90 bg-purple-50/50 text-slate-700 hover:bg-purple-100/60 transition-all text-xs font-bold shadow-xs"
              >
                <div className="flex items-center -space-x-1">
                  {currentTheme.previewColors.map((c, i) => (
                    <span
                      key={i}
                      className="w-2.5 h-2.5 rounded-full border border-white shadow-xs"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <span className="hidden lg:inline text-slate-800">{currentTheme.name}</span>
              </button>

              {/* Create Post Action Button */}
              <button
                id="header-create-post-btn"
                onClick={onOpenCreatePost}
                className={`flex items-center space-x-1.5 px-3.5 py-2 ${currentTheme.buttonGradient} text-white font-bold text-xs rounded-xl shadow-md transition-all duration-150`}
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span className="hidden sm:inline">Post Buzz</span>
              </button>

              {/* Role Switcher & User Profile Menu */}
              <div className="relative">
                <button
                  id="user-role-dropdown-btn"
                  onClick={() => setShowRoleMenu(!showRoleMenu)}
                  className="flex items-center space-x-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-purple-100 bg-white hover:bg-purple-50/60 transition-all text-left shadow-xs"
                >
                  <img
                    src={profile?.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                    alt={profile?.displayName || 'User'}
                    className="w-7 h-7 rounded-xl object-cover border border-purple-200 shadow-xs"
                  />
                  <div className="hidden sm:block text-xs">
                    <div className="font-bold text-slate-800 leading-tight max-w-[95px] truncate">
                      {profile?.displayName || 'Student'}
                    </div>
                    <div className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md border inline-block ${badge.color}`}>
                      {badge.label}
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {showRoleMenu && (
                  <div className="absolute right-0 mt-2 w-76 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-3 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 rounded-2xl mb-2">
                      <div className="font-display font-bold text-sm text-slate-900 dark:text-white">
                        {profile?.displayName}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {profile?.email}
                      </div>
                      <div className="mt-1.5 flex items-center space-x-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${badge.color}`}>
                          {badge.label}
                        </span>
                        {profile?.studentId && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            ID: {profile.studentId}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Demo Role Switcher section */}
                    <div className="space-y-1 mb-2">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1 flex items-center justify-between">
                        <span>Switch Demo Persona</span>
                        <Zap className="w-3 h-3 text-amber-500" />
                      </div>
                      {INITIAL_USERS.map((u) => {
                        const isSelected = profile?.uid === u.uid;
                        return (
                          <button
                            key={u.uid}
                            onClick={() => {
                              setDemoUser(u);
                              setShowRoleMenu(false);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                              isSelected
                                ? 'bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 font-bold border border-orange-200 dark:border-orange-900/60'
                                : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              <img src={u.photoURL} alt={u.displayName} className="w-5.5 h-5.5 rounded-lg object-cover" />
                              <span className="truncate max-w-[125px]">{u.displayName}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase font-bold">
                                {u.role}
                              </span>
                              {isSelected && <Check className="w-3 h-3 text-orange-500" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col space-y-1">
                      {role === 'admin' && (
                        <button
                          onClick={() => {
                            handleTabSelect('admin');
                            setShowRoleMenu(false);
                          }}
                          className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 rounded-xl"
                        >
                          <ShieldCheck className="w-4 h-4 text-purple-600" />
                          <span>Open Admin Command Console</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setShowThemeModal(true);
                          setShowRoleMenu(false);
                        }}
                        className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                      >
                        <Palette className="w-4 h-4 text-purple-500" />
                        <span>Change Color Theme</span>
                      </button>

                      <button
                        onClick={() => {
                          onOpenProfile?.();
                          setShowRoleMenu(false);
                        }}
                        className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                      >
                        <UserCheck className="w-4 h-4 text-purple-500" />
                        <span>Edit My Campus Profile</span>
                      </button>

                      {user ? (
                        <button
                          onClick={() => {
                            logout();
                            setShowRoleMenu(false);
                          }}
                          className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out from Google</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            loginWithGoogle();
                            setShowRoleMenu(false);
                          }}
                          className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-xl"
                        >
                          <LogIn className="w-4 h-4" />
                          <span>Sign In with Gmail (Google)</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Mobile Navigation Bar */}
          <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-200/80 dark:border-slate-800 text-xs">
            <button
              onClick={() => handleTabSelect('feed')}
              className={`flex flex-col items-center py-1 font-semibold transition-colors ${
                activeTab === 'feed' ? currentTheme.textAccent : 'text-slate-500'
              }`}
            >
              <Flame className="w-4 h-4 mb-0.5" />
              <span>Feed</span>
            </button>
            <button
              onClick={() => handleTabSelect('clubs')}
              className={`flex flex-col items-center py-1 font-semibold transition-colors ${
                activeTab === 'clubs' ? 'text-purple-500' : 'text-slate-500'
              }`}
            >
              <Building2 className="w-4 h-4 mb-0.5" />
              <span>Clubs</span>
            </button>
            <button
              onClick={() => handleTabSelect('calendar')}
              className={`flex flex-col items-center py-1 font-semibold transition-colors ${
                activeTab === 'calendar' ? 'text-blue-500' : 'text-slate-500'
              }`}
            >
              <Calendar className="w-4 h-4 mb-0.5" />
              <span>Events</span>
            </button>
            <button
              onClick={() => handleTabSelect('complaints')}
              className={`flex flex-col items-center py-1 font-semibold transition-colors ${
                activeTab === 'complaints' ? 'text-rose-500' : 'text-slate-500'
              }`}
            >
              <ShieldAlert className="w-4 h-4 mb-0.5" />
              <span>Grievance</span>
            </button>
            {role === 'admin' && (
              <button
                onClick={() => handleTabSelect('admin')}
                className={`flex flex-col items-center py-1 font-semibold transition-colors ${
                  activeTab === 'admin' ? 'text-purple-600 dark:text-purple-400' : 'text-slate-500'
                }`}
              >
                <ShieldCheck className="w-4 h-4 mb-0.5" />
                <span>Admin</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Real-time Campus Alert Broadcast Banner */}
      {broadcastData?.active && broadcastData?.message && !dismissBroadcast && (
        <div
          className={`w-full py-2.5 px-4 sm:px-6 flex items-center justify-between text-xs font-semibold border-b shadow-xs transition-all ${
            broadcastData.type === 'alert'
              ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-950 dark:text-rose-200 border-rose-300/80 dark:border-rose-900'
              : broadcastData.type === 'event'
              ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-950 dark:text-purple-200 border-purple-300/80 dark:border-purple-900'
              : 'bg-sky-100 dark:bg-sky-950/80 text-sky-950 dark:text-sky-200 border-sky-300/80 dark:border-sky-900'
          }`}
        >
          <div className="max-w-7xl mx-auto flex items-center space-x-2.5 flex-1 pr-2">
            <Megaphone className="w-4 h-4 shrink-0 animate-bounce" />
            <span className="leading-snug">{broadcastData.message}</span>
          </div>
          <button
            onClick={() => setDismissBroadcast(true)}
            className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-current transition-colors"
            title="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Theme Selector Modal */}
      <ThemeSelectorModal
        isOpen={showThemeModal}
        onClose={() => setShowThemeModal(false)}
      />
    </>
  );
};

