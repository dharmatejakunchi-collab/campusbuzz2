import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, Copy, Check, ExternalLink, X, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AuthErrorModal: React.FC = () => {
  const { authError, clearAuthError, loginWithGoogle } = useAuth();
  const [copied, setCopied] = useState(false);

  if (!authError) return null;

  const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'campus-buzz-xi.vercel.app';
  const isUnauthorizedDomain = authError === 'unauthorized-domain';
  const isPopupBlocked = authError === 'popup-blocked';

  const handleCopyHost = () => {
    navigator.clipboard.writeText(currentHost);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-lg border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden relative"
        >
          {/* Header */}
          <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                isUnauthorizedDomain 
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400' 
                  : 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
              }`}>
                {isUnauthorizedDomain ? <ShieldAlert className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
                  {isUnauthorizedDomain 
                    ? 'Authorize Domain in Firebase' 
                    : isPopupBlocked 
                    ? 'Google Sign-In Popup Blocked' 
                    : 'Google Sign-In Notice'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isUnauthorizedDomain ? 'Action required for custom / Vercel domains' : 'Authentication process update'}
                </p>
              </div>
            </div>
            <button
              onClick={clearAuthError}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          {isUnauthorizedDomain ? (
            <div className="space-y-4 text-xs">
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Firebase Authentication restricts Google Sign-In popups on newly deployed domains until you whitelist the domain in your Firebase project console.
              </p>

              {/* Domain Copy Box */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Your Domain to Whitelist</div>
                  <div className="font-mono font-bold text-purple-600 dark:text-purple-400 text-sm mt-0.5 select-all">
                    {currentHost}
                  </div>
                </div>
                <button
                  onClick={handleCopyHost}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-purple-100 hover:bg-purple-200 dark:bg-purple-950/80 dark:hover:bg-purple-900 text-purple-700 dark:text-purple-300 font-bold text-xs rounded-xl transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>

              {/* 3 Steps */}
              <div className="bg-amber-50/60 dark:bg-amber-950/30 p-4 rounded-2xl border border-amber-200/80 dark:border-amber-900/50 space-y-2.5">
                <div className="font-bold text-amber-900 dark:text-amber-300 text-xs flex items-center space-x-1.5">
                  <span>How to authorize in 30 seconds:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-600 dark:text-slate-300">
                  <li>
                    Open{' '}
                    <a
                      href="https://console.firebase.google.com/"
                      target="_blank"
                      rel="noreferrer"
                      className="text-purple-600 dark:text-purple-400 underline font-semibold inline-flex items-center space-x-0.5"
                    >
                      <span>Firebase Console</span>
                      <ExternalLink className="w-3 h-3 inline" />
                    </a>
                  </li>
                  <li>
                    Go to <strong className="text-slate-800 dark:text-slate-200">Authentication</strong> &rarr; <strong className="text-slate-800 dark:text-slate-200">Settings</strong> &rarr; <strong className="text-slate-800 dark:text-slate-200">Authorized domains</strong>
                  </li>
                  <li>
                    Click <strong className="text-slate-800 dark:text-slate-200">Add domain</strong> &rarr; paste <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded text-[11px] font-bold">{currentHost}</code> &rarr; save
                  </li>
                </ol>
              </div>
            </div>
          ) : isPopupBlocked ? (
            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-3">
              <p>Your browser blocked the Google authentication popup window.</p>
              <p>Please check your browser address bar to allow popups from this website, then try again.</p>
            </div>
          ) : (
            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-3">
              <p className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 font-mono">
                {authError}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-2.5 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={clearAuthError}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => {
                clearAuthError();
                loginWithGoogle();
              }}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition-colors"
            >
              Retry Google Sign-In
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
