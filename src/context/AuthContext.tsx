import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db, signInWithGoogle, logoutFirebase } from '../lib/firebase';
import { UserProfile, UserRole } from '../types';

export const isNitrrEmail = (email: string | null | undefined): boolean => {
  if (!email) return false;
  const lower = email.toLowerCase().trim();
  return (
    lower.endsWith('@nitrr.ac.in') ||
    lower.endsWith('.nitrr.ac.in') ||
    lower === 'dharmatejakunchi@gmail.com'
  );
};

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  role: UserRole;
  loading: boolean;
  authError: string | null;
  clearAuthError: () => void;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfileData: (updates: Partial<UserProfile>) => Promise<void>;
  isVerifiedStudent: boolean;
  isBlocked: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let profileUnsub: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        // Enforce NITRR domain restriction
        if (!isNitrrEmail(fbUser.email)) {
          const attemptedEmail = fbUser.email || 'this account';
          console.warn(`Sign-in rejected: ${attemptedEmail} does not end with .nitrr.ac.in`);
          await logoutFirebase();
          setUser(null);
          setProfile(null);
          setAuthError(`invalid-domain:${attemptedEmail}`);
          setLoading(false);
          return;
        }

        setUser(fbUser);
        setAuthError(null);
        // Fetch or create user profile in Firestore
        const userRef = doc(db, 'users', fbUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data() as UserProfile;
          if (fbUser.email === 'dharmatejakunchi@gmail.com' && data.role !== 'admin') {
            data.role = 'admin';
            await setDoc(userRef, { role: 'admin' }, { merge: true });
          }
          setProfile(data);
        } else {
          // New Google authenticated user from NITRR
          const isAdmin = fbUser.email === 'dharmatejakunchi@gmail.com' || fbUser.email?.startsWith('admin') || fbUser.email?.startsWith('director');
          
          // Auto-detect department from email if present (e.g. name.it@nitrr.ac.in or 21118042.cse@nitrr.ac.in)
          let detectedDept = 'NIT Raipur Student';
          const emailParts = fbUser.email?.split('@')[0]?.split('.') || [];
          if (emailParts.length > 1) {
            const lastPart = emailParts[emailParts.length - 1].toUpperCase();
            if (['CSE', 'IT', 'ECE', 'EE', 'MECH', 'CIVIL', 'CHEM', 'MINING', 'META', 'BIOTECH', 'MCA', 'ARCH'].includes(lastPart)) {
              detectedDept = `Department of ${lastPart}`;
            }
          }

          const newProfile: UserProfile = {
            uid: fbUser.uid,
            email: fbUser.email || '',
            displayName: fbUser.displayName || 'NITRR Scholar',
            photoURL: fbUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            role: isAdmin ? 'admin' : 'student',
            studentId: isAdmin ? 'ADM-NITRR-01' : `NITRR-${Math.floor(1000 + Math.random() * 9000)}`,
            hostel: isAdmin ? 'Administrative Block' : 'Hostel Block H, Room 204',
            department: isAdmin ? 'NITRR Administration' : detectedDept,
            phone: '+91 98765 43210',
            whatsapp: '+919876543210',
            bio: isAdmin ? 'Campus Administrator & Moderator • NIT Raipur' : 'NIT Raipur Student • Ready to connect & collaborate!',
            verifiedStudent: true,
            isBlocked: false,
            createdAt: Date.now()
          };
          await setDoc(userRef, newProfile);
          setProfile(newProfile);
        }

        // Setup real-time listener for current user's profile
        if (profileUnsub) profileUnsub();
        profileUnsub = onSnapshot(userRef, (snap) => {
          if (snap.exists()) {
            setProfile(snap.data() as UserProfile);
          }
        }, (err) => {
          console.warn('Notice listening to current profile:', err.message);
        });
      } else {
        setUser(null);
        setProfile(null);
        if (profileUnsub) {
          profileUnsub();
          profileUnsub = null;
        }
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (profileUnsub) profileUnsub();
    };
  }, []);

  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      setAuthError(null);
      const res = await signInWithGoogle();
      if (!res) {
        return;
      }
    } catch (err: any) {
      if (
        err?.code === 'auth/cancelled-popup-request' ||
        err?.code === 'auth/popup-closed-by-user'
      ) {
        return;
      }
      
      console.error('Login error details:', err);
      if (err?.code === 'auth/unauthorized-domain' || err?.message?.includes('unauthorized-domain')) {
        setAuthError('unauthorized-domain');
      } else if (err?.code === 'auth/popup-blocked' || err?.message?.includes('popup-blocked')) {
        setAuthError('popup-blocked');
      } else if (err?.code === 'auth/operation-not-allowed') {
        setAuthError('Google sign-in is disabled in your Firebase project. Please enable Google under Authentication > Sign-in method in the Firebase Console.');
      } else {
        setAuthError(err?.message || `Sign-in error: ${err?.code || 'unknown'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await logoutFirebase();
    setUser(null);
    setProfile(null);
  };

  const clearAuthError = () => {
    setAuthError(null);
  };

  const updateProfileData = async (updates: Partial<UserProfile>) => {
    if (!profile) return;
    const updated = { ...profile, ...updates };
    setProfile(updated);
    try {
      await setDoc(doc(db, 'users', profile.uid), updated, { merge: true });
    } catch (e) {
      console.error('Failed to sync profile update to firestore:', e);
    }
  };

  const userEmail = (profile?.email || user?.email || '').toLowerCase().trim();
  const isAdmin = profile?.role === 'admin' || userEmail === 'dharmatejakunchi@gmail.com' || userEmail.startsWith('admin');
  const computedRole: UserRole = isAdmin ? 'admin' : (profile?.role || 'student');

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role: computedRole,
        loading,
        authError,
        clearAuthError,
        loginWithGoogle,
        logout,
        updateProfileData,
        isVerifiedStudent: !!profile?.verifiedStudent,
        isBlocked: !!profile?.isBlocked
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
