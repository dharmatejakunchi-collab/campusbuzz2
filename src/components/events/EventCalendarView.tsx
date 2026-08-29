import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Users, 
  Plus, 
  Check, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  Building2, 
  ExternalLink, 
  ShieldCheck, 
  UserCheck, 
  Filter,
  Inbox,
  CheckCircle2,
  XCircle,
  Share2,
  Trash2,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { CampusEvent, EventRequest } from '../../types';
import { db } from '../../lib/firebase';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  doc, 
  updateDoc, 
  addDoc, 
  setDoc,
  deleteDoc
} from 'firebase/firestore';
import { RequestEventModal } from './RequestEventModal';
import { ImageGalleryUploader } from '../common/ImageGalleryUploader';
import confetti from 'canvas-confetti';

interface EventCalendarViewProps {
  initialSelectedEventId?: string;
}

export const EventCalendarView: React.FC<EventCalendarViewProps> = ({ initialSelectedEventId }) => {
  const { user, profile, role } = useAuth();
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [requests, setRequests] = useState<EventRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'calendar' | 'requests'>('calendar');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showDirectCreateModal, setShowDirectCreateModal] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // New Event Form for Clubs/Admins
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDate, setNewDate] = useState('2026-09-18');
  const [newTime, setNewTime] = useState('06:00 PM');
  const [newVenue, setNewVenue] = useState('Student Center Amphitheatre');
  const [newCategory, setNewCategory] = useState<'Technical' | 'Cultural' | 'Sports' | 'Academic' | 'Career' | 'Social'>('Cultural');
  const [newBanner, setNewBanner] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const userEmail = (profile?.email || user?.email || '').toLowerCase().trim();
  const isAdmin = role === 'admin' || profile?.role === 'admin' || userEmail === 'dharmatejakunchi@gmail.com' || userEmail.startsWith('admin');
  const canManage = role === 'club' || role === 'committee' || isAdmin;

  const handleDeleteEvent = async (eventId: string) => {
    if (confirmDeleteId !== eventId) {
      setConfirmDeleteId(eventId);
      setTimeout(() => {
        setConfirmDeleteId((prev) => (prev === eventId ? null : prev));
      }, 4000);
      return;
    }

    setDeletingId(eventId);
    try {
      await deleteDoc(doc(db, 'events', eventId));
    } catch (err) {
      console.error('Error deleting event:', err);
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  // Real-time events subscriber
  useEffect(() => {
    setLoading(true);
    const eventsQuery = query(collection(db, 'events'), orderBy('date', 'asc'));

    const unsubEvents = onSnapshot(
      eventsQuery,
      (snapshot) => {
        const list: CampusEvent[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...d.data() } as CampusEvent);
        });
        setEvents(list);
        setLoading(false);
      },
      (err) => {
        console.warn('Notice listening to events:', err.message);
        setLoading(false);
      }
    );

    const requestsQuery = query(collection(db, 'event_requests'), orderBy('createdAt', 'desc'));
    const unsubRequests = onSnapshot(
      requestsQuery,
      (snapshot) => {
        const list: EventRequest[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...d.data() } as EventRequest);
        });
        setRequests(list);
      },
      (err) => {
        console.warn('Notice listening to event requests:', err.message);
      }
    );

    return () => {
      unsubEvents();
      unsubRequests();
    };
  }, []);

  // RSVP Handler
  const handleRsvp = async (event: CampusEvent, status: 'going' | 'interested') => {
    if (!profile) return;
    const currentStatus = event.attendees?.[profile.uid]?.status;

    let attendees = { ...(event.attendees || {}) };
    let goingCount = event.goingCount || 0;
    let interestedCount = event.interestedCount || 0;

    if (currentStatus === status) {
      // Remove RSVP
      delete attendees[profile.uid];
      if (status === 'going') goingCount = Math.max(0, goingCount - 1);
      if (status === 'interested') interestedCount = Math.max(0, interestedCount - 1);
    } else {
      // Add or change RSVP
      if (currentStatus === 'going') goingCount = Math.max(0, goingCount - 1);
      if (currentStatus === 'interested') interestedCount = Math.max(0, interestedCount - 1);

      attendees[profile.uid] = {
        name: profile.displayName,
        avatar: profile.photoURL,
        status,
        timestamp: Date.now()
      };

      if (status === 'going') {
        goingCount++;
        confetti({ particleCount: 40, spread: 50, origin: { y: 0.7 } });
      } else {
        interestedCount++;
      }
    }

    try {
      await updateDoc(doc(db, 'events', event.id), {
        attendees,
        goingCount,
        interestedCount
      });
    } catch (err) {
      console.error('RSVP update error:', err);
    }
  };

  // Admin approval of student event request
  const handleApproveRequest = async (req: EventRequest) => {
    if (!canManage) return;
    try {
      // Create actual event
      const newEventData: Partial<CampusEvent> = {
        title: req.title,
        description: `${req.description} (Requested by student ${req.requestedByStudentName})`,
        clubName: profile?.displayName || 'Campus Administration',
        clubRole: role,
        organizerId: profile?.uid || 'admin',
        organizerName: profile?.displayName || 'Campus Admin',
        date: req.proposedDate,
        time: req.proposedTime,
        venue: req.proposedVenue,
        category: (req.category as any) || 'Social',
        bannerUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1000&auto=format&fit=crop&q=80',
        attendees: {},
        goingCount: 1,
        interestedCount: 0,
        createdAt: Date.now()
      };

      await addDoc(collection(db, 'events'), newEventData);

      // Update request status
      await updateDoc(doc(db, 'event_requests', req.id), {
        status: 'approved',
        adminNotes: `Approved by ${profile?.displayName}`
      });

      confetti({ particleCount: 60, spread: 60 });
    } catch (err) {
      console.error('Approve error:', err);
    }
  };

  const handleRejectRequest = async (reqId: string) => {
    if (!canManage) return;
    try {
      await updateDoc(doc(db, 'event_requests', reqId), {
        status: 'rejected'
      });
    } catch (err) {
      console.error('Reject error:', err);
    }
  };

  // Club Direct Event Creation
  const handleCreateDirectEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) return;

    setIsSubmitting(true);
    try {
      const eventData = {
        title: newTitle.trim(),
        description: newDesc.trim(),
        clubName: profile?.clubName || profile?.displayName || 'Campus Club',
        clubRole: role,
        organizerId: profile?.uid || 'user',
        organizerName: profile?.displayName || 'Organizer',
        date: newDate,
        time: newTime,
        venue: newVenue,
        category: newCategory,
        bannerUrl: newBanner,
        attendees: {},
        goingCount: 0,
        interestedCount: 0,
        createdAt: Date.now()
      };

      await addDoc(collection(db, 'events'), eventData);
      setShowDirectCreateModal(false);
      setNewTitle('');
      setNewDesc('');
      confetti({ particleCount: 50 });
    } catch (err) {
      console.error('Error creating event:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredEvents = events.filter((e) => {
    if (selectedCategory === 'all') return true;
    return e.category?.toLowerCase() === selectedCategory.toLowerCase();
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-100 via-indigo-50 to-purple-100 p-6 sm:p-8 text-sky-950 shadow-sm border border-sky-200/80">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-white/80 text-sky-800 border border-sky-200 text-xs font-black tracking-wider uppercase shadow-xs">
            <CalendarIcon className="w-3.5 h-3.5 text-sky-600" />
            <span>Shared Campus Event Calendar</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-sky-950 leading-tight">
            Discover Campus Festivals, Hackathons & Club Events.
          </h1>

          <p className="text-sm sm:text-base text-sky-900/80 leading-relaxed font-medium">
            All students see upcoming events from verified clubs, committees, and administration. RSVP in 1-click and request custom student events directly to Admin.
          </p>

          {/* Action Row */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              id="student-request-event-btn"
              onClick={() => setShowRequestModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center space-x-1.5 active:scale-95 transition-all"
            >
              <Sparkles className="w-4 h-4 text-sky-100" />
              <span>Request Admin to Schedule Event</span>
            </button>

            {canManage && (
              <button
                id="club-create-event-btn"
                onClick={() => setShowDirectCreateModal(true)}
                className="px-4 py-2 bg-white text-slate-800 hover:bg-sky-50 font-extrabold text-xs rounded-xl shadow-sm border border-sky-200 flex items-center space-x-1.5 active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4 text-sky-600" />
                <span>+ Add Club Event Directly</span>
              </button>
            )}
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-sky-300/30 to-transparent pointer-events-none" />
      </div>

      {/* Tabs (Calendar vs Admin Review Requests) */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        
        {/* Category filters */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
          {['all', 'Technical', 'Cultural', 'Sports', 'Academic', 'Career', 'Social'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                selectedCategory === cat
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-200'
                  : 'bg-white text-slate-600 border border-sky-100 hover:bg-sky-50 shadow-xs'
              }`}
            >
              {cat === 'all' ? '📅 All Events' : cat}
            </button>
          ))}
        </div>

        {/* Requests Management Tab for Club/Admins */}
        {canManage && (
          <div className="flex items-center space-x-1 bg-purple-50/80 p-1 rounded-xl border border-purple-100 text-xs">
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-3 py-1 rounded-lg font-bold ${
                activeTab === 'calendar' ? 'bg-white text-sky-700 shadow-xs border border-purple-100' : 'text-slate-500'
              }`}
            >
              Calendar ({events.length})
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-3 py-1 rounded-lg font-bold flex items-center space-x-1 ${
                activeTab === 'requests' ? 'bg-white text-sky-700 shadow-xs border border-purple-100' : 'text-slate-500'
              }`}
            >
              <Inbox className="w-3.5 h-3.5" />
              <span>Student Proposals</span>
              {requests.filter(r => r.status === 'pending').length > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* VIEW 1: CALENDAR EVENTS GRID */}
      {activeTab === 'calendar' && (
        <>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-80 rounded-3xl bg-sky-50/60 border border-sky-100 animate-pulse" />
              ))}
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-16 px-4 bg-white/95 rounded-3xl border border-dashed border-sky-200">
              <CalendarIcon className="w-12 h-12 text-sky-300 mx-auto mb-2" />
              <h3 className="text-base font-extrabold text-slate-800">
                No events in this category yet
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Clubs and committees regularly post campus events here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => {
                const userRsvp = profile ? event.attendees?.[profile.uid]?.status : undefined;
                const isGoing = userRsvp === 'going';
                const isInterested = userRsvp === 'interested';

                // Google Calendar export link generator
                const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&details=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.venue)}`;

                return (
                  <div
                    key={event.id}
                    id={`event-card-${event.id}`}
                    className="bg-white/95 rounded-3xl border border-sky-100 shadow-sm hover:shadow-lg transition-all overflow-hidden flex flex-col justify-between"
                  >
                    {/* Banner Image with Date Badge */}
                    <div className="relative h-44 w-full bg-sky-50 overflow-hidden">
                      <img
                        src={event.bannerUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800'}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

                      {/* Date Pill Tag */}
                      <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md rounded-xl p-2 text-center shadow-md border border-sky-200 min-w-[54px]">
                        <div className="text-[10px] font-black uppercase text-sky-600">
                          {new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}
                        </div>
                        <div className="text-lg font-black text-slate-800 leading-tight">
                          {new Date(event.date).getDate() || 15}
                        </div>
                      </div>

                      {/* Category Tag */}
                      <div className="absolute top-3 right-3">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-sky-500 text-white shadow-xs">
                          {event.category}
                        </span>
                      </div>

                      {/* Organizer bottom chip */}
                      <div className="absolute bottom-2.5 left-3 right-3 text-white text-xs flex items-center justify-between">
                        <span className="font-bold truncate bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md">
                          🏛️ {event.clubName}
                        </span>
                        {event.linkedAnnouncementId && (
                          <span className="text-[10px] bg-purple-500/90 px-2 py-0.5 rounded font-bold">
                            Linked Notice
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Event Body */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2.5">
                        <h3 className="font-extrabold text-base text-slate-800 leading-snug">
                          {event.title}
                        </h3>

                        <div className="space-y-1 text-xs text-slate-600">
                          <div className="flex items-center">
                            <Clock className="w-3.5 h-3.5 text-sky-500 mr-1.5 shrink-0" />
                            <span>{event.time} {event.endTime ? `– ${event.endTime}` : ''}</span>
                          </div>
                          <div className="flex items-center">
                            <MapPin className="w-3.5 h-3.5 text-rose-500 mr-1.5 shrink-0" />
                            <span className="truncate">{event.venue}</span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {event.description}
                        </p>
                      </div>

                      {/* Attendee counters & Actions */}
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-700/80 space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-300 font-semibold">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            <span>{event.goingCount || 0} Going • {event.interestedCount || 0} Interested</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <a
                              href={googleCalUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                              title="Add to Google Calendar"
                            >
                              <span>Add to Cal</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>

                            {(isAdmin || (profile && profile.uid === event.organizerId) || (user && user.uid === event.organizerId)) && (
                              <button
                                id={`delete-event-${event.id}`}
                                onClick={() => handleDeleteEvent(event.id)}
                                disabled={deletingId === event.id}
                                className={`p-1 rounded-lg border transition-all text-[11px] font-bold flex items-center justify-center ${
                                  confirmDeleteId === event.id
                                    ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-600 px-2 space-x-1 animate-pulse'
                                    : 'bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 dark:text-rose-400 border-rose-200 dark:border-rose-800/60'
                                }`}
                                title={isAdmin ? "Admin: Delete Event" : "Delete Event"}
                              >
                                {deletingId === event.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : confirmDeleteId === event.id ? (
                                  <>
                                    <Trash2 className="w-3 h-3 mr-0.5" />
                                    <span>Delete?</span>
                                  </>
                                ) : (
                                  <Trash2 className="w-3 h-3" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Interactive RSVP Buttons */}
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            id={`rsvp-going-btn-${event.id}`}
                            onClick={() => handleRsvp(event, 'going')}
                            className={`py-2 rounded-xl text-xs font-black flex items-center justify-center space-x-1.5 transition-all ${
                              isGoing
                                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400'
                                : 'bg-slate-100 dark:bg-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600'
                            }`}
                          >
                            <CheckCircle2 className={`w-3.5 h-3.5 ${isGoing ? 'text-white' : 'text-slate-400'}`} />
                            <span>{isGoing ? 'Going ✓' : 'I am Going'}</span>
                          </button>

                          <button
                            id={`rsvp-interested-btn-${event.id}`}
                            onClick={() => handleRsvp(event, 'interested')}
                            className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
                              isInterested
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-slate-100 dark:bg-slate-700 hover:bg-blue-50 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600'
                            }`}
                          >
                            <Sparkles className={`w-3.5 h-3.5 ${isInterested ? 'text-white' : 'text-slate-400'}`} />
                            <span>{isInterested ? 'Interested ★' : 'Interested'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* VIEW 2: ADMIN STUDENT PROPOSALS / REQUESTS TAB */}
      {activeTab === 'requests' && canManage && (
        <div className="space-y-4">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
            <Inbox className="w-5 h-5 text-blue-500" />
            <span>Student Event Proposals Queue</span>
          </h2>
          <p className="text-xs text-slate-500">
            Review student requests. Approving will automatically schedule and surface the event on the campus-wide calendar.
          </p>

          {requests.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 text-slate-500 text-xs">
              No pending student event requests.
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((req) => (
                <div
                  key={req.id}
                  className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-black text-slate-900 dark:text-white">
                        {req.title}
                      </span>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                        req.status === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : req.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {req.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      {req.description}
                    </p>

                    <div className="text-[11px] text-slate-400 flex flex-wrap gap-3 pt-1">
                      <span>👤 Proposed by: <strong>{req.requestedByStudentName}</strong> ({req.requestedByStudentEmail})</span>
                      <span>📅 Date: {req.proposedDate} at {req.proposedTime}</span>
                      <span>📍 Venue: {req.proposedVenue}</span>
                    </div>
                  </div>

                  {req.status === 'pending' && (
                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => handleRejectRequest(req.id)}
                        className="px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => handleApproveRequest(req)}
                        className="px-4 py-1.5 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow"
                      >
                        Approve & Publish
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Student Request Modal */}
      {showRequestModal && (
        <RequestEventModal
          isOpen={showRequestModal}
          onClose={() => setShowRequestModal(false)}
        />
      )}

      {/* Club Direct Event Modal */}
      {showDirectCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 animate-in fade-in">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-blue-50/50 dark:bg-blue-950/20 flex items-center justify-between">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                Add Campus Calendar Event
              </h2>
              <button onClick={() => setShowDirectCreateModal(false)}>
                <XCircle className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateDirectEvent} className="p-6 space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Event Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                  placeholder="e.g. AI & Robotics Demo Showcase"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Description</label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  placeholder="Event schedule, speakers, takeaways..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Date</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Time</label>
                  <input
                    type="text"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Venue</label>
                <input
                  type="text"
                  value={newVenue}
                  onChange={(e) => setNewVenue(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <ImageGalleryUploader
                  value={newBanner}
                  onChange={(imgData) => setNewBanner(imgData)}
                  label="Event Poster / Banner (From Gallery)"
                  aspectRatioLabel="Select event flyer from your photo gallery (PNG, JPG, WebP)"
                  required={false}
                  idPrefix="calendar-event-banner"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowDirectCreateModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-black bg-gradient-to-r from-blue-400 to-cyan-300 hover:from-blue-500 hover:to-cyan-400 text-blue-950 rounded-xl shadow"
                >
                  Publish to Calendar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
