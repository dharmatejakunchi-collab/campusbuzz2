import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Flame, 
  UtensilsCrossed, 
  Car, 
  Tag, 
  HelpCircle, 
  Compass, 
  Clock, 
  Sparkles, 
  AlertCircle,
  TrendingUp,
  RefreshCw,
  PlusCircle,
  Building,
  Zap,
  CheckCircle2,
  Share2
} from 'lucide-react';
import { Post, HashtagType } from '../../types';
import { HASHTAG_CONFIGS } from '../../utils/hashtagConfig';
import { PostCard } from './PostCard';
import { db } from '../../lib/firebase';
import { collection, onSnapshot, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

interface CampusFeedProps {
  onOpenRoom: (post: Post) => void;
  onOpenContact: (post: Post) => void;
  onOpenCreatePost: () => void;
}

export const CampusFeed: React.FC<CampusFeedProps> = ({
  onOpenRoom,
  onOpenContact,
  onOpenCreatePost
}) => {
  const { profile } = useAuth();
  const { currentTheme } = useTheme();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedHostel, setSelectedHostel] = useState<string>('all');
  const [filterUrgency, setFilterUrgency] = useState<'all' | 'expiring_soon' | 'active_only'>('all');
  const [sortBy, setSortBy] = useState<'expiring_soon' | 'newest' | 'popular'>('expiring_soon');

  // Real-time Firestore subscriber
  useEffect(() => {
    setLoading(true);
    const postsRef = collection(db, 'posts');
    const q = query(postsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: Post[] = [];
        const now = Date.now();
        snapshot.forEach((postDoc) => {
          const data = postDoc.data() as Post;
          // If post has already expired, automatically delete from database
          if (data.expiresAt && data.expiresAt <= now) {
            deleteDoc(doc(db, 'posts', postDoc.id)).catch(() => {});
            deleteDoc(doc(db, 'rooms', postDoc.id)).catch(() => {});
            return;
          }
          list.push({ id: postDoc.id, ...data });
        });
        setPosts(list);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching posts:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Filter and Sort logic
  const filteredPosts = posts
    .filter((post) => {
      // Auto-exclude expired posts
      if (post.expiresAt && post.expiresAt <= Date.now()) {
        deleteDoc(doc(db, 'posts', post.id)).catch(() => {});
        deleteDoc(doc(db, 'rooms', post.id)).catch(() => {});
        return false;
      }
      // Hashtag filter
      if (selectedTag !== 'all') {
        const cleanSelected = selectedTag.toLowerCase().replace(/^#/, '');
        const hasTag = post.hashtags?.some(
          (h) => h.toLowerCase().replace(/^#/, '') === cleanSelected
        ) || post.primaryHashtag === cleanSelected;
        if (!hasTag) return false;
      }

      // Hostel filter
      if (selectedHostel !== 'all') {
        const hLow = selectedHostel.toLowerCase();
        const matchesAuthorHostel = post.authorHostel?.toLowerCase().includes(hLow);
        const matchesDesc = post.description?.toLowerCase().includes(hLow);
        const matchesLoc = post.location?.toLowerCase().includes(hLow);
        if (!matchesAuthorHostel && !matchesDesc && !matchesLoc) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = post.title.toLowerCase().includes(q);
        const matchesDesc = post.description.toLowerCase().includes(q);
        const matchesTags = post.hashtags?.some((h) => h.toLowerCase().includes(q));
        const matchesAuthor = post.authorName?.toLowerCase().includes(q);
        const matchesLocation = post.location?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesTags && !matchesAuthor && !matchesLocation) {
          return false;
        }
      }

      // Urgency filter
      if (filterUrgency === 'expiring_soon') {
        if (!post.expiresAt || post.isExpired) return false;
        const diff = post.expiresAt - Date.now();
        if (diff <= 0 || diff > 45 * 60 * 1000) return false; // < 45m
      } else if (filterUrgency === 'active_only') {
        if (post.isExpired || post.isClosed) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;

      if (sortBy === 'expiring_soon') {
        // Active posts with timers come first
        const aExpires = a.expiresAt && !a.isExpired ? a.expiresAt : Infinity;
        const bExpires = b.expiresAt && !b.isExpired ? b.expiresAt : Infinity;
        return aExpires - bExpires;
      } else if (sortBy === 'popular') {
        return (b.likesCount || 0) - (a.likesCount || 0);
      } else {
        // newest
        return (b.createdAt || 0) - (a.createdAt || 0);
      }
    });

  // Calculate live statistics
  const activeSplits = posts.filter(
    (p) => (p.primaryHashtag === 'foodsplit' || p.primaryHashtag === 'cabsplit') && !p.isClosed && !p.isExpired
  );
  const activeSplitsCount = activeSplits.length;

  const urgentSplits = activeSplits.filter((p) => {
    if (!p.expiresAt) return false;
    const diff = p.expiresAt - Date.now();
    return diff > 0 && diff <= 30 * 60 * 1000;
  });

  const activeResellsCount = posts.filter(
    (p) => p.primaryHashtag === 'resell' && !p.isClosed
  ).length;

  const openLostFoundCount = posts.filter(
    (p) => (p.primaryHashtag === 'lost' || p.primaryHashtag === 'found') && !p.isClosed
  ).length;

  const hostelsList = ['all', 'Block A', 'Block B', 'Block C', 'Block D', 'Main Quad', 'North Campus'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Welcome / Campus Coordination Banner */}
      <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${currentTheme.bannerGradient} p-6 sm:p-8 ${currentTheme.bannerText} border transition-all duration-300`}>
        <div className="relative z-10 max-w-3xl space-y-3.5">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-white/70 border border-purple-200/80 text-purple-800 text-xs font-black tracking-wider uppercase backdrop-blur-md shadow-xs">
            <Flame className="w-3.5 h-3.5 text-purple-600 animate-bounce" />
            <span>Campus Coordination Feed</span>
          </div>

          <h1 className={`font-display text-2xl sm:text-4xl font-extrabold tracking-tight ${currentTheme.bannerText} leading-tight`}>
            Coordinate Food, Rides & Deals with verified campus peers.
          </h1>

          <p className={`text-sm sm:text-base ${currentTheme.bannerSubtext} leading-relaxed font-medium`}>
            Every post is driven by an intent hashtag: join live order rooms with <span className="text-amber-800 font-bold bg-amber-100/80 px-1.5 py-0.5 rounded">#foodsplit</span>, ride shares with <span className="text-emerald-800 font-bold bg-emerald-100/80 px-1.5 py-0.5 rounded">#cabsplit</span>, deals on <span className="text-purple-800 font-bold bg-purple-100/80 px-1.5 py-0.5 rounded">#resell</span>, or direct claims with <span className="text-rose-800 font-bold bg-rose-100/80 px-1.5 py-0.5 rounded">#lost</span> & <span className="text-sky-800 font-bold bg-sky-100/80 px-1.5 py-0.5 rounded">#found</span>.
          </p>

          {/* Quick Metrics ticker */}
          <div className="pt-2 flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs font-bold">
            <div className="bg-white/80 backdrop-blur-md px-3.5 py-1.5 rounded-xl flex items-center space-x-2 border border-amber-200 text-amber-900 shadow-xs">
              <UtensilsCrossed className="w-4 h-4 text-amber-600" />
              <span>{activeSplitsCount} Active Splits</span>
            </div>
            <div className="bg-white/80 backdrop-blur-md px-3.5 py-1.5 rounded-xl flex items-center space-x-2 border border-purple-200 text-purple-900 shadow-xs">
              <Tag className="w-4 h-4 text-purple-600" />
              <span>{activeResellsCount} Resale Items</span>
            </div>
            <div className="bg-white/80 backdrop-blur-md px-3.5 py-1.5 rounded-xl flex items-center space-x-2 border border-rose-200 text-rose-900 shadow-xs">
              <HelpCircle className="w-4 h-4 text-rose-600" />
              <span>{openLostFoundCount} Lost & Found</span>
            </div>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-purple-200/30 via-pink-200/20 to-transparent pointer-events-none" />
      </div>

      {/* Urgent Countdown Alert Strip (if any posts expiring within 30m) */}
      {urgentSplits.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs animate-in fade-in shadow-xs">
          <div className="flex items-center space-x-2.5 font-bold text-rose-800">
            <span className="p-1.5 rounded-lg bg-rose-400 text-white animate-pulse">
              <Zap className="w-4 h-4" />
            </span>
            <div>
              <span className="font-extrabold">{urgentSplits.length} orders/rides expiring in under 30 mins!</span>
              <span className="block text-[11px] font-normal text-slate-600">
                Join live coordination rooms before hosts place their final checkout or depart.
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              setFilterUrgency('expiring_soon');
              setSelectedTag('all');
            }}
            className="px-3.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl shadow-xs shrink-0 self-end sm:self-center transition-all"
          >
            View Urgent ({urgentSplits.length})
          </button>
        </div>
      )}

      {/* Hashtag Filters & Search Control Bar */}
      <div className="space-y-3">
        {/* Primary Hashtag Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            id="filter-tag-all"
            onClick={() => setSelectedTag('all')}
            className={`px-4 py-2 rounded-xl text-xs font-black shrink-0 transition-all duration-200 ${
              selectedTag === 'all'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-200 scale-102'
                : 'bg-white text-slate-700 border border-purple-100/90 hover:bg-purple-50/50 shadow-xs'
            }`}
          >
            🔥 All Buzz ({posts.length})
          </button>

          {(['foodsplit', 'cabsplit', 'resell', 'lost', 'found'] as HashtagType[]).map((tagKey) => {
            const conf = HASHTAG_CONFIGS[tagKey];
            const isSelected = selectedTag === tagKey;
            const count = posts.filter(p => p.primaryHashtag === tagKey || p.hashtags?.includes(tagKey)).length;

            return (
              <button
                key={tagKey}
                id={`filter-tag-${tagKey}`}
                onClick={() => setSelectedTag(tagKey)}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold shrink-0 flex items-center space-x-1.5 transition-all duration-200 ${
                  isSelected
                    ? `${conf.colorClass.accent} text-white shadow-md scale-102`
                    : `bg-white text-slate-700 border border-purple-100/90 hover:border-purple-300 shadow-xs`
                }`}
              >
                {tagKey === 'foodsplit' && <UtensilsCrossed className="w-3.5 h-3.5" />}
                {tagKey === 'cabsplit' && <Car className="w-3.5 h-3.5" />}
                {tagKey === 'resell' && <Tag className="w-3.5 h-3.5" />}
                {tagKey === 'lost' && <HelpCircle className="w-3.5 h-3.5" />}
                {tagKey === 'found' && <Compass className="w-3.5 h-3.5" />}
                <span>{conf.displayName}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${isSelected ? 'bg-white/30 text-white' : 'bg-purple-50 text-purple-700'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search, Hostel Filter & Sorter Controls Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white/95 p-3 rounded-2xl border border-purple-100 shadow-xs">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="feed-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search posts, restaurants, airports, textbooks, room numbers..."
              className="w-full pl-10 pr-12 py-2 text-xs rounded-xl bg-purple-50/40 border border-purple-100 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-300 font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-purple-400 hover:text-purple-600"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filters & Sorter Controls */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Hostel Selector */}
            <div className="flex items-center space-x-1.5">
              <Building className="w-3.5 h-3.5 text-purple-400 hidden sm:inline" />
              <select
                value={selectedHostel}
                onChange={(e) => setSelectedHostel(e.target.value)}
                className="px-3 py-2 text-xs font-semibold rounded-xl bg-purple-50/40 border border-purple-100 text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-300"
              >
                <option value="all">📍 All Locations</option>
                <option value="Block A">Block A</option>
                <option value="Block B">Block B</option>
                <option value="Block C">Block C</option>
                <option value="Block D">Block D</option>
                <option value="Main Quad">Main Quad</option>
                <option value="North Campus">North Campus</option>
              </select>
            </div>

            {/* Urgency / Active status */}
            <select
              value={filterUrgency}
              onChange={(e: any) => setFilterUrgency(e.target.value)}
              className="px-3 py-2 text-xs font-semibold rounded-xl bg-purple-50/40 border border-purple-100 text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-300"
            >
              <option value="all">⏱️ All Statuses</option>
              <option value="active_only">Active Only</option>
              <option value="expiring_soon">Expiring Soon (&lt;45m)</option>
            </select>

            {/* Sort order */}
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="px-3 py-2 text-xs font-semibold rounded-xl bg-purple-50/40 border border-purple-100 text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-300"
            >
              <option value="expiring_soon">⏳ Expiry Timer</option>
              <option value="newest">✨ Latest Posts</option>
              <option value="popular">❤️ Most Upvoted</option>
            </select>

            <button
              onClick={onOpenCreatePost}
              className={`sm:hidden px-3.5 py-2 ${currentTheme.buttonGradient} text-white rounded-xl text-xs font-bold flex items-center space-x-1 shadow-xs`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Post</span>
            </button>
          </div>
        </div>
      </div>

      {/* Posts Grid Area */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-84 rounded-3xl bg-slate-200 dark:bg-slate-800/60 animate-pulse border border-slate-200 dark:border-slate-800" />
          ))}
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="text-center py-20 px-4 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 mx-auto flex items-center justify-center">
            <Flame className="w-8 h-8" />
          </div>
          <h3 className="font-display text-lg font-extrabold text-slate-900 dark:text-white">
            No posts found for this filter
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {searchQuery || selectedTag !== 'all' || selectedHostel !== 'all'
              ? 'Try resetting the hashtag, search keywords, or hostel location filters.'
              : 'Be the first student to create a campus coordination post!'}
          </p>
          <div className="pt-2 flex items-center justify-center space-x-3">
            {(searchQuery || selectedTag !== 'all' || selectedHostel !== 'all') && (
              <button
                onClick={() => {
                  setSelectedTag('all');
                  setSearchQuery('');
                  setSelectedHostel('all');
                  setFilterUrgency('all');
                }}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-200 transition-colors"
              >
                Reset All Filters
              </button>
            )}
            <button
              onClick={onOpenCreatePost}
              className="px-5 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-black rounded-xl shadow-md shadow-orange-500/20 hover:scale-105 transition-all"
            >
              + Create Post
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onOpenRoom={onOpenRoom}
              onOpenContact={onOpenContact}
              onFilterTag={(tag) => setSelectedTag(tag)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
