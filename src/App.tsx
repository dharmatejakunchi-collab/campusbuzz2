/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Header } from './components/common/Header';
import { CampusFeed } from './components/feed/CampusFeed';
import { ClubSection } from './components/clubs/ClubSection';
import { EventCalendarView } from './components/events/EventCalendarView';
import { ComplaintSection } from './components/complaints/ComplaintSection';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { CreatePostModal } from './components/feed/CreatePostModal';
import { CoordinationRoomModal } from './components/chat/CoordinationRoomModal';
import { LostFoundContactModal } from './components/posts/LostFoundContactModal';
import { EditProfileModal } from './components/common/EditProfileModal';
import { AuthErrorModal } from './components/common/AuthErrorModal';
import { LoginScreen } from './components/auth/LoginScreen';
import { useBackgroundExpiryWorker } from './hooks/usePostExpiry';
import { seedDatabaseIfEmpty } from './lib/seedData';
import { Post, NavigationTab } from './types';
import { Flame } from 'lucide-react';

// Tab animation variants
const tabVariants = {
  initial: {
    opacity: 0,
    y: 12,
    scale: 0.995,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.24,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.995,
    transition: {
      duration: 0.16,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

function MainApp() {
  const { user, profile, loading } = useAuth();
  const { currentTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<NavigationTab>('feed');
  
  // Modals state
  const [showCreatePostModal, setShowCreatePostModal] = useState<boolean>(false);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [activeRoomPost, setActiveRoomPost] = useState<Post | null>(null);
  const [activeContactPost, setActiveContactPost] = useState<Post | null>(null);
  const [selectedCalendarEventId, setSelectedCalendarEventId] = useState<string | undefined>(undefined);

  // Background worker to auto-expire posts past duration
  useBackgroundExpiryWorker();

  // Initial seed data populate if database is blank
  useEffect(() => {
    seedDatabaseIfEmpty().catch(console.error);
  }, []);

  // When auth state is loading
  if (loading) {
    return (
      <div className={`min-h-screen ${currentTheme.bgCanvas} flex flex-col items-center justify-center`}>
        <div className="flex flex-col items-center space-y-4">
          <div className={`w-14 h-14 rounded-3xl bg-gradient-to-tr ${currentTheme.gradient} flex items-center justify-center shadow-lg shadow-purple-200 text-white animate-bounce`}>
            <Flame className="w-8 h-8" />
          </div>
          <div className="flex items-center space-x-2 text-sm font-bold text-slate-600">
            <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <span>Connecting to Campus Buzz...</span>
          </div>
        </div>
      </div>
    );
  }

  // When user is not authenticated, show mandatory Login Wall
  if (!user || !profile) {
    return (
      <>
        <LoginScreen />
        <AuthErrorModal />
      </>
    );
  }

  const handleOpenRoom = (post: Post) => {
    setActiveRoomPost(post);
  };

  const handleOpenContact = (post: Post) => {
    setActiveContactPost(post);
  };

  const handleNavigateToCalendar = (eventId?: string) => {
    setSelectedCalendarEventId(eventId);
    setActiveTab('calendar');
  };

  return (
    <div className={`min-h-screen ${currentTheme.bgCanvas} text-slate-800 flex flex-col font-sans transition-colors duration-300`}>
      {/* Top Universal Campus Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onTabChange={setActiveTab}
        onOpenCreatePost={() => setShowCreatePostModal(true)}
        onOpenProfile={() => setShowProfileModal(true)}
      />

      {/* Main Content Area with Framer Motion transitions */}
      <main className="flex-1 pb-16 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'feed' && (
            <motion.div
              key="feed"
              variants={tabVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <CampusFeed
                onOpenRoom={handleOpenRoom}
                onOpenContact={handleOpenContact}
                onOpenCreatePost={() => setShowCreatePostModal(true)}
              />
            </motion.div>
          )}

          {activeTab === 'clubs' && (
            <motion.div
              key="clubs"
              variants={tabVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <ClubSection
                onNavigateToCalendar={handleNavigateToCalendar}
              />
            </motion.div>
          )}

          {activeTab === 'calendar' && (
            <motion.div
              key="calendar"
              variants={tabVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <EventCalendarView
                initialSelectedEventId={selectedCalendarEventId}
              />
            </motion.div>
          )}

          {activeTab === 'complaints' && (
            <motion.div
              key="complaints"
              variants={tabVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <ComplaintSection />
            </motion.div>
          )}

          {activeTab === 'admin' && (
            <motion.div
              key="admin"
              variants={tabVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <AdminDashboard />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Modal 1: Create Intent-Driven Post */}
      {showCreatePostModal && (
        <CreatePostModal
          isOpen={showCreatePostModal}
          onClose={() => setShowCreatePostModal(false)}
        />
      )}

      {/* Modal 2: Live Coordination Chat Room (#foodsplit, #cabsplit, #resell) */}
      {activeRoomPost && (
        <CoordinationRoomModal
          post={activeRoomPost}
          isOpen={!!activeRoomPost}
          onClose={() => setActiveRoomPost(null)}
        />
      )}

      {/* Modal 3: Direct Contact Information (#lost, #found) */}
      {activeContactPost && (
        <LostFoundContactModal
          post={activeContactPost}
          isOpen={!!activeContactPost}
          onClose={() => setActiveContactPost(null)}
        />
      )}

      {/* Modal 4: Edit Profile Modal */}
      {showProfileModal && (
        <EditProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
        />
      )}

      {/* Modal 5: Auth Error & Whitelist Guide Modal */}
      <AuthErrorModal />

      {/* Campus Buzz Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur py-6 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-black text-slate-800 dark:text-slate-200">Campus Buzz</span>
            <span>•</span>
            <span>Verified Student Coordination & Community Engine</span>
          </div>
          <div className="flex items-center space-x-4 text-[11px]">
            <span>⚡ Instant Intent Routing</span>
            <span>🔒 Anonymous Grievances</span>
            <span>🏛️ Official Club Notices</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}

