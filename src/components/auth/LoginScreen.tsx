import React from 'react';
import { motion } from 'motion/react';
import { Flame, ShieldCheck, Sparkles, Building2, EyeOff, Clock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export const LoginScreen: React.FC = () => {
  const { loginWithGoogle, loading, authError } = useAuth();
  const { currentTheme } = useTheme();

  return (
    <div className={`min-h-screen ${currentTheme.bgCanvas} flex flex-col justify-between text-slate-800 relative overflow-hidden transition-colors duration-300`}>
      
      {/* Decorative background glow circles */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-purple-200/50 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-32 w-96 h-96 bg-pink-200/50 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-sky-200/50 rounded-full blur-3xl pointer-events-none" />

      {/* Top Simple Bar */}
      <header className="relative z-10 max-w-7xl w-full mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-2xl bg-gradient-to-tr ${currentTheme.gradient} flex items-center justify-center shadow-md shadow-purple-200 text-white font-black text-xl`}>
            <Flame className="w-5.5 h-5.5 animate-pulse" />
          </div>
          <div>
            <span className="font-display font-black text-xl tracking-tight text-slate-800">
              Campus<span className={currentTheme.textAccent}>Buzz</span>
            </span>
            <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
              Student Platform
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-bold text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Verified University Accounts</span>
        </div>
      </header>

      {/* Main Login Card Section */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-xl bg-white/90 backdrop-blur-xl rounded-3xl border border-purple-100 shadow-xl p-8 sm:p-10 space-y-8"
        >
          {/* Logo & Headline */}
          <div className="text-center space-y-3">
            <div className={`inline-flex w-16 h-16 rounded-3xl bg-gradient-to-tr ${currentTheme.gradient} items-center justify-center shadow-lg shadow-purple-200/80 text-white mx-auto`}>
              <Flame className="w-8 h-8 animate-pulse" />
            </div>

            <div className="space-y-1.5">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                Sign in to Campus Buzz
              </h1>
              <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                Your university hub for live student intent coordination, official club broadcasts, campus event calendars, and anonymous facility tracking.
              </p>
            </div>
          </div>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2">
            <div className="flex items-start space-x-3 p-3.5 rounded-2xl bg-purple-50/60 border border-purple-100/80">
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 font-bold text-xs">
                🍕
              </div>
              <div className="text-xs">
                <div className="font-bold text-slate-800">#foodsplit & #cabsplit</div>
                <div className="text-slate-500 text-[11px] leading-tight">Instant live coordination rooms</div>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3.5 rounded-2xl bg-pink-50/60 border border-pink-100/80">
              <div className="w-8 h-8 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center shrink-0 font-bold text-xs">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <div className="font-bold text-slate-800">Official Club Hub</div>
                <div className="text-slate-500 text-[11px] leading-tight">Verified notices & forms</div>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3.5 rounded-2xl bg-sky-50/60 border border-sky-100/80">
              <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center shrink-0 font-bold text-xs">
                <Clock className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <div className="font-bold text-slate-800">Auto-Expiring Feeds</div>
                <div className="text-slate-500 text-[11px] leading-tight">Fresh campus updates in real-time</div>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3.5 rounded-2xl bg-rose-50/60 border border-rose-100/80">
              <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 font-bold text-xs">
                <EyeOff className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <div className="font-bold text-slate-800">Anonymous Grievance</div>
                <div className="text-slate-500 text-[11px] leading-tight">Direct to campus administration</div>
              </div>
            </div>
          </div>

          {/* Sign In Button Area */}
          <div className="space-y-4 pt-2">
            <button
              id="google-signin-btn"
              onClick={loginWithGoogle}
              disabled={loading}
              className="w-full flex items-center justify-center space-x-3 py-3.5 px-6 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm border-2 border-slate-200 hover:border-purple-300 shadow-md hover:shadow-lg transition-all active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed group cursor-pointer"
            >
              {/* Google G Logo SVG */}
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>{loading ? 'Opening Google Sign-In...' : 'Continue with Google'}</span>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all" />
            </button>

            <div className="flex items-center justify-center space-x-2 text-xs text-slate-500 text-center">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
              <span>Sign in with your university or personal Google account</span>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-4 text-center text-xs text-slate-500">
        <p>Campus Buzz • Safe, Verified & Unified Campus Coordination</p>
      </footer>
    </div>
  );
};
