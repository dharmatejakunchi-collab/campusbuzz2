import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  EyeOff, 
  ThumbsUp, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  MapPin, 
  Plus, 
  Filter, 
  Send,
  UserCheck,
  Building,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Complaint, ComplaintStatus } from '../../types';
import { db } from '../../lib/firebase';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  doc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove, 
  increment 
} from 'firebase/firestore';
import { CreateComplaintModal } from './CreateComplaintModal';
import confetti from 'canvas-confetti';

const STATUS_CONFIGS: Record<ComplaintStatus, { label: string; color: string; bg: string; border: string }> = {
  under_review: {
    label: 'Under Review',
    color: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-100 dark:bg-amber-950/60',
    border: 'border-amber-300 dark:border-amber-800'
  },
  in_progress: {
    label: 'In Progress / Assigned',
    color: 'text-blue-700 dark:text-blue-300',
    bg: 'bg-blue-100 dark:bg-blue-950/60',
    border: 'border-blue-300 dark:border-blue-800'
  },
  resolved: {
    label: 'Resolved & Closed',
    color: 'text-emerald-700 dark:text-emerald-300',
    bg: 'bg-emerald-100 dark:bg-emerald-950/60',
    border: 'border-emerald-300 dark:border-emerald-800'
  },
  acknowledged: {
    label: 'Acknowledged by Dean',
    color: 'text-purple-700 dark:text-purple-300',
    bg: 'bg-purple-100 dark:bg-purple-950/60',
    border: 'border-purple-300 dark:border-purple-800'
  },
  open: {
    label: 'Open',
    color: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-100 dark:bg-amber-950/60',
    border: 'border-amber-300 dark:border-amber-800'
  },
  investigating: {
    label: 'Investigating',
    color: 'text-blue-700 dark:text-blue-300',
    bg: 'bg-blue-100 dark:bg-blue-950/60',
    border: 'border-blue-300 dark:border-blue-800'
  }
};

export const ComplaintSection: React.FC = () => {
  const { profile, role } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Admin response editing state
  const [activeAdminEditId, setActiveAdminEditId] = useState<string | null>(null);
  const [adminStatusInput, setAdminStatusInput] = useState<ComplaintStatus>('in_progress');
  const [adminNoteInput, setAdminNoteInput] = useState('');

  const isAdmin = role === 'admin';

  useEffect(() => {
    setLoading(true);
    const complaintsRef = collection(db, 'complaints');
    const q = query(complaintsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: Complaint[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...d.data() } as Complaint);
        });
        setComplaints(list);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching complaints:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Upvote toggle
  const handleUpvote = async (complaint: Complaint) => {
    if (!profile) return;
    const isUpvoted = complaint.upvoters?.includes(profile.uid);
    const docRef = doc(db, 'complaints', complaint.id);

    try {
      if (isUpvoted) {
        await updateDoc(docRef, {
          upvoters: arrayRemove(profile.uid),
          upvotesCount: increment(-1)
        });
      } else {
        await updateDoc(docRef, {
          upvoters: arrayUnion(profile.uid),
          upvotesCount: increment(1)
        });
        confetti({ particleCount: 30, spread: 40 });
      }
    } catch (err) {
      console.error('Error updating upvote:', err);
    }
  };

  // Admin update resolution
  const handleSaveAdminResponse = async (complaintId: string) => {
    if (!isAdmin || !profile) return;

    try {
      const updatePayload: Partial<Complaint> = {
        status: adminStatusInput,
        adminResponse: {
          responderName: profile.displayName || 'Campus Administration',
          responderRole: 'Campus Dean / Facility Admin',
          response: adminNoteInput.trim() || 'Issue investigated and maintenance scheduled.',
          updatedAt: Date.now()
        },
        resolvedAt: adminStatusInput === 'resolved' ? Date.now() : null
      };

      await updateDoc(doc(db, 'complaints', complaintId), updatePayload);
      setActiveAdminEditId(null);
      setAdminNoteInput('');
      confetti({ particleCount: 50, spread: 60 });
    } catch (err) {
      console.error('Error updating complaint status:', err);
    }
  };

  const filteredComplaints = complaints
    .filter((item) => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
      if (selectedStatus !== 'all' && item.status !== selectedStatus) return false;
      return true;
    })
    .sort((a, b) => (b.upvotesCount || 0) - (a.upvotesCount || 0));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-100 via-pink-50 to-amber-100 p-6 sm:p-8 text-rose-950 shadow-sm border border-rose-200/80">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-white/80 text-rose-800 border border-rose-200 text-xs font-black tracking-wider uppercase shadow-xs">
            <EyeOff className="w-3.5 h-3.5 text-rose-600" />
            <span>Campus Grievance & Facility Portal</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-rose-950 leading-tight">
            Anonymous Student Voice & Facility Tracking
          </h1>

          <p className="text-sm sm:text-base text-rose-900/80 leading-relaxed font-medium">
            Report maintenance, hostel, cafeteria, or IT issues completely anonymously. Upvote recurring problems so campus administration can prioritize and publish verified resolution notes.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              id="create-complaint-btn"
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center space-x-1.5 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Submit Anonymous Grievance</span>
            </button>

            {isAdmin && (
              <span className="px-3 py-1 bg-white/90 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center space-x-1 shadow-xs">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                <span>Admin Resolution Mode Active</span>
              </span>
            )}
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-rose-300/30 to-transparent pointer-events-none" />
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none w-full sm:w-auto">
          {['all', 'Hostel & Mess', 'Infrastructure', 'Wi-Fi & IT', 'Academic', 'Transport', 'Safety & Hygiene'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                selectedCategory === cat
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-200'
                  : 'bg-white text-slate-600 border border-rose-100 hover:bg-rose-50 shadow-xs'
              }`}
            >
              {cat === 'all' ? '📢 All Categories' : cat}
            </button>
          ))}
        </div>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-1.5 text-xs font-bold rounded-xl bg-white border border-rose-100 text-slate-700 self-end sm:self-auto shadow-xs"
        >
          <option value="all">All Statuses</option>
          <option value="under_review">Under Review</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="acknowledged">Acknowledged</option>
        </select>
      </div>

      {/* Complaints List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-44 rounded-3xl bg-rose-50/60 border border-rose-100 animate-pulse" />
          ))}
        </div>
      ) : filteredComplaints.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white/95 rounded-3xl border border-dashed border-rose-200">
          <EyeOff className="w-12 h-12 text-rose-300 mx-auto mb-2" />
          <h3 className="text-base font-extrabold text-slate-800">
            No complaints found
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Grievances reported by students appear here anonymously for campus tracking.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredComplaints.map((item) => {
            const isUpvoted = profile ? item.upvoters?.includes(profile.uid) : false;
            const statusConfig = STATUS_CONFIGS[item.status] || STATUS_CONFIGS.under_review;
            const isEditing = activeAdminEditId === item.id;

            return (
              <div
                key={item.id}
                id={`complaint-card-${item.id}`}
                className="bg-white/95 rounded-3xl border border-rose-100 p-5 sm:p-6 shadow-sm hover:shadow-md transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  
                  {/* Left content */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-black uppercase px-2.5 py-0.5 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300">
                        {item.category}
                      </span>

                      <span className={`text-[11px] font-black uppercase px-2.5 py-0.5 rounded-lg border ${statusConfig.bg} ${statusConfig.color} ${statusConfig.border}`}>
                        ● {statusConfig.label}
                      </span>

                      <span className="text-[11px] text-slate-400 flex items-center">
                        <MapPin className="w-3 h-3 mr-1 text-slate-400" />
                        {item.location}
                      </span>
                    </div>

                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                      {item.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {item.description}
                    </p>

                    {item.evidenceUrl && (
                      <div className="pt-1">
                        <img
                          src={item.evidenceUrl}
                          alt="Grievance evidence"
                          className="w-48 h-28 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-sm"
                        />
                      </div>
                    )}
                  </div>

                  {/* Right upvote pill */}
                  <div className="flex items-center sm:flex-col justify-between sm:justify-center gap-2 shrink-0">
                    <button
                      id={`upvote-complaint-${item.id}`}
                      onClick={() => handleUpvote(item)}
                      className={`px-4 py-2 rounded-2xl flex sm:flex-col items-center justify-center space-x-1.5 sm:space-x-0 sm:space-y-1 transition-all ${
                        isUpvoted
                          ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 scale-105'
                          : 'bg-slate-100 dark:bg-slate-700/70 hover:bg-rose-50 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600'
                      }`}
                    >
                      <ThumbsUp className={`w-4 h-4 ${isUpvoted ? 'fill-white' : ''}`} />
                      <span className="font-black text-xs">{item.upvotesCount || 0}</span>
                      <span className="text-[9px] uppercase font-bold hidden sm:inline opacity-80">Upvotes</span>
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => {
                          setActiveAdminEditId(isEditing ? null : item.id);
                          setAdminStatusInput(item.status);
                          setAdminNoteInput(item.adminResponse?.response || '');
                        }}
                        className="text-[11px] font-bold text-blue-600 hover:text-blue-700 underline"
                      >
                        {isEditing ? 'Cancel Admin Edit' : 'Manage / Resolve'}
                      </button>
                    )}
                  </div>
                </div>

                {/* ADMIN RESPONSE BOX (IF RESOLVED OR ANSWERED) */}
                {item.adminResponse && !isEditing && (
                  <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-1.5 font-bold text-emerald-800 dark:text-emerald-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Official Campus Administration Response</span>
                      </div>
                      <span className="text-[10px] text-emerald-600/80">
                        {new Date(item.adminResponse.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                      "{item.adminResponse.response}"
                    </p>
                    <div className="text-[10px] text-slate-400">
                      — {item.adminResponse.responderName} ({item.adminResponse.responderRole})
                    </div>
                  </div>
                )}

                {/* ADMIN EDIT PANEL (VISIBLE TO ADMIN ON TOGGLE) */}
                {isAdmin && isEditing && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-blue-300 dark:border-blue-700 space-y-3 animate-in fade-in">
                    <div className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center space-x-1.5">
                      <ShieldAlert className="w-4 h-4 text-blue-600" />
                      <span>Admin Resolution Action Form</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Set Status</label>
                        <select
                          value={adminStatusInput}
                          onChange={(e: any) => setAdminStatusInput(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        >
                          <option value="under_review">Under Review</option>
                          <option value="in_progress">In Progress / Assigned</option>
                          <option value="resolved">Resolved & Closed</option>
                          <option value="acknowledged">Acknowledged by Dean</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Official Campus Response</label>
                      <textarea
                        rows={2}
                        value={adminNoteInput}
                        onChange={(e) => setAdminNoteInput(e.target.value)}
                        placeholder="e.g., Plumber dispatched, replacement valve installed today at 3 PM."
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>

                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => setActiveAdminEditId(null)}
                        className="px-3 py-1.5 text-xs text-slate-500 font-bold"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveAdminResponse(item.id)}
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow"
                      >
                        Save & Publish Resolution
                      </button>
                    </div>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

      {/* Anonymous Complaint Modal */}
      {showCreateModal && (
        <CreateComplaintModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      )}

    </div>
  );
};
