import React, { useState } from 'react';
import { 
  X, 
  ShieldAlert, 
  EyeOff, 
  Send, 
  AlertCircle,
  Loader2,
  CheckCircle2,
  Image as ImageIcon
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ImageGalleryUploader } from '../common/ImageGalleryUploader';

interface CreateComplaintModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateComplaintModal: React.FC<CreateComplaintModalProps> = ({ isOpen, onClose }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'Hostel & Mess' | 'Infrastructure' | 'Wi-Fi & IT' | 'Academic' | 'Transport' | 'Safety & Hygiene'>('Infrastructure');
  const [location, setLocation] = useState('Library 3rd Floor / Main Wing');
  const [evidenceUrl, setEvidenceUrl] = useState('');

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setErrorMessage('Please provide a complaint subject and detailed description.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      // Strictly anonymous: NO author name, email, or user UID attached
      const complaintData = {
        title: title.trim(),
        description: description.trim(),
        category,
        location: location.trim(),
        evidenceUrl: evidenceUrl.trim() || null,
        status: 'under_review',
        upvotesCount: 1, // initial author upvote
        upvoters: ['anonymous_init'],
        adminResponse: null,
        resolvedAt: null,
        createdAt: Date.now()
      };

      await addDoc(collection(db, 'complaints'), complaintData);
      setSubmitted(true);
    } catch (err: any) {
      console.error('Error creating anonymous complaint:', err);
      setErrorMessage(err.message || 'Failed to submit grievance.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 animate-in fade-in">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-rose-50/50 dark:bg-rose-950/20 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center font-bold">
              <EyeOff className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                Submit Anonymous Campus Grievance
              </h2>
              <p className="text-xs text-rose-700 dark:text-rose-300">
                100% untracked • No identity metadata stored
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
              Anonymous Grievance Submitted!
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xs mx-auto">
              Your grievance has been posted anonymously for campus students to upvote and administrators to review and resolve.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs rounded-xl shadow"
            >
              Close
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

            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-xl text-xs text-amber-900 dark:text-amber-300 flex items-start space-x-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Privacy Guaranteed:</strong> Your student account details (name, email, photo) are completely stripped before saving to the database.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Grievance Subject / Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Block C 2nd Floor Water Purifier Leaking & Low Flow"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e: any) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="Hostel & Mess">Hostel & Mess</option>
                  <option value="Infrastructure">Campus Infrastructure</option>
                  <option value="Wi-Fi & IT">Wi-Fi & IT Services</option>
                  <option value="Academic">Academic & Scheduling</option>
                  <option value="Transport">Campus Transport / Shuttle</option>
                  <option value="Safety & Hygiene">Safety & Hygiene</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Campus Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Mess Hall 2 / East Wing"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Detailed Grievance Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain the recurring issue, how long it has persisted, and affected students..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <ImageGalleryUploader
                value={evidenceUrl}
                onChange={(imgData) => setEvidenceUrl(imgData)}
                label="Evidence Photo from Gallery (Optional)"
                aspectRatioLabel="Upload photo evidence from your gallery or camera (PNG, JPG, WebP)"
                required={false}
                idPrefix="complaint-evidence"
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
                className="px-5 py-2 text-xs font-black uppercase bg-gradient-to-r from-rose-400 to-pink-400 hover:from-rose-500 hover:to-pink-500 text-white rounded-xl shadow-md flex items-center space-x-1.5"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Submit Grievance Anonymously</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
