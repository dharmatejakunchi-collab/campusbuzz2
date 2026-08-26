import React, { useState } from 'react';
import { 
  X, 
  Building2, 
  Sparkles, 
  Calendar, 
  Link, 
  FileText, 
  Image as ImageIcon, 
  Check, 
  AlertCircle,
  Clock,
  MapPin,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ClubAnnouncement, CampusEvent } from '../../types';
import { db } from '../../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ImageGalleryUploader } from '../common/ImageGalleryUploader';

interface CreateAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export const CreateAnnouncementModal: React.FC<CreateAnnouncementModalProps> = ({
  isOpen,
  onClose,
  onCreated
}) => {
  const { profile, role } = useAuth();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [clubName, setClubName] = useState(profile?.clubName || profile?.displayName || 'Campus Society');
  const [category, setCategory] = useState<'Technical' | 'Cultural' | 'Sports' | 'Academic' | 'Social' | 'Administration'>('Technical');
  const [bannerUrl, setBannerUrl] = useState('');
  
  // Google Form Embed
  const [googleFormUrl, setGoogleFormUrl] = useState('');
  const [googleFormTitle, setGoogleFormTitle] = useState('Official Registration Form');

  // External link / attachment
  const [externalUrl, setExternalUrl] = useState('');
  const [attachmentName, setAttachmentName] = useState('');

  // Event Calendar Linking
  const [linkToCalendar, setLinkToCalendar] = useState(false);
  const [eventDate, setEventDate] = useState('2026-09-15');
  const [eventTime, setEventTime] = useState('05:30 PM');
  const [eventVenue, setEventVenue] = useState('Main Auditorium');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setErrorMessage('Title and announcement content are required.');
      return;
    }
    if (role !== 'club' && role !== 'committee' && role !== 'admin') {
      setErrorMessage('Access restricted: Only Club, Committee, or Admin accounts can publish official announcements.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    const defaultBanner = 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1000&auto=format&fit=crop&q=80';
    const finalBanner = bannerUrl.trim() || defaultBanner;

    try {
      let createdEventId: string | undefined = undefined;

      // If linking to calendar, first create the Event doc
      if (linkToCalendar) {
        const eventData = {
          title: title.trim(),
          description: content.trim(),
          clubName: clubName.trim(),
          clubRole: role,
          organizerId: profile?.uid || 'club_user',
          organizerName: profile?.displayName || clubName,
          date: eventDate,
          time: eventTime,
          venue: eventVenue,
          category,
          bannerUrl: finalBanner,
          registrationUrl: googleFormUrl || externalUrl || undefined,
          attendees: {},
          goingCount: 0,
          interestedCount: 0,
          createdAt: Date.now()
        };

        const eventDocRef = await addDoc(collection(db, 'events'), eventData);
        createdEventId = eventDocRef.id;
      }

      // Create announcement
      const announcementData = {
        title: title.trim(),
        content: content.trim(),
        authorId: profile?.uid || 'user',
        authorName: profile?.displayName || clubName,
        authorRole: role,
        clubName: clubName.trim(),
        clubCategory: category,
        bannerUrl: finalBanner,
        googleFormUrl: googleFormUrl.trim() || null,
        googleFormTitle: googleFormUrl.trim() ? googleFormTitle : null,
        externalUrl: externalUrl.trim() || null,
        attachmentName: attachmentName.trim() || null,
        linkedEventId: createdEventId || null,
        isPinned: false,
        likesCount: 0,
        likedBy: [],
        createdAt: Date.now()
      };

      await addDoc(collection(db, 'club_announcements'), announcementData);

      if (onCreated) onCreated();
      onClose();
    } catch (err: any) {
      console.error('Error publishing club announcement:', err);
      setErrorMessage(err.message || 'Failed to publish announcement.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 animate-in fade-in">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-purple-50/50 dark:bg-purple-950/20 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                Publish Official Club / Admin Notice
              </h2>
              <p className="text-xs text-purple-700 dark:text-purple-300">
                Official communication space • Rich forms & Event Calendar linking
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

        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Club / Committee Organization Name
              </label>
              <input
                type="text"
                value={clubName}
                onChange={(e) => setClubName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e: any) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="Technical">Technical & Robotics</option>
                <option value="Cultural">Cultural & Arts</option>
                <option value="Sports">Sports & Fitness</option>
                <option value="Academic">Academic & Research</option>
                <option value="Career">Career & Placement</option>
                <option value="Administration">University Administration</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Announcement Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Annual Tech Fest 2026 Registration & Workshop Auditions"
              className="w-full px-4 py-2.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Notice Content Body <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Full announcement details, rules, deadlines, prizes, schedule, or prerequisites..."
              className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              required
            />
          </div>

          {/* Banner Flyer Gallery Upload */}
          <div>
            <ImageGalleryUploader
              value={bannerUrl}
              onChange={(imgData) => setBannerUrl(imgData)}
              label="Banner / Flyer Image"
              aspectRatioLabel="Select from your photo gallery or drop event flyer (PNG, JPG, WebP)"
              required={false}
              idPrefix="announcement-banner"
            />
          </div>

          {/* Google Form Integration (per spec requirement) */}
          <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/40 space-y-2.5">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <h4 className="text-xs font-extrabold text-purple-900 dark:text-purple-300 uppercase">
                Embedded Google Form (Optional)
              </h4>
            </div>
            <p className="text-[11px] text-slate-500">
              Students can view and fill the form directly inside the club feed.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="url"
                value={googleFormUrl}
                onChange={(e) => setGoogleFormUrl(e.target.value)}
                placeholder="Google Form link (https://docs.google.com/forms/...)"
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
              <input
                type="text"
                value={googleFormTitle}
                onChange={(e) => setGoogleFormTitle(e.target.value)}
                placeholder="Form Button / Embed Title"
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Links & Attachments */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                External Website / Registration Link
              </label>
              <input
                type="url"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="https://myclub.campus.edu/events"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Attachment / Rulebook Name (PDF/Doc)
              </label>
              <input
                type="text"
                value={attachmentName}
                onChange={(e) => setAttachmentName(e.target.value)}
                placeholder="e.g. Hackathon_Rulebook_2026.pdf"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* LINK TO EVENT CALENDAR CHECKBOX (per spec requirement) */}
          <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 space-y-3">
            <label className="flex items-center space-x-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={linkToCalendar}
                onChange={(e) => setLinkToCalendar(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs font-black uppercase tracking-wider text-blue-900 dark:text-blue-300 flex items-center space-x-1.5">
                <Calendar className="w-4 h-4 text-blue-500" />
                <span>Link & Surface on Campus Event Calendar</span>
              </span>
            </label>

            {linkToCalendar && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 animate-in fade-in">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Date</label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Time</label>
                  <input
                    type="text"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    placeholder="e.g. 05:30 PM"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Venue</label>
                  <input
                    type="text"
                    value={eventVenue}
                    onChange={(e) => setEventVenue(e.target.value)}
                    placeholder="e.g. Main Auditorium"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              id="submit-club-announcement-btn"
              type="submit"
              disabled={loading}
              className="px-6 py-2 text-xs font-black uppercase tracking-wider text-purple-950 bg-gradient-to-r from-purple-300 via-indigo-200 to-pink-200 hover:from-purple-400 hover:to-indigo-300 rounded-xl shadow-lg shadow-purple-200/50 active:scale-95 transition-all flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-purple-900" />
                  <span>Publishing...</span>
                </>
              ) : (
                <span>Publish Official Notice</span>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
