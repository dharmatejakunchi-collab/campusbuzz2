import React, { useState } from 'react';
import { 
  X, 
  Phone, 
  Mail, 
  MessageSquare, 
  MapPin, 
  HelpCircle, 
  Compass, 
  ShieldCheck, 
  Copy, 
  Check, 
  ExternalLink,
  Award,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { Post } from '../../types';
import { useAuth } from '../../context/AuthContext';
import confetti from 'canvas-confetti';

interface LostFoundContactModalProps {
  post: Post | null;
  isOpen: boolean;
  onClose: () => void;
}

export const LostFoundContactModal: React.FC<LostFoundContactModalProps> = ({
  post,
  isOpen,
  onClose
}) => {
  const { profile } = useAuth();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [claimedNotice, setClaimedNotice] = useState(false);

  if (!isOpen || !post) return null;

  const isLost = post.primaryHashtag === 'lost';
  const contact = post.contactInfo || {
    phone: '+1 (555) 382-9104',
    whatsapp: '+15553829104',
    email: post.authorEmail,
    telegram: '@campus_student',
    roomLocation: post.authorHostel || 'Hostel Block C'
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleClaimAlert = () => {
    setClaimedNotice(true);
    confetti({ particleCount: 50, spread: 60 });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 animate-in fade-in zoom-in-95">
        
        {/* Banner with Item Image */}
        <div className="relative h-48 w-full bg-slate-900">
          <img
            src={post.imageUrl}
            alt={post.title}
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-4 left-4 right-4 text-white">
            <div className="flex items-center space-x-2 mb-1">
              <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black uppercase flex items-center ${
                isLost ? 'bg-rose-600 text-white' : 'bg-cyan-600 text-white'
              }`}>
                {isLost ? <HelpCircle className="w-3.5 h-3.5 mr-1" /> : <Compass className="w-3.5 h-3.5 mr-1" />}
                {isLost ? '#LOST ITEM' : '#FOUND ITEM'}
              </span>
              <span className="text-[11px] text-slate-300">Direct Private Coordination</span>
            </div>
            <h2 className="text-lg font-black leading-tight line-clamp-1">
              {post.title}
            </h2>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          
          {/* Key Item Details */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
            <div className="flex items-center text-slate-700 dark:text-slate-300">
              <MapPin className="w-4 h-4 text-rose-500 mr-2 shrink-0" />
              <span className="font-bold mr-1">Location:</span>
              <span className="truncate">{post.metadata?.lostFound?.locationFoundOrLost || 'Campus area'}</span>
            </div>

            {post.metadata?.lostFound?.dateOccurred && (
              <div className="flex items-center text-slate-700 dark:text-slate-300">
                <Calendar className="w-4 h-4 text-blue-500 mr-2 shrink-0" />
                <span className="font-bold mr-1">Date / Time:</span>
                <span>{post.metadata.lostFound.dateOccurred}</span>
              </div>
            )}

            {post.metadata?.lostFound?.reward && (
              <div className="flex items-center text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-xl border border-amber-200 dark:border-amber-800/40">
                <Award className="w-4 h-4 mr-2 shrink-0 text-amber-500" />
                <span className="font-bold mr-1">Finder Reward:</span>
                <span>{post.metadata.lostFound.reward}</span>
              </div>
            )}
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {post.description}
          </p>

          {/* POSTER DIRECT CONTACT CHANNELS */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center justify-between">
              <span>Direct Poster Contacts</span>
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                Verified Student
              </span>
            </h3>

            {/* Poster Profile Info */}
            <div className="flex items-center space-x-3 p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
              <img
                src={post.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                alt={post.authorName}
                className="w-10 h-10 rounded-full object-cover border"
              />
              <div className="min-w-0 flex-1">
                <div className="font-bold text-sm text-slate-900 dark:text-white">{post.authorName}</div>
                <div className="text-xs text-slate-500 truncate">{post.authorDepartment || 'Student'} • {contact.roomLocation}</div>
              </div>
            </div>

            {/* WhatsApp 1-Click Action */}
            {contact.whatsapp && (
              <a
                href={`https://wa.me/${contact.whatsapp.replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(post.authorName)},%20I%20saw%20your%20post%20on%20Campus%20Buzz:%20"${encodeURIComponent(post.title)}"`}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
              >
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4" />
                  <span>Message on WhatsApp ({contact.whatsapp})</span>
                </div>
                <ExternalLink className="w-4 h-4 opacity-80" />
              </a>
            )}

            {/* Phone & Email Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              {contact.phone && (
                <button
                  onClick={() => copyToClipboard(contact.phone || '', 'phone')}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-xs font-semibold text-slate-800 dark:text-slate-200"
                >
                  <div className="flex items-center space-x-1.5 truncate">
                    <Phone className="w-3.5 h-3.5 text-blue-500" />
                    <span className="truncate">{contact.phone}</span>
                  </div>
                  {copiedField === 'phone' ? <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> : <Copy className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                </button>
              )}

              {contact.email && (
                <button
                  onClick={() => copyToClipboard(contact.email || '', 'email')}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-xs font-semibold text-slate-800 dark:text-slate-200"
                >
                  <div className="flex items-center space-x-1.5 truncate">
                    <Mail className="w-3.5 h-3.5 text-rose-500" />
                    <span className="truncate">{contact.email}</span>
                  </div>
                  {copiedField === 'email' ? <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> : <Copy className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                </button>
              )}
            </div>
          </div>

          {/* Verification & Handover Tips */}
          <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 text-[11px] text-blue-900 dark:text-blue-300 space-y-1">
            <div className="font-bold flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Campus Safety & Verification Tips</span>
            </div>
            <p>
              Coordinate meeting at public campus spaces (e.g. Student Center, Library front desk). For tech devices, verify serial numbers or unlock passcode before handover.
            </p>
          </div>

          {claimedNotice ? (
            <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold text-center border border-emerald-300">
              🎉 Direct notification recorded! Please coordinate in person.
            </div>
          ) : (
            <button
              onClick={handleClaimAlert}
              className="w-full py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-extrabold text-xs rounded-xl shadow hover:opacity-90 active:scale-95 transition-all"
            >
              {isLost ? "I Found This Item (Alert Poster)" : "This is My Item (Claim Ownership)"}
            </button>
          )}

        </div>
      </div>
    </div>
  );
};
