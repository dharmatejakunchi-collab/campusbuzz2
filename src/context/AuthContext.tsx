import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db, signInWithGoogle, logoutFirebase } from '../lib/firebase';
import { UserProfile, UserRole } from '../types';
import { INITIAL_USERS } from '../lib/seedData';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  role: UserRole;
  loading: boolean;
  authError: string | null;
  clearAuthError: () => void;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  setDemoUser: (userProfile: UserProfile) => void;
  updateProfileData: (updates: Partial<UserProfile>) => Promise<void>;
  isVerifiedStudent: boolean;
  isBlocked: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    // Default to the student Alex Chen for immediate testability
    return INITIAL_USERS[0];
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let profileUnsub: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setUser(fbUser);
      if (fbUser) {
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
          // New Google authenticated user
          const isAdmin = fbUser.email === 'dharmatejakunchi@gmail.com';
          const newProfile: UserProfile = {
            uid: fbUser.uid,
            email: fbUser.email || '',
            displayName: fbUser.displayName || 'Campus User',
            photoURL: fbUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            role: isAdmin ? 'admin' : 'student',
            studentId: isAdmin ? 'ADM-2026-001' : `STU-${Math.floor(1000 + Math.random() * 9000)}`,
            hostel: isAdmin ? 'Administrative Block' : 'Hostel Block C, Room 204',
            department: isAdmin ? 'University Administration' : 'Computer Science',
            phone: '+1 (555) 019-2834',
            whatsapp: '+15550192834',
            bio: isAdmin ? 'Campus Administrator & Moderator' : 'Active on Campus Buzz • Ready to split food and cabs!',
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
    // Default back to demo student
    setProfile(INITIAL_USERS[0]);
  };

  const setDemoUser = (demoProfile: UserProfile) => {
    setProfile(demoProfile);
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

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role: profile?.role || 'student',
        loading,
        authError,
        clearAuthError,
        loginWithGoogle,
        logout,
        setDemoUser,
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
