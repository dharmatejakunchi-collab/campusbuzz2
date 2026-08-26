import React, { useState } from 'react';
import { 
  UtensilsCrossed, 
  Car, 
  Tag, 
  HelpCircle, 
  Compass, 
  Clock, 
  MapPin, 
  Users, 
  Phone, 
  MessageSquare, 
  Heart, 
  Share2, 
  CheckCircle2, 
  AlertTriangle,
  Lock,
  ArrowRight,
  Sparkles,
  ShoppingBag,
  Check,
  Building
} from 'lucide-react';
import { Post, HashtagType } from '../../types';
import { HASHTAG_CONFIGS } from '../../utils/hashtagConfig';
import { useCountdown } from '../../hooks/usePostExpiry';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove, increment } from 'firebase/firestore';

interface PostCardProps {
  post: Post;
  onOpenRoom: (post: Post) => void;
  onOpenContact: (post: Post) => void;
  onFilterTag?: (tag: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onOpenRoom,
  onOpenContact,
  onFilterTag
}) => {
  const { profile } = useAuth();
  const [copied, setCopied] = useState(false);
  const primaryTag = post.primaryHashtag || 'general';
  const tagConfig = HASHTAG_CONFIGS[primaryTag] || HASHTAG_CONFIGS.general;
  const isCoordinationChat = primaryTag === 'foodsplit' || primaryTag === 'cabsplit' || primaryTag === 'resell';
  const isDirectContact = primaryTag === 'lost' || primaryTag === 'found';

  // Live countdown timer for posts that have expiry (foodsplit and cabsplit)
  const countdown = useCountdown(post.expiresAt);
  const isExpired = post.isExpired || countdown.isExpired;

  const isLiked = profile ? post.likedBy?.includes(profile.uid) : false;

  const handleLikeToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!profile) return;
    try {
      const postRef = doc(db, 'posts', post.id);
      if (isLiked) {
        await updateDoc(postRef, {
          likedBy: arrayRemove(profile.uid),
          likesCount: increment(-1)
        });
      } else {
        await updateDoc(postRef, {
          likedBy: arrayUnion(profile.uid),
          likesCount: increment(1)
        });
      }
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = window.location.href;
    navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCardClick = () => {
    if (isDirectContact) {
      onOpenContact(post);
    } else {
      onOpenRoom(post);
    }
  };

  // Cab seats calculation
  const totalSeats = post.metadata?.cab?.totalSeats || 4;
  const availSeats = post.metadata?.cab?.availableSeats ?? 2;
  const filledSeats = Math.max(0, totalSeats - availSeats);

  // Food split target calculation
  const currentTotal = post.metadata?.food?.currentTotal || 35;
  const minOrder = post.metadata?.food?.minOrder || 50;
  const foodProgress = Math.min(100, Math.round((currentTotal / (minOrder || 1)) * 100));

  return (
    <div
      id={`post-card-${post.id}`}
      onClick={handleCardClick}
      className={`group relative bg-white/95 rounded-3xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer flex flex-col overflow-hidden ${
        isExpired || post.isClosed
          ? 'border-purple-100 opacity-80'
          : 'border-purple-100/90 hover:border-purple-300 shadow-xs'
      }`}
    >
      {/* Image Thumbnail with Overlay Badges */}
      <div className="relative w-full h-48 bg-purple-50 overflow-hidden">
        <img
          src={post.imageUrl || 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&auto=format&fit=crop&q=80'}
          alt={post.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Gradient Shadow Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent pointer-events-none" />

        {/* Primary Intent Badge */}
        <div className="absolute top-3 left-3 flex items-center space-x-1.5 z-10">
          <span className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-black shadow-md backdrop-blur-md border ${tagConfig.colorClass.pill}`}>
            {primaryTag === 'foodsplit' && <UtensilsCrossed className="w-3.5 h-3.5 mr-1" />}
            {primaryTag === 'cabsplit' && <Car className="w-3.5 h-3.5 mr-1" />}
            {primaryTag === 'resell' && <Tag className="w-3.5 h-3.5 mr-1" />}
            {primaryTag === 'lost' && <HelpCircle className="w-3.5 h-3.5 mr-1" />}
            {primaryTag === 'found' && <Compass className="w-3.5 h-3.5 mr-1" />}
            {tagConfig.displayName}
          </span>
          {post.pinned && (
            <span className="bg-amber-300 text-amber-950 font-black text-[10px] uppercase px-2 py-0.5 rounded-lg shadow-xs">
              Pinned
            </span>
          )}
        </div>

        {/* Countdown Timer Badge for Foodsplit & Cabsplit */}
        {tagConfig.requiresTimer && post.expiresAt && (
          <div className="absolute top-3 right-3 z-10">
            {isExpired ? (
              <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-900/85 text-slate-300 border border-slate-700 shadow-md backdrop-blur-md">
                <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                Expired
              </span>
            ) : (
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-black shadow-md backdrop-blur-md transition-all ${
                  countdown.urgency === 'critical'
                    ? 'bg-rose-500 text-white animate-pulse border border-rose-300'
                    : countdown.urgency === 'soon'
                    ? 'bg-amber-400 text-slate-950 border border-amber-300'
                    : 'bg-slate-900/85 text-emerald-300 border border-emerald-400/40'
                }`}
              >
                <Clock className="w-3.5 h-3.5 mr-1 shrink-0" />
                <span>{countdown.formatted} left</span>
              </span>
            )}
          </div>
        )}

        {/* Bottom Banner on Image (Specific intent preview) */}
        <div className="absolute bottom-2.5 left-3 right-3 z-10 flex items-center justify-between text-white text-xs">
          {primaryTag === 'foodsplit' && post.metadata?.food && (
            <div className="flex items-center space-x-1.5 truncate bg-black/65 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/15 max-w-full">
              <ShoppingBag className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span className="font-bold truncate">{post.metadata.food.restaurant}</span>
              {post.metadata.food.minOrder && (
                <span className="text-amber-200 font-semibold shrink-0">• Min ${post.metadata.food.minOrder}</span>
              )}
            </div>
          )}

          {primaryTag === 'cabsplit' && post.metadata?.cab && (
            <div className="flex items-center space-x-1.5 truncate bg-black/65 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/15 max-w-full">
              <MapPin className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
              <span className="font-bold truncate">To: {post.metadata.cab.destination}</span>
              <span className="text-emerald-200 font-semibold shrink-0">• {availSeats} seats left</span>
            </div>
          )}

          {primaryTag === 'resell' && post.metadata?.resell && (
            <div className="flex items-center space-x-2 bg-black/65 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/15">
              <span className="text-emerald-300 font-black text-sm">${post.metadata.resell.price}</span>
              {post.metadata.resell.originalPrice && (
                <span className="line-through text-slate-300 text-[10px]">${post.metadata.resell.originalPrice}</span>
              )}
              <span className="text-[9px] uppercase font-bold bg-purple-500/40 text-purple-200 px-1.5 py-0.5 rounded">
                {post.metadata.resell.condition.replace('_', ' ')}
              </span>
            </div>
          )}

          {isDirectContact && post.metadata?.lostFound && (
            <div className="flex items-center space-x-1.5 truncate bg-black/65 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/15">
              <MapPin className="w-3.5 h-3.5 text-rose-300 shrink-0" />
              <span className="truncate font-semibold text-rose-100">{post.metadata.lostFound.locationFoundOrLost}</span>
            </div>
          )}
        </div>
      </div>

      {/* Card Content Area */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Post Title */}
          <h3 className="font-display font-bold text-slate-800 text-base leading-snug line-clamp-2 group-hover:text-purple-600 transition-colors">
            {post.title}
          </h3>

          {/* Description */}
          <p className="mt-1 text-xs text-slate-600 line-clamp-2 leading-relaxed">
            {post.description}
          </p>

          {/* Special Visual Interactive Widget: Food Order Target Progress */}
          {primaryTag === 'foodsplit' && post.metadata?.food?.minOrder && !isExpired && (
            <div className="mt-2.5 p-2 rounded-xl bg-amber-50 border border-amber-200 text-xs">
              <div className="flex items-center justify-between text-[11px] font-bold text-amber-900 mb-1">
                <span>Pool Progress (${currentTotal}/${minOrder})</span>
                <span>{foodProgress}% Target</span>
              </div>
              <div className="w-full h-1.5 bg-amber-200/80 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full transition-all duration-500"
                  style={{ width: `${foodProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Special Visual Interactive Widget: Cab Split Seat Visualization */}
          {primaryTag === 'cabsplit' && post.metadata?.cab && !isExpired && (
            <div className="mt-2.5 p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-xs flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-900">
                Seat Availability ({availSeats} of {totalSeats} open)
              </span>
              <div className="flex items-center space-x-1">
                {Array.from({ length: totalSeats }).map((_, i) => (
                  <span
                    key={i}
                    className={`w-2.5 h-2.5 rounded-full ${
                      i < filledSeats
                        ? 'bg-slate-300'
                        : 'bg-emerald-500 animate-pulse'
                    }`}
                    title={i < filledSeats ? 'Occupied Seat' : 'Available Seat'}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Mandatory Hashtags List */}
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {post.hashtags?.map((tag, idx) => {
              const cleanTag = tag.replace(/^#/, '');
              return (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onFilterTag) onFilterTag(cleanTag);
                  }}
                  className="text-[10px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 hover:text-purple-900 px-2 py-0.5 rounded-lg border border-purple-100 transition-colors"
                >
                  #{cleanTag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Area: Author Profile & Interaction Button */}
        <div className="pt-3 border-t border-purple-100 flex items-center justify-between">
          {/* Author info */}
          <div className="flex items-center space-x-2 min-w-0">
            <img
              src={post.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
              alt={post.authorName}
              className="w-6 h-6 rounded-lg object-cover shrink-0 border border-purple-200"
            />
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-800 truncate">
                {post.authorName}
              </div>
              <div className="text-[10px] text-slate-500 truncate flex items-center space-x-1">
                <span>{post.authorHostel || post.authorDepartment || 'Campus'}</span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center space-x-1.5">
            {/* Share action */}
            <button
              onClick={handleShare}
              className="p-1.5 rounded-xl border border-purple-100 text-slate-400 hover:text-purple-600 bg-purple-50/50 hover:bg-purple-50 transition-colors"
              title="Copy share link"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
            </button>

            {/* Like Toggle */}
            <button
              onClick={handleLikeToggle}
              className={`p-1.5 rounded-xl border transition-all ${
                isLiked
                  ? 'bg-rose-50 text-rose-500 border-rose-200'
                  : 'bg-purple-50/50 text-slate-400 hover:text-rose-500 border-purple-100'
              }`}
              title="Like post"
            >
              <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-500' : ''}`} />
            </button>

            {/* Main Action Trigger */}
            <button
              id={`post-action-btn-${post.id}`}
              onClick={(e) => {
                e.stopPropagation();
                handleCardClick();
              }}
              disabled={isExpired || post.isClosed}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-xs ${
                isExpired || post.isClosed
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                  : isDirectContact
                  ? 'bg-gradient-to-r from-rose-400 to-pink-400 hover:from-rose-500 hover:to-pink-500 text-white'
                  : primaryTag === 'foodsplit'
                  ? 'bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-white'
                  : primaryTag === 'cabsplit'
                  ? 'bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-500 hover:to-teal-500 text-white'
                  : 'bg-gradient-to-r from-purple-400 to-pink-400 hover:from-purple-500 hover:to-pink-500 text-white'
              }`}
            >
              {isDirectContact ? (
                <>
                  <Phone className="w-3.5 h-3.5" />
                  <span>Contact</span>
                </>
              ) : post.isClosed ? (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Closed</span>
                </>
              ) : (
                <>
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{tagConfig.actionTitle}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
