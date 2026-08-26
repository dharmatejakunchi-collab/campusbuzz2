import React, { useState } from 'react';
import { 
  X, 
  Calendar, 
  Sparkles, 
  MapPin, 
  Clock, 
  Send, 
  AlertCircle,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

interface RequestEventModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RequestEventModal: React.FC<RequestEventModalProps> = ({ isOpen, onClose }) => {
  const { profile } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [proposedDate, setProposedDate] = useState('2026-09-25');
  const [proposedTime, setProposedTime] = useState('06:00 PM');
  const [proposedVenue, setProposedVenue] = useState('Student Center Lawn / Quad');
  const [category, setCategory] = useState('Social');

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setErrorMessage('Please fill in the event title and description.');
      return;
    }
    if (!profile) {
      setErrorMessage('You must be signed in to submit an event request.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const requestData = {
        title: title.trim(),
        description: description.trim(),
        proposedDate,
        proposedTime,
        proposedVenue,
        category,
        requestedByStudentId: profile.uid,
        requestedByStudentName: profile.displayName,
        requestedByStudentEmail: profile.email,
        status: 'pending',
        createdAt: Date.now()
      };

      await addDoc(collection(db, 'event_requests'), requestData);
      setSubmitted(true);
    } catch (err: any) {
      console.error('Error submitting event request:', err);
      setErrorMessage(err.message || 'Failed to submit event request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 animate-in fade-in">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-blue-50/50 dark:bg-blue-950/20 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                Request Admin to Schedule Event
              </h2>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Lightweight student proposal workflow
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Event Request Sent to Campus Admin!
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xs mx-auto">
              Admins review and publish student event requests onto the shared Event Calendar.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl shadow"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Proposed Event Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Open Campus Chess Tournament & Board Game Night"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Description & Objectives <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Why should this event happen? Expected student turnout, equipment needs..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Proposed Date</label>
                <input
                  type="date"
                  value={proposedDate}
                  onChange={(e) => setProposedDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Proposed Time</label>
                <input
                  type="text"
                  value={proposedTime}
                  onChange={(e) => setProposedTime(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Proposed Venue / Space</label>
              <input
                type="text"
                value={proposedVenue}
                onChange={(e) => setProposedVenue(e.target.value)}
                placeholder="e.g. Student Lounge or West Courtyard"
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 text-xs font-black uppercase bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md flex items-center space-x-1.5"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Submit Request</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
