import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, Copy, Check, ExternalLink, X, AlertTriangle, GraduationCap, Lock, ArrowRight, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserProfile } from '../../types';

// Preloaded known profiles for instant access on external/Vercel domains
const REGISTERED_ACCOUNTS: Partial<UserProfile>[] = [
  {
    uid: 'NNIBQj7wsug20EkXTkNL6G5yFTd2',
    displayName: 'kunchi dharmateja',
    email: 'dharmatejakunchi@gmail.com',
    role: 'admin',
    studentId: 'STU-9047',
    hostel: 'Hostel Block C, Room 204',
    department: 'NITRR Administration',
    verifiedStudent: true,
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  },
  {
    uid: 'AJpPD7KGsMen1BKl1fBTrMxW82t1',
    displayName: 'kunchi teja',
    email: 'kdteja057.btech2025@cse.nitrr.ac.in',
    role: 'student',
    studentId: 'STU-6547',
    hostel: 'Hostel Block B, Room 102',
    department: 'Department of CSE',
    verifiedStudent: true,
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  },
  {
    uid: 'mhDd5Y1ADPWAArjoYEj517zI8QX2',
    displayName: 'Teja Dharma',
    email: 'kunchidharmateja3014@gmail.com',
    role: 'student',
    studentId: 'STU-8348',
    hostel: 'Hostel Block C, Room 204',
    department: 'Computer Science',
    verifiedStudent: true,
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  }
];

export const AuthErrorModal: React.FC = () => {
  const { authError, clearAuthError, loginWithGoogle, loginAsProfile } = useAuth();
  const [copied, setCopied] = useState(false);

  if (!authError) return null;

  const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'campusbuzz2.vercel.app';
  const isUnauthorizedDomain = authError === 'unauthorized-domain';
  const isPopupBlocked = authError === 'popup-blocked';
  const isInvalidInstituteDomain = authError.startsWith('invalid-domain:');
  const rejectedEmail = isInvalidInstituteDomain ? authError.split('invalid-domain:')[1] : '';

  const handleCopyHost = () => {
    navigator.clipboard.writeText(currentHost);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDirectLogin = (account: Partial<UserProfile>) => {
    loginAsProfile(account as UserProfile);
    clearAuthError();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-lg border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden relative max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                isInvalidInstituteDomain
                  ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400'
                  : isUnauthorizedDomain 
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400' 
                  : 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
              }`}>
                {isInvalidInstituteDomain ? (
                  <GraduationCap className="w-5 h-5" />
                ) : isUnauthorizedDomain ? (
                  <ShieldAlert className="w-5 h-5" />
                ) : (
                  <AlertTriangle className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
                  {isInvalidInstituteDomain
                    ? 'NIT Raipur Email Required'
                    : isUnauthorizedDomain 
                    ? 'Vercel / External Domain Notice' 
                    : isPopupBlocked 
                    ? 'Google Sign-In Popup Blocked' 
                    : 'Google Sign-In Notice'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isInvalidInstituteDomain
                    ? 'Access restricted to *.nitrr.ac.in accounts'
                    : isUnauthorizedDomain 
                    ? 'Google popups are restricted on external domains' 
                    : 'Authentication process update'}
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
          {isInvalidInstituteDomain ? (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-2xl space-y-1">
                <div className="text-[11px] font-bold text-rose-700 dark:text-rose-300 flex items-center space-x-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Unauthorized Email Account</span>
                </div>
                <div className="font-mono text-xs text-rose-900 dark:text-rose-200 font-semibold break-all">
                  {rejectedEmail}
                </div>
              </div>

              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Campus Buzz is an exclusive, verified campus network for <strong>National Institute of Technology Raipur (NITRR)</strong>.
              </p>

              <div className="p-4 bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/60 rounded-2xl space-y-2">
                <div className="font-bold text-purple-950 dark:text-purple-200 text-xs flex items-center space-x-1.5">
                  <span>How to sign in:</span>
                </div>
                <ul className="space-y-1.5 text-slate-600 dark:text-slate-300 list-disc list-inside">
                  <li>Use your official institute Google account ending in <strong className="text-purple-700 dark:text-purple-300 font-mono">.nitrr.ac.in</strong> or <strong className="text-purple-700 dark:text-purple-300 font-mono">@nitrr.ac.in</strong>.</li>
                  <li>Example format: <code className="bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 px-1 py-0.5 rounded font-mono text-[11px]">student.btech22@nitrr.ac.in</code></li>
                </ul>
              </div>
            </div>
          ) : isUnauthorizedDomain ? (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-2xl space-y-2">
                <div className="font-bold text-purple-900 dark:text-purple-200 text-xs flex items-center space-x-1.5">
                  <UserCheck className="w-4 h-4 text-purple-600" />
                  <span>Instant Access With Your Account:</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                  Google restricts popups on external hosts ({currentHost}). Click your profile below to enter immediately:
                </p>
                <div className="space-y-2 pt-1">
                  {REGISTERED_ACCOUNTS.map((acc) => (
                    <button
                      key={acc.uid}
                      onClick={() => handleDirectLogin(acc)}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-purple-100 dark:border-purple-800 hover:border-purple-400 hover:shadow-sm text-left transition-all group cursor-pointer"
                    >
                      <div className="flex items-center space-x-2.5">
                        <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 font-bold flex items-center justify-center text-xs">
                          {acc.displayName?.[0]}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 dark:text-slate-100 text-xs flex items-center space-x-1.5">
                            <span>{acc.displayName}</span>
                            {acc.role === 'admin' && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-100 text-rose-700">Admin</span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">{acc.email}</div>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Direct Link to Official Preview */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-700 dark:text-slate-200 text-xs">Official App Preview</div>
                  <div className="text-[11px] text-slate-500">Google Sign-In is natively enabled here</div>
                </div>
                <a
                  href="https://ais-pre-x2p7h3ljhpghvtwhn5brj2-863181346625.asia-southeast1.run.app"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center space-x-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                >
                  <span>Open App</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
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
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95"
            >
              {isInvalidInstituteDomain ? 'Switch to NITRR Account' : 'Retry Google Sign-In'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
