import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  Users, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Filter, 
  Download, 
  UserCheck, 
  UserX, 
  Megaphone, 
  Pin, 
  Flame, 
  Building2, 
  Calendar, 
  ShieldAlert, 
  RefreshCw, 
  Edit3, 
  Plus, 
  X,
  Phone,
  Mail,
  Home,
  GraduationCap,
  Sparkles,
  Check,
  Radio,
  FileSpreadsheet,
  Ban,
  Lock,
  Unlock,
  AlertOctagon
} from 'lucide-react';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { purgeAllDemoData } from '../../lib/seedData';
import { 
  UserProfile, 
  Post, 
  Complaint, 
  ClubAnnouncement, 
  CampusEvent, 
  UserRole, 
  ComplaintStatus 
} from '../../types';

type AdminTab = 'users' | 'posts' | 'complaints' | 'announcements' | 'broadcast';

export const AdminDashboard: React.FC = () => {
  const { profile, user } = useAuth();
  const { currentTheme } = useTheme();

  const [activeAdminTab, setActiveAdminTab] = useState<AdminTab>('users');
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [postsList, setPostsList] = useState<Post[]>([]);
  const [complaintsList, setComplaintsList] = useState<Complaint[]>([]);
  const [announcementsList, setAnnouncementsList] = useState<ClubAnnouncement[]>([]);
  const [eventsList, setEventsList] = useState<CampusEvent[]>([]);

  // Search and filter states
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [postSearch, setPostSearch] = useState('');
  const [complaintFilter, setComplaintFilter] = useState<string>('all');

  // Loading & status states
  const [loading, setLoading] = useState(true);
  const [purging, setPurging] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Selected user for editing
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  // User blocking state
  const [blockingUser, setBlockingUser] = useState<UserProfile | null>(null);
  const [blockReasonInput, setBlockReasonInput] = useState('');

  // Complaint response state
  const [respondingComplaint, setRespondingComplaint] = useState<Complaint | null>(null);
  const [officialResponseText, setOfficialResponseText] = useState('');
  const [newStatus, setNewStatus] = useState<ComplaintStatus>('in_progress');

  // Global Broadcast Banner state
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastActive, setBroadcastActive] = useState(false);
  const [broadcastType, setBroadcastType] = useState<'info' | 'alert' | 'event'>('info');

  // Real-time subscribers for Admin collections
  useEffect(() => {
    setLoading(true);

    // 1. Users list
    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snap) => {
        const uList: UserProfile[] = [];
        snap.forEach((d) => uList.push(d.data() as UserProfile));
        setUsersList(uList.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
        setLoading(false);
      },
      (err) => {
        console.warn('Notice listening to users:', err.message);
        setLoading(false);
      }
    );

    // 2. Posts list
    const unsubPosts = onSnapshot(
      collection(db, 'posts'),
      (snap) => {
        const pList: Post[] = [];
        snap.forEach((d) => pList.push({ id: d.id, ...d.data() } as Post));
        setPostsList(pList.sort((a, b) => b.createdAt - a.createdAt));
      },
      (err) => {
        console.warn('Notice listening to posts:', err.message);
      }
    );

    // 3. Complaints list
    const unsubComplaints = onSnapshot(
      collection(db, 'complaints'),
      (snap) => {
        const cList: Complaint[] = [];
        snap.forEach((d) => cList.push({ id: d.id, ...d.data() } as Complaint));
        setComplaintsList(cList.sort((a, b) => b.createdAt - a.createdAt));
      },
      (err) => {
        console.warn('Notice listening to complaints:', err.message);
      }
    );

    // 4. Announcements list
    const unsubAnnouncements = onSnapshot(
      collection(db, 'club_announcements'),
      (snap) => {
        const aList: ClubAnnouncement[] = [];
        snap.forEach((d) => aList.push({ id: d.id, ...d.data() } as ClubAnnouncement));
        setAnnouncementsList(aList.sort((a, b) => b.createdAt - a.createdAt));
      },
      (err) => {
        console.warn('Notice listening to announcements:', err.message);
      }
    );

    // 5. Events list
    const unsubEvents = onSnapshot(
      collection(db, 'events'),
      (snap) => {
        const eList: CampusEvent[] = [];
        snap.forEach((d) => eList.push({ id: d.id, ...d.data() } as CampusEvent));
        setEventsList(eList.sort((a, b) => b.createdAt - a.createdAt));
      },
      (err) => {
        console.warn('Notice listening to events:', err.message);
      }
    );

    // 6. Broadcast banner config
    const unsubBroadcast = onSnapshot(
      doc(db, 'system_config', 'broadcast'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setBroadcastMessage(data.message || '');
          setBroadcastActive(!!data.active);
          setBroadcastType(data.type || 'info');
        }
      },
      (err) => {
        console.warn('Notice listening to broadcast config:', err.message);
      }
    );

    return () => {
      unsubUsers();
      unsubPosts();
      unsubComplaints();
      unsubAnnouncements();
      unsubEvents();
      unsubBroadcast();
    };
  }, []);

  const notify = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  // --- Admin User Actions ---
  const handleUpdateUserRole = async (targetUser: UserProfile, newRole: UserRole) => {
    try {
      await updateDoc(doc(db, 'users', targetUser.uid), { role: newRole });
      notify(`Updated ${targetUser.displayName}'s role to ${newRole.toUpperCase()}`);
    } catch (e) {
      console.error('Failed to update role:', e);
    }
  };

  const handleToggleVerification = async (targetUser: UserProfile) => {
    try {
      const newStatus = !targetUser.verifiedStudent;
      await updateDoc(doc(db, 'users', targetUser.uid), { verifiedStudent: newStatus });
      notify(`${targetUser.displayName} verification ${newStatus ? 'granted' : 'revoked'}`);
    } catch (e) {
      console.error('Failed to toggle verification:', e);
    }
  };

  const handleInitiateBlockUser = (targetUser: UserProfile) => {
    setBlockingUser(targetUser);
    setBlockReasonInput(targetUser.blockedReason || 'Violation of campus community guidelines or inappropriate behavior.');
  };

  const handleConfirmBlockUser = async () => {
    if (!blockingUser) return;
    try {
      const reason = blockReasonInput.trim() || 'Violating campus community guidelines';
      await updateDoc(doc(db, 'users', blockingUser.uid), {
        isBlocked: true,
        blockedReason: reason,
        blockedAt: Date.now(),
        blockedBy: profile?.displayName || 'Campus Admin'
      });
      notify(`User "${blockingUser.displayName}" has been BLOCKED`);
      setBlockingUser(null);
      setBlockReasonInput('');
    } catch (e) {
      console.error('Failed to block user:', e);
    }
  };

  const handleUnblockUser = async (targetUser: UserProfile) => {
    try {
      await updateDoc(doc(db, 'users', targetUser.uid), {
        isBlocked: false,
        blockedReason: null,
        blockedAt: null,
        blockedBy: null
      });
      notify(`User "${targetUser.displayName}" has been UNBLOCKED`);
    } catch (e) {
      console.error('Failed to unblock user:', e);
    }
  };

  const handleDeleteUser = async (targetUser: UserProfile) => {
    if (!window.confirm(`Are you sure you want to delete user "${targetUser.displayName}" (${targetUser.email})?`)) return;
    try {
      await deleteDoc(doc(db, 'users', targetUser.uid));
      notify(`User ${targetUser.displayName} removed from platform`);
    } catch (e) {
      console.error('Failed to delete user:', e);
    }
  };

  const handleSaveUserDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      await setDoc(doc(db, 'users', editingUser.uid), editingUser, { merge: true });
      notify(`User profile for ${editingUser.displayName} updated`);
      setEditingUser(null);
    } catch (e) {
      console.error('Failed to save user details:', e);
    }
  };

  // --- CSV Export of Users ---
  const handleExportUsersCSV = () => {
    const headers = ['UID', 'Name', 'Email', 'Role', 'Student ID', 'Department', 'Hostel', 'Phone', 'Verified', 'Created At'];
    const rows = usersList.map((u) => [
      `"${u.uid}"`,
      `"${u.displayName || ''}"`,
      `"${u.email || ''}"`,
      `"${u.role || 'student'}"`,
      `"${u.studentId || ''}"`,
      `"${u.department || ''}"`,
      `"${u.hostel || ''}"`,
      `"${u.phone || ''}"`,
      `"${u.verifiedStudent ? 'Yes' : 'No'}"`,
      `"${new Date(u.createdAt || Date.now()).toISOString()}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CampusBuzz_Registered_Users_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify(`Exported ${usersList.length} users to CSV`);
  };

  // --- Admin Post Actions ---
  const handleDeletePost = async (postId: string, postTitle: string) => {
    if (!window.confirm(`Delete post "${postTitle}"?`)) return;
    try {
      await deleteDoc(doc(db, 'posts', postId));
      notify(`Post deleted successfully`);
    } catch (e) {
      console.error('Failed to delete post:', e);
    }
  };

  const handleTogglePinPost = async (post: Post) => {
    try {
      await updateDoc(doc(db, 'posts', post.id), { pinned: !post.pinned });
      notify(`Post ${!post.pinned ? 'pinned to top' : 'unpinned'}`);
    } catch (e) {
      console.error('Failed to toggle pin:', e);
    }
  };

  // --- Admin Grievance Actions ---
  const handleResolveComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!respondingComplaint) return;
    try {
      await updateDoc(doc(db, 'complaints', respondingComplaint.id), {
        status: newStatus,
        officialResponse: officialResponseText,
        officialResponseBy: profile?.displayName || 'University Administration',
        officialResponseAt: Date.now(),
        ...(newStatus === 'resolved' ? { resolvedAt: Date.now() } : {})
      });
      notify(`Complaint status updated to ${newStatus.toUpperCase()}`);
      setRespondingComplaint(null);
      setOfficialResponseText('');
    } catch (e) {
      console.error('Failed to update complaint:', e);
    }
  };

  const handleDeleteComplaint = async (complaintId: string) => {
    if (!window.confirm(`Delete this complaint record?`)) return;
    try {
      await deleteDoc(doc(db, 'complaints', complaintId));
      notify(`Complaint removed from database`);
    } catch (e) {
      console.error('Failed to delete complaint:', e);
    }
  };

  // --- Admin Announcement Actions ---
  const handleDeleteAnnouncement = async (id: string) => {
    if (!window.confirm(`Delete this announcement?`)) return;
    try {
      await deleteDoc(doc(db, 'club_announcements', id));
      notify(`Announcement deleted`);
    } catch (e) {
      console.error('Failed to delete announcement:', e);
    }
  };

  // --- Admin Broadcast Banner Actions ---
  const handleSaveBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, 'system_config', 'broadcast'), {
        message: broadcastMessage,
        active: broadcastActive,
        type: broadcastType,
        updatedAt: Date.now(),
        updatedBy: profile?.displayName || 'Admin'
      });
      notify(`Campus-wide alert broadcast saved`);
    } catch (e) {
      console.error('Failed to update broadcast:', e);
    }
  };

  // --- Purge Demo Data Action ---
  const handlePurgeAllDemoData = async () => {
    if (!window.confirm('⚠️ Are you sure you want to purge all demo posts, demo complaints, demo announcements, and demo events from Firestore? Real user-created posts will be preserved.')) {
      return;
    }
    setPurging(true);
    const res = await purgeAllDemoData();
    setPurging(false);
    if (res.success) {
      notify(`Successfully purged all demo records! Database is now clean.`);
    } else {
      notify(`Failed to purge demo records. Check console.`);
    }
  };

  // Filtered lists
  const filteredUsers = usersList.filter((u) => {
    const matchesSearch = 
      (u.displayName || '').toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.studentId || '').toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.department || '').toLowerCase().includes(userSearch.toLowerCase());
    
    if (roleFilter === 'all') return matchesSearch;
    if (roleFilter === 'blocked') return matchesSearch && !!u.isBlocked;
    if (roleFilter === 'active') return matchesSearch && !u.isBlocked;
    if (roleFilter === 'verified') return matchesSearch && !!u.verifiedStudent;
    return matchesSearch && u.role === roleFilter;
  });

  const filteredPosts = postsList.filter((p) => {
    return (p.title || '').toLowerCase().includes(postSearch.toLowerCase()) ||
      (p.authorName || '').toLowerCase().includes(postSearch.toLowerCase()) ||
      (p.primaryHashtag || '').toLowerCase().includes(postSearch.toLowerCase());
  });

  const filteredComplaints = complaintsList.filter((c) => {
    if (complaintFilter === 'all') return true;
    return c.status === complaintFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
      
      {/* Admin Notification Toast */}
      <AnimatePresence>
        {actionSuccessMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-6 z-50 flex items-center space-x-2 px-4 py-3 bg-purple-100 dark:bg-purple-950/90 text-purple-900 dark:text-purple-100 border border-purple-300/80 dark:border-purple-800 rounded-2xl shadow-xl backdrop-blur text-xs font-bold"
          >
            <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>{actionSuccessMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Header Banner */}
      <div className="bg-gradient-to-r from-purple-100/90 via-pink-100/70 to-indigo-100/90 dark:from-purple-950/40 dark:via-pink-950/30 dark:to-indigo-950/40 rounded-3xl p-6 sm:p-8 border border-purple-200/80 dark:border-purple-800/50 shadow-xs mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-300 via-pink-300 to-indigo-300 flex items-center justify-center text-purple-950 shadow-md">
              <ShieldCheck className="w-8 h-8 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="font-display font-black text-2xl sm:text-3xl text-purple-950 dark:text-purple-100 tracking-tight">
                  Admin Command Console
                </h1>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-200/80 dark:bg-purple-900/60 text-purple-900 dark:text-purple-200 border border-purple-300/60">
                  Full Powers
                </span>
              </div>
              <p className="text-sm text-purple-900/70 dark:text-purple-300/80 mt-1 max-w-2xl">
                Comprehensive administration hub for managing registered website users, moderating campus feeds, resolving student grievances, and broadcasting alerts.
              </p>
            </div>
          </div>

          {/* Quick Stats & Reset Action */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              id="admin-export-users-btn"
              onClick={handleExportUsersCSV}
              className="flex items-center space-x-1.5 px-4 py-2.5 bg-white/90 dark:bg-slate-900/90 hover:bg-white dark:hover:bg-slate-900 text-purple-900 dark:text-purple-200 border border-purple-200/80 dark:border-purple-800/80 rounded-2xl text-xs font-bold shadow-xs active:scale-95 transition-all"
            >
              <FileSpreadsheet className="w-4 h-4 text-purple-600" />
              <span>Export Users ({usersList.length})</span>
            </button>

            <button
              id="admin-purge-demo-data-btn"
              onClick={handlePurgeAllDemoData}
              disabled={purging}
              className="flex items-center space-x-1.5 px-4 py-2.5 bg-rose-100/90 hover:bg-rose-200 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-900 dark:text-rose-200 border border-rose-300/70 dark:border-rose-800 rounded-2xl text-xs font-bold shadow-xs active:scale-95 transition-all disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>{purging ? 'Purging...' : 'Purge All Demo Data'}</span>
            </button>
          </div>
        </div>

        {/* Quick Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-purple-200/60 dark:border-purple-800/40">
          <div className="bg-white/70 dark:bg-slate-900/50 p-3.5 rounded-2xl border border-purple-200/50 dark:border-purple-900/40">
            <div className="flex items-center justify-between text-xs text-purple-800 dark:text-purple-300 font-semibold">
              <span>Registered Users</span>
              <Users className="w-4 h-4 text-purple-500" />
            </div>
            <div className="font-display font-black text-2xl text-purple-950 dark:text-purple-100 mt-1">
              {usersList.length}
            </div>
          </div>

          <div className="bg-white/70 dark:bg-slate-900/50 p-3.5 rounded-2xl border border-purple-200/50 dark:border-purple-900/40">
            <div className="flex items-center justify-between text-xs text-purple-800 dark:text-purple-300 font-semibold">
              <span>Campus Posts</span>
              <Flame className="w-4 h-4 text-amber-500" />
            </div>
            <div className="font-display font-black text-2xl text-purple-950 dark:text-purple-100 mt-1">
              {postsList.length}
            </div>
          </div>

          <div className="bg-white/70 dark:bg-slate-900/50 p-3.5 rounded-2xl border border-purple-200/50 dark:border-purple-900/40">
            <div className="flex items-center justify-between text-xs text-purple-800 dark:text-purple-300 font-semibold">
              <span>Grievances</span>
              <ShieldAlert className="w-4 h-4 text-rose-500" />
            </div>
            <div className="font-display font-black text-2xl text-purple-950 dark:text-purple-100 mt-1">
              {complaintsList.length}
            </div>
          </div>

          <div className="bg-white/70 dark:bg-slate-900/50 p-3.5 rounded-2xl border border-purple-200/50 dark:border-purple-900/40">
            <div className="flex items-center justify-between text-xs text-purple-800 dark:text-purple-300 font-semibold">
              <span>Club Notices</span>
              <Building2 className="w-4 h-4 text-blue-500" />
            </div>
            <div className="font-display font-black text-2xl text-purple-950 dark:text-purple-100 mt-1">
              {announcementsList.length}
            </div>
          </div>
        </div>
      </div>

      {/* Admin Tabs Navigation Bar */}
      <div className="flex items-center space-x-2 border-b border-purple-200/80 dark:border-purple-900/50 pb-3 mb-6 overflow-x-auto scrollbar-none">
        <button
          id="admin-tab-users"
          onClick={() => setActiveAdminTab('users')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
            activeAdminTab === 'users'
              ? 'bg-purple-200 dark:bg-purple-900 text-purple-950 dark:text-purple-100 shadow-xs border border-purple-300/80'
              : 'text-slate-600 dark:text-slate-400 hover:bg-purple-50 dark:hover:bg-slate-900'
          }`}
        >
          <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span>User Directory & Roles</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-purple-300/60 dark:bg-purple-800 text-purple-950 dark:text-purple-200">
            {usersList.length}
          </span>
        </button>

        <button
          id="admin-tab-posts"
          onClick={() => setActiveAdminTab('posts')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
            activeAdminTab === 'posts'
              ? 'bg-purple-200 dark:bg-purple-900 text-purple-950 dark:text-purple-100 shadow-xs border border-purple-300/80'
              : 'text-slate-600 dark:text-slate-400 hover:bg-purple-50 dark:hover:bg-slate-900'
          }`}
        >
          <Flame className="w-4 h-4 text-amber-500" />
          <span>Post Moderation</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-purple-300/60 dark:bg-purple-800 text-purple-950 dark:text-purple-200">
            {postsList.length}
          </span>
        </button>

        <button
          id="admin-tab-complaints"
          onClick={() => setActiveAdminTab('complaints')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
            activeAdminTab === 'complaints'
              ? 'bg-purple-200 dark:bg-purple-900 text-purple-950 dark:text-purple-100 shadow-xs border border-purple-300/80'
              : 'text-slate-600 dark:text-slate-400 hover:bg-purple-50 dark:hover:bg-slate-900'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-rose-500" />
          <span>Grievance Resolution</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-purple-300/60 dark:bg-purple-800 text-purple-950 dark:text-purple-200">
            {complaintsList.length}
          </span>
        </button>

        <button
          id="admin-tab-announcements"
          onClick={() => setActiveAdminTab('announcements')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
            activeAdminTab === 'announcements'
              ? 'bg-purple-200 dark:bg-purple-900 text-purple-950 dark:text-purple-100 shadow-xs border border-purple-300/80'
              : 'text-slate-600 dark:text-slate-400 hover:bg-purple-50 dark:hover:bg-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4 text-blue-500" />
          <span>Club Notices</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-purple-300/60 dark:bg-purple-800 text-purple-950 dark:text-purple-200">
            {announcementsList.length}
          </span>
        </button>

        <button
          id="admin-tab-broadcast"
          onClick={() => setActiveAdminTab('broadcast')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
            activeAdminTab === 'broadcast'
              ? 'bg-purple-200 dark:bg-purple-900 text-purple-950 dark:text-purple-100 shadow-xs border border-purple-300/80'
              : 'text-slate-600 dark:text-slate-400 hover:bg-purple-50 dark:hover:bg-slate-900'
          }`}
        >
          <Megaphone className="w-4 h-4 text-emerald-600" />
          <span>Campus Alert Broadcast</span>
          {broadcastActive && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          )}
        </button>
      </div>

      {/* --- TAB 1: USERS DIRECTORY & ROLE MANAGEMENT --- */}
      {activeAdminTab === 'users' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Filter Bar */}
          <div className="bg-white/80 dark:bg-slate-900/80 p-4 rounded-3xl border border-purple-200/70 dark:border-purple-900/40 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search by name, email, student ID, dept..."
                className="w-full pl-10 pr-4 py-2 bg-purple-50/50 dark:bg-slate-800/60 border border-purple-200/70 dark:border-purple-800/60 rounded-2xl text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-purple-300"
              />
            </div>

            {/* Role & Status Filter Pills */}
            <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              <button
                onClick={() => setRoleFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  roleFilter === 'all'
                    ? 'bg-purple-300 dark:bg-purple-800 text-purple-950 dark:text-purple-100 border border-purple-400/60'
                    : 'bg-purple-50/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-purple-100'
                }`}
              >
                All Users ({usersList.length})
              </button>
              {(['student', 'club', 'committee', 'admin'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all shrink-0 ${
                    roleFilter === r
                      ? 'bg-purple-300 dark:bg-purple-800 text-purple-950 dark:text-purple-100 border border-purple-400/60'
                      : 'bg-purple-50/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-purple-100'
                  }`}
                >
                  {r}
                </button>
              ))}
              <button
                onClick={() => setRoleFilter('blocked')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center space-x-1 ${
                  roleFilter === 'blocked'
                    ? 'bg-rose-200 dark:bg-rose-900 text-rose-950 dark:text-rose-100 border border-rose-400/60'
                    : 'bg-rose-50/60 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 hover:bg-rose-100'
                }`}
              >
                <Ban className="w-3 h-3" />
                <span>Blocked ({usersList.filter((u) => u.isBlocked).length})</span>
              </button>
            </div>
          </div>

          {/* Users Table / Cards */}
          <div className="bg-white/90 dark:bg-slate-900/90 rounded-3xl border border-purple-200/70 dark:border-purple-900/40 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-purple-100 dark:border-purple-900/40 bg-purple-50/60 dark:bg-slate-800/40 text-[11px] font-bold text-purple-950 dark:text-purple-300 uppercase tracking-wider">
                    <th className="py-3.5 px-4 sm:px-6">Student / Member</th>
                    <th className="py-3.5 px-4">Contact Info</th>
                    <th className="py-3.5 px-4">Academic & Hostel</th>
                    <th className="py-3.5 px-4">Role & Status</th>
                    <th className="py-3.5 px-4 text-center">Verified</th>
                    <th className="py-3.5 px-4 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-100 dark:divide-purple-900/30 text-xs">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <span>No registered users found matching your filter</span>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isTargetBlocked = !!u.isBlocked;
                      return (
                        <tr key={u.uid} className={`transition-colors ${isTargetBlocked ? 'bg-rose-50/30 dark:bg-rose-950/20' : 'hover:bg-purple-50/40 dark:hover:bg-slate-800/40'}`}>
                          {/* Member info */}
                          <td className="py-4 px-4 sm:px-6">
                            <div className="flex items-center space-x-3">
                              <img
                                src={u.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                                alt={u.displayName}
                                className={`w-10 h-10 rounded-2xl object-cover border shadow-xs ${isTargetBlocked ? 'border-rose-400 grayscale' : 'border-purple-200/80 dark:border-purple-800'}`}
                              />
                              <div>
                                <div className="font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                                  <span>{u.displayName || 'Unnamed User'}</span>
                                  {u.uid === user?.uid && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-200 dark:bg-purple-900 text-purple-900 dark:text-purple-200 font-bold">
                                      You
                                    </span>
                                  )}
                                  {isTargetBlocked && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-black border border-rose-300 flex items-center space-x-0.5">
                                      <Ban className="w-2.5 h-2.5" />
                                      <span>BLOCKED</span>
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                                  UID: {u.uid.slice(0, 12)}...
                                </div>
                                {isTargetBlocked && u.blockedReason && (
                                  <div className="text-[10px] text-rose-600 dark:text-rose-400 italic mt-0.5">
                                    Reason: {u.blockedReason}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Contact Info */}
                          <td className="py-4 px-4">
                            <div className="space-y-0.5">
                              <div className="flex items-center space-x-1 text-slate-700 dark:text-slate-300">
                                <Mail className="w-3.5 h-3.5 text-purple-500" />
                                <span className="truncate max-w-[150px]">{u.email}</span>
                              </div>
                              {u.phone && (
                                <div className="flex items-center space-x-1 text-slate-500 dark:text-slate-400 text-[11px]">
                                  <Phone className="w-3 h-3 text-emerald-500" />
                                  <span>{u.phone}</span>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Academic & Hostel */}
                          <td className="py-4 px-4">
                            <div className="space-y-0.5">
                              <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center space-x-1">
                                <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
                                <span>{u.department || 'Not specified'}</span>
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center space-x-1">
                                <Home className="w-3 h-3 text-amber-500" />
                                <span>{u.hostel || 'Hostel: Not listed'}</span>
                              </div>
                              {u.studentId && (
                                <div className="text-[10px] text-purple-600 dark:text-purple-400 font-mono font-bold">
                                  ID: {u.studentId}
                                </div>
                              )}
                            </div>
                          </td>

                          {/* System Role Selector & Status */}
                          <td className="py-4 px-4">
                            <div className="space-y-1.5">
                              <select
                                value={u.role || 'student'}
                                onChange={(e) => handleUpdateUserRole(u, e.target.value as UserRole)}
                                className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-purple-100/80 dark:bg-slate-800 text-purple-950 dark:text-purple-200 border border-purple-300/80 dark:border-purple-700 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-purple-300"
                              >
                                <option value="student">🎓 Student</option>
                                <option value="club">🏛️ Club Rep</option>
                                <option value="committee">🌟 Committee</option>
                                <option value="admin">🛡️ Administrator</option>
                              </select>
                              <div>
                                {isTargetBlocked ? (
                                  <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-100/80 dark:bg-rose-950/60 px-2 py-0.5 rounded-lg border border-rose-200">
                                    <Lock className="w-3 h-3" />
                                    <span>Suspended</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-200">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>Active</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Verification Toggle */}
                          <td className="py-4 px-4 text-center">
                            <button
                              onClick={() => handleToggleVerification(u)}
                              title="Click to toggle verified student status"
                              className={`p-1.5 rounded-xl border transition-all ${
                                u.verifiedStudent
                                  ? 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                                  : 'bg-slate-100 text-slate-400 border-slate-300 dark:bg-slate-800 dark:text-slate-500'
                              }`}
                            >
                              {u.verifiedStudent ? (
                                <UserCheck className="w-4 h-4" />
                              ) : (
                                <UserX className="w-4 h-4" />
                              )}
                            </button>
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-4 text-right space-x-1">
                            {/* Block / Unblock User Action */}
                            {isTargetBlocked ? (
                              <button
                                onClick={() => handleUnblockUser(u)}
                                title="Unblock Student"
                                className="p-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-950/70 dark:hover:bg-emerald-900 dark:text-emerald-200 transition-colors"
                              >
                                <Unlock className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleInitiateBlockUser(u)}
                                title="Block / Suspend Student"
                                className="p-1.5 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-400 transition-colors"
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => setEditingUser(u)}
                              title="Edit User Profile"
                              className="p-1.5 rounded-xl hover:bg-purple-100 dark:hover:bg-slate-800 text-purple-700 dark:text-purple-300 transition-colors"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u)}
                              title="Delete User"
                              className="p-1.5 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-400 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: POSTS MODERATION --- */}
      {activeAdminTab === 'posts' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white/80 dark:bg-slate-900/80 p-4 rounded-3xl border border-purple-200/70 dark:border-purple-900/40 flex items-center justify-between">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={postSearch}
                onChange={(e) => setPostSearch(e.target.value)}
                placeholder="Search posts by title, author, or tag..."
                className="w-full pl-10 pr-4 py-2 bg-purple-50/50 dark:bg-slate-800/60 border border-purple-200/70 dark:border-purple-800/60 rounded-2xl text-xs text-slate-900 dark:text-slate-100"
              />
            </div>
            <div className="text-xs font-bold text-purple-900 dark:text-purple-300">
              Total Live Posts: {postsList.length}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPosts.length === 0 ? (
              <div className="col-span-full py-16 text-center text-slate-400 bg-white/60 dark:bg-slate-900/60 rounded-3xl border border-purple-200/60">
                <Flame className="w-10 h-10 mx-auto mb-2 opacity-30 text-amber-500" />
                <p className="font-semibold text-slate-600 dark:text-slate-300">No campus posts found</p>
                <p className="text-xs text-slate-400 mt-1">The feed is clean and ready for real student activity.</p>
              </div>
            ) : (
              filteredPosts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white/90 dark:bg-slate-900/90 rounded-3xl border border-purple-200/70 dark:border-purple-900/40 p-4 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-900 dark:text-purple-300 border border-purple-300/60">
                        #{post.primaryHashtag}
                      </span>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleTogglePinPost(post)}
                          className={`p-1.5 rounded-xl border transition-all ${
                            post.pinned
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : 'bg-slate-100 text-slate-400 hover:text-slate-600'
                          }`}
                          title="Pin to top"
                        >
                          <Pin className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeletePost(post.id, post.title)}
                          className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200"
                          title="Delete post"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-2 mb-1">
                      {post.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-3">
                      {post.description}
                    </p>

                    {post.imageUrl && (
                      <img
                        src={post.imageUrl}
                        alt="Post attachment"
                        className="w-full h-32 rounded-2xl object-cover mb-3 border border-purple-100 dark:border-purple-900/40"
                      />
                    )}
                  </div>

                  <div className="pt-2 border-t border-purple-100 dark:border-purple-900/30 flex items-center justify-between text-[11px] text-slate-500">
                    <span>By {post.authorName}</span>
                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* --- TAB 3: GRIEVANCES & COMPLAINTS RESOLUTION --- */}
      {activeAdminTab === 'complaints' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Grievance Filter Bar */}
          <div className="bg-white/80 dark:bg-slate-900/80 p-4 rounded-3xl border border-purple-200/70 dark:border-purple-900/40 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-purple-950 dark:text-purple-300">Filter Status:</span>
              {(['all', 'under_review', 'investigating', 'in_progress', 'resolved'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setComplaintFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                    complaintFilter === st
                      ? 'bg-rose-200 dark:bg-rose-900 text-rose-950 dark:text-rose-100 border border-rose-300/80'
                      : 'bg-purple-50/60 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-purple-100'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>
            <span className="text-xs text-slate-500 font-semibold">
              {filteredComplaints.length} Grievances
            </span>
          </div>

          <div className="space-y-4">
            {filteredComplaints.length === 0 ? (
              <div className="py-16 text-center text-slate-400 bg-white/60 dark:bg-slate-900/60 rounded-3xl border border-purple-200/60">
                <ShieldCheck className="w-10 h-10 mx-auto mb-2 opacity-30 text-emerald-500" />
                <p className="font-semibold text-slate-600 dark:text-slate-300">Zero active complaints</p>
                <p className="text-xs text-slate-400 mt-1">All campus grievances have been cleared or resolved.</p>
              </div>
            ) : (
              filteredComplaints.map((c) => (
                <div
                  key={c.id}
                  className="bg-white/90 dark:bg-slate-900/90 rounded-3xl border border-purple-200/70 dark:border-purple-900/40 p-5 shadow-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          c.status === 'resolved'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}>
                          {c.status.replace('_', ' ')}
                        </span>
                        <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">
                          Category: {c.category}
                        </span>
                        <span className="text-xs text-slate-400">• {c.location}</span>
                      </div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white">
                        {c.title}
                      </h3>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setRespondingComplaint(c);
                          setOfficialResponseText(c.officialResponse || '');
                          setNewStatus(c.status);
                        }}
                        className="px-3 py-1.5 bg-purple-200 hover:bg-purple-300 dark:bg-purple-900 dark:hover:bg-purple-800 text-purple-950 dark:text-purple-100 rounded-xl text-xs font-bold transition-colors"
                      >
                        Official Response
                      </button>
                      <button
                        onClick={() => handleDeleteComplaint(c.id)}
                        className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                    {c.description}
                  </p>

                  {/* Real Student Identity (Admin Only Visibility) */}
                  <div className="bg-purple-50/70 dark:bg-slate-800/60 p-3 rounded-2xl border border-purple-200/50 dark:border-purple-900/30 text-xs flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-purple-950 dark:text-purple-200">
                        🔒 Student Identity (Admin Eyes Only):
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {c.realAuthorName || 'Anonymous Student'} ({c.realAuthorEmail || 'Private'})
                      </span>
                      {c.realAuthorHostel && (
                        <span className="text-slate-500">• {c.realAuthorHostel}</span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">
                      Logged {new Date(c.createdAt).toLocaleString()}
                    </span>
                  </div>

                  {/* Official Response if present */}
                  {c.officialResponse && (
                    <div className="mt-3 p-3 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200/60 dark:border-emerald-900/40 text-xs">
                      <div className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center space-x-1.5 mb-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Official University Action:</span>
                        <span className="font-normal text-slate-500">by {c.officialResponseBy}</span>
                      </div>
                      <p className="text-emerald-950/80 dark:text-emerald-200/90">{c.officialResponse}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* --- TAB 4: CLUB NOTICES --- */}
      {activeAdminTab === 'announcements' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {announcementsList.length === 0 ? (
              <div className="col-span-full py-16 text-center text-slate-400 bg-white/60 dark:bg-slate-900/60 rounded-3xl border border-purple-200/60">
                <Building2 className="w-10 h-10 mx-auto mb-2 opacity-30 text-blue-500" />
                <p className="font-semibold text-slate-600 dark:text-slate-300">No active club announcements</p>
                <p className="text-xs text-slate-400 mt-1">Club leaders can post official bulletins from the Clubs tab.</p>
              </div>
            ) : (
              announcementsList.map((a) => (
                <div
                  key={a.id}
                  className="bg-white/90 dark:bg-slate-900/90 rounded-3xl border border-purple-200/70 dark:border-purple-900/40 p-5 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                        {a.clubName} • {a.clubCategory}
                      </span>
                      <button
                        onClick={() => handleDeleteAnnouncement(a.id)}
                        className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200"
                        title="Delete announcement"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                      {a.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 mb-3">
                      {a.content}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-purple-100 dark:border-purple-900/30 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Posted by {a.authorName}</span>
                    <span>{new Date(a.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* --- TAB 5: CAMPUS ALERT BROADCAST --- */}
      {activeAdminTab === 'broadcast' && (
        <div className="bg-white/90 dark:bg-slate-900/90 rounded-3xl border border-purple-200/70 dark:border-purple-900/40 p-6 shadow-xs max-w-3xl animate-in fade-in duration-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-700 dark:text-emerald-300">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                University Top-Bar Banner Broadcast
              </h2>
              <p className="text-xs text-slate-500">
                Broadcast an urgent announcement pinned to the top of every screen on campus.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveBroadcast} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Broadcast Message
              </label>
              <textarea
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="e.g. 🚨 Midterms Week: Central Library Levels 1-3 open 24/7 with complimentary midnight tea."
                rows={3}
                className="w-full p-3 bg-purple-50/50 dark:bg-slate-800/60 border border-purple-200/80 dark:border-purple-800/80 rounded-2xl text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-300"
              />
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Banner Type
                </label>
                <select
                  value={broadcastType}
                  onChange={(e) => setBroadcastType(e.target.value as any)}
                  className="px-3 py-2 bg-purple-50/50 dark:bg-slate-800/60 border border-purple-200/80 dark:border-purple-800/80 rounded-xl text-xs font-bold"
                >
                  <option value="info">ℹ️ General Info (Pastel Blue)</option>
                  <option value="alert">🚨 Urgent Alert (Pastel Rose)</option>
                  <option value="event">🎉 Special Fest / Event (Pastel Purple)</option>
                </select>
              </div>

              <div className="flex items-center space-x-2 pt-5">
                <input
                  type="checkbox"
                  id="broadcastActiveCheck"
                  checked={broadcastActive}
                  onChange={(e) => setBroadcastActive(e.target.checked)}
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-400"
                />
                <label htmlFor="broadcastActiveCheck" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Activate Live Broadcast on Website
                </label>
              </div>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                className="px-6 py-2.5 bg-gradient-to-r from-purple-300 via-pink-200 to-indigo-300 hover:from-purple-400 hover:to-indigo-400 text-purple-950 font-bold text-xs rounded-2xl shadow-md transition-all active:scale-95"
              >
                Publish Broadcast Alert
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: EDIT USER PROFILE */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-lg border border-purple-200 dark:border-purple-800 shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
                Edit User: {editingUser.displayName}
              </h3>
              <button onClick={() => setEditingUser(null)} className="p-1 rounded-xl text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUserDetails} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Display Name</label>
                <input
                  type="text"
                  value={editingUser.displayName || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, displayName: e.target.value })}
                  className="w-full p-2.5 bg-purple-50/50 dark:bg-slate-800 rounded-xl border border-purple-200 dark:border-purple-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Student ID</label>
                  <input
                    type="text"
                    value={editingUser.studentId || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, studentId: e.target.value })}
                    className="w-full p-2.5 bg-purple-50/50 dark:bg-slate-800 rounded-xl border border-purple-200 dark:border-purple-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Department</label>
                  <input
                    type="text"
                    value={editingUser.department || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })}
                    className="w-full p-2.5 bg-purple-50/50 dark:bg-slate-800 rounded-xl border border-purple-200 dark:border-purple-800"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Hostel Room</label>
                <input
                  type="text"
                  value={editingUser.hostel || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, hostel: e.target.value })}
                  className="w-full p-2.5 bg-purple-50/50 dark:bg-slate-800 rounded-xl border border-purple-200 dark:border-purple-800"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Role</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                  className="w-full p-2.5 bg-purple-50/50 dark:bg-slate-800 rounded-xl border border-purple-200 dark:border-purple-800 font-bold"
                >
                  <option value="student">Student</option>
                  <option value="club">Club Representative</option>
                  <option value="committee">Campus Committee</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-300 dark:bg-purple-800 text-purple-950 dark:text-purple-100 rounded-xl font-bold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: BLOCK USER CONFIRMATION */}
      {blockingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md border border-rose-200 dark:border-rose-900/50 shadow-2xl">
            <div className="flex items-center space-x-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <Ban className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
                  Suspend / Block Student
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Account will lose access to post, comment, and interact.
                </p>
              </div>
              <button 
                onClick={() => setBlockingUser(null)} 
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-rose-50/70 dark:bg-rose-950/30 rounded-2xl border border-rose-200/80 dark:border-rose-900/50 mb-4 flex items-center space-x-3">
              <img
                src={blockingUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt={blockingUser.displayName}
                className="w-10 h-10 rounded-xl object-cover border border-rose-200"
              />
              <div>
                <div className="font-bold text-slate-900 dark:text-white text-xs">{blockingUser.displayName}</div>
                <div className="text-[11px] text-slate-500 font-mono">{blockingUser.email}</div>
                {blockingUser.studentId && (
                  <div className="text-[10px] text-rose-700 dark:text-rose-400 font-mono font-bold">
                    ID: {blockingUser.studentId}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3 text-xs mb-5">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Reason for Suspension / Block
                </label>
                <textarea
                  value={blockReasonInput}
                  onChange={(e) => setBlockReasonInput(e.target.value)}
                  placeholder="Specify violation, e.g. Inappropriate conduct, spamming, rule violations..."
                  rows={3}
                  className="w-full p-3 bg-purple-50/40 dark:bg-slate-800 rounded-xl border border-purple-200/80 dark:border-purple-800 focus:outline-hidden focus:ring-2 focus:ring-rose-400"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setBlockingUser(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-xs hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBlockUser}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1.5 transition-colors"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Confirm Block</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: COMPLAINT OFFICIAL RESPONSE */}
      {respondingComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-lg border border-purple-200 dark:border-purple-800 shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
                Official Grievance Action
              </h3>
              <button onClick={() => setRespondingComplaint(null)} className="p-1 rounded-xl text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResolveComplaint} className="space-y-4 text-xs">
              <div className="p-3 bg-purple-50 dark:bg-slate-800 rounded-2xl border border-purple-100">
                <div className="font-bold text-slate-900 dark:text-white">{respondingComplaint.title}</div>
                <div className="text-slate-500 mt-1">{respondingComplaint.location}</div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Update Investigation / Resolution Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as ComplaintStatus)}
                  className="w-full p-2.5 bg-purple-50/50 dark:bg-slate-800 rounded-xl border border-purple-200 dark:border-purple-800 font-bold"
                >
                  <option value="under_review">🔍 Under Review</option>
                  <option value="investigating">⚙️ Actively Investigating</option>
                  <option value="in_progress">🛠️ Maintenance In Progress</option>
                  <option value="resolved">✅ Resolved & Closed</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Official Administrative Note / Work Ticket Response
                </label>
                <textarea
                  value={officialResponseText}
                  onChange={(e) => setOfficialResponseText(e.target.value)}
                  placeholder="e.g. Maintenance ticket #MNT-4819 generated. Electrician dispatched to inspect hostel block geyser."
                  rows={3}
                  className="w-full p-3 bg-purple-50/50 dark:bg-slate-800 rounded-xl border border-purple-200 dark:border-purple-800"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRespondingComplaint(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-purple-300 via-pink-200 to-indigo-300 text-purple-950 font-bold rounded-xl shadow-xs"
                >
                  Submit Official Response
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
