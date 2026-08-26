import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  UtensilsCrossed, 
  Car, 
  Tag, 
  HelpCircle, 
  Compass, 
  Clock, 
  MapPin, 
  DollarSign, 
  Phone, 
  Image as ImageIcon,
  Check,
  AlertCircle,
  Loader2,
  UploadCloud
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Post, HashtagType, PostMetadata, PostContactInfo } from '../../types';
import { HASHTAG_CONFIGS } from '../../utils/hashtagConfig';
import { db } from '../../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ImageGalleryUploader } from '../common/ImageGalleryUploader';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated?: (newPost: Post) => void;
}

const PRESET_IMAGES = [
  { url: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&auto=format&fit=crop&q=80', label: 'Food / Chipotle' },
  { url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80', label: 'Pizza Delivery' },
  { url: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&auto=format&fit=crop&q=80', label: 'Uber / Cab Ride' },
  { url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&auto=format&fit=crop&q=80', label: 'iPad / Tech' },
  { url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80', label: 'Textbooks' },
  { url: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&auto=format&fit=crop&q=80', label: 'AirPods / Lost Tech' },
  { url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&auto=format&fit=crop&q=80', label: 'Tumbler / Bottle' },
  { url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80', label: 'Campus Life' }
];

const TIMER_OPTIONS = [
  { label: '10 Minutes', value: 10 },
  { label: '30 Minutes', value: 30 },
  { label: '1 Hour', value: 60 },
  { label: '2 Hours', value: 120 },
  { label: '4 Hours', value: 240 },
  { label: '12 Hours', value: 720 },
  { label: '24 Hours (Default)', value: 1440 },
  { label: '2 Days (48 Hours)', value: 2880 }
];

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  onPostCreated
}) => {
  const { profile } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uploadedGalleryImage, setUploadedGalleryImage] = useState('');
  const [selectedPresetUrl, setSelectedPresetUrl] = useState(PRESET_IMAGES[0].url);
  const [primaryTag, setPrimaryTag] = useState<HashtagType>('foodsplit');
  const [extraTags, setExtraTags] = useState<string[]>(['campus']);
  const [tagInput, setTagInput] = useState('');
  
  // Mandatory timer for foodsplit & cabsplit (default 24 hours = 1440 min)
  const [durationMinutes, setDurationMinutes] = useState<number>(1440);

  // Intent Specific Metadata states
  // Food
  const [restaurant, setRestaurant] = useState('Chipotle Mexican Grill');
  const [minOrder, setMinOrder] = useState<number>(30);
  const [foodDropLocation, setFoodDropLocation] = useState('Hostel Block C Lobby');
  const [orderDeadline, setOrderDeadline] = useState('11:30 PM');

  // Cab
  const [cabDestination, setCabDestination] = useState('Airport Terminal 2');
  const [cabPickup, setCabPickup] = useState('South Campus Gate');
  const [departureTime, setDepartureTime] = useState('Friday 6:00 AM');
  const [totalSeats, setTotalSeats] = useState<number>(4);
  const [availableSeats, setAvailableSeats] = useState<number>(2);
  const [estFare, setEstFare] = useState<number>(40);

  // Resell
  const [price, setPrice] = useState<number>(50);
  const [originalPrice, setOriginalPrice] = useState<number>(90);
  const [condition, setCondition] = useState<'brand_new' | 'like_new' | 'good' | 'fair'>('like_new');
  const [itemLocation, setItemLocation] = useState('Student Center');
  const [isNegotiable, setIsNegotiable] = useState(true);

  // Lost / Found
  const [itemType, setItemType] = useState('Keys / Card Holder');
  const [locationFoundOrLost, setLocationFoundOrLost] = useState('Central Library 2nd Floor');
  const [dateOccurred, setDateOccurred] = useState('Today afternoon');
  const [reward, setReward] = useState('');
  const [contactPhone, setContactPhone] = useState(profile?.phone || '+1 (555) 382-9104');
  const [contactWhatsapp, setContactWhatsapp] = useState(profile?.whatsapp || '+15553829104');
  const [contactTelegram, setContactTelegram] = useState(profile?.telegram || '@student_campus');
  const [roomLocation, setRoomLocation] = useState(profile?.hostel || 'Hostel Block C, Room 302');

  const [loading, setLoading] = useState(false);
  const [aiEnhancing, setAiEnhancing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const clean = tagInput.replace(/^#/, '').trim().toLowerCase();
      if (clean && !extraTags.includes(clean)) {
        setExtraTags([...extraTags, clean]);
        setTagInput('');
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setExtraTags(extraTags.filter(t => t !== tagToRemove));
  };

  const handleAiEnhance = async () => {
    if (!title && !description) {
      setErrorMessage('Please type at least a short title or draft description for AI assistance.');
      return;
    }
    setAiEnhancing(true);
    setErrorMessage('');
    try {
      const res = await fetch('/api/gemini-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Campus Buzz post draft:\nTitle: ${title}\nDescription: ${description}\nCategory: ${primaryTag}`,
          type: 'hashtags'
        })
      });
      const data = await res.json();
      if (data?.data) {
        if (data.data.suggestedTitle) setTitle(data.data.suggestedTitle);
        if (data.data.summary) setDescription(data.data.summary);
        if (Array.isArray(data.data.hashtags)) {
          const validTags = data.data.hashtags.map((h: string) => h.replace(/^#/, '').toLowerCase());
          setExtraTags(Array.from(new Set([...extraTags, ...validTags])));
        }
      }
    } catch (err) {
      console.error('AI Enhance error:', err);
    } finally {
      setAiEnhancing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('Post title is required.');
      return;
    }
    if (!description.trim()) {
      setErrorMessage('Post description is required.');
      return;
    }
    if (!profile) {
      setErrorMessage('You must be signed in as a verified student to post.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      // Prioritize uploaded gallery image over preset
      const finalImage = uploadedGalleryImage.trim() || selectedPresetUrl;
      const allHashtags = Array.from(new Set([primaryTag, ...extraTags]));

      // Post Expiry Calculation: Mandatory for foodsplit & cabsplit
      const tagConfig = HASHTAG_CONFIGS[primaryTag];
      let expiresAt: number | undefined = undefined;
      if (tagConfig.requiresTimer) {
        expiresAt = Date.now() + durationMinutes * 60 * 1000;
      }

      // Metadata building
      const metadata: PostMetadata = {};
      let contactInfo: PostContactInfo | undefined = undefined;

      if (primaryTag === 'foodsplit') {
        metadata.food = {
          restaurant,
          minOrder: minOrder || 0,
          currentTotal: 0,
          deliveryFee: 0,
          dropLocation: foodDropLocation,
          orderDeadline
        };
      } else if (primaryTag === 'cabsplit') {
        metadata.cab = {
          pickup: cabPickup,
          destination: cabDestination,
          departureTime,
          totalSeats: Number(totalSeats),
          availableSeats: Number(availableSeats),
          estimatedFare: Number(estFare)
        };
      } else if (primaryTag === 'resell') {
        metadata.resell = {
          price: Number(price),
          originalPrice: originalPrice ? Number(originalPrice) : undefined,
          condition,
          category: 'Campus Gear',
          negotiable: isNegotiable,
          itemLocation
        };
      } else if (primaryTag === 'lost' || primaryTag === 'found') {
        metadata.lostFound = {
          itemType,
          locationFoundOrLost,
          dateOccurred,
          reward: reward || undefined,
          status: 'unclaimed'
        };
        contactInfo = {
          phone: contactPhone,
          whatsapp: contactWhatsapp,
          telegram: contactTelegram,
          email: profile.email,
          roomLocation,
          preferredContactMethod: 'whatsapp'
        };
      }

      const newPostData = {
        title: title.trim(),
        description: description.trim(),
        imageUrl: finalImage,
        hashtags: allHashtags,
        primaryHashtag: primaryTag,
        authorId: profile.uid,
        authorName: profile.displayName,
        authorEmail: profile.email,
        authorAvatar: profile.photoURL,
        authorRole: profile.role,
        authorDepartment: profile.department || 'Student',
        authorHostel: profile.hostel || 'Hostel Campus',
        expiresAt: expiresAt || null,
        durationMinutes: tagConfig.requiresTimer ? durationMinutes : null,
        isClosed: false,
        isExpired: false,
        metadata,
        contactInfo: contactInfo || null,
        createdAt: Date.now(),
        likesCount: 0,
        likedBy: [],
        viewsCount: 1
      };

      const docRef = await addDoc(collection(db, 'posts'), newPostData);
      
      if (onPostCreated) {
        onPostCreated({ id: docRef.id, ...newPostData } as Post);
      }

      onClose();
    } catch (err: any) {
      console.error('Error creating post:', err);
      setErrorMessage(err.message || 'Failed to create post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
              <span>Create Campus Coordination Post</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Posts are the primary coordination primitive. Upload from your gallery and select an intent.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {/* STEP 1: Mandatory Intent / Hashtag Selection */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              1. Choose Intent Hashtag <span className="text-rose-500">* (Mandatory)</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(['foodsplit', 'cabsplit', 'resell', 'lost', 'found'] as HashtagType[]).map((tagKey) => {
                const conf = HASHTAG_CONFIGS[tagKey];
                const isSelected = primaryTag === tagKey;
                return (
                  <button
                    key={tagKey}
                    type="button"
                    onClick={() => {
                      setPrimaryTag(tagKey);
                      if (tagKey === 'foodsplit') setSelectedPresetUrl(PRESET_IMAGES[0].url);
                      if (tagKey === 'cabsplit') setSelectedPresetUrl(PRESET_IMAGES[2].url);
                      if (tagKey === 'resell') setSelectedPresetUrl(PRESET_IMAGES[3].url);
                      if (tagKey === 'lost') setSelectedPresetUrl(PRESET_IMAGES[5].url);
                      if (tagKey === 'found') setSelectedPresetUrl(PRESET_IMAGES[6].url);
                    }}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                      isSelected
                        ? `${conf.colorClass.border} ${conf.colorClass.bg} ring-2 ring-purple-400 dark:ring-purple-500 shadow-md`
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {conf.displayName}
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-purple-600 dark:text-purple-400 font-bold" />}
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-tight">
                      {conf.badgeLabel}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 italic">
              {primaryTag === 'lost' || primaryTag === 'found'
                ? 'ℹ️ On tap: Shows your private contact info directly (no group chat).'
                : 'ℹ️ On tap: Opens a live coordination group chat room unique to this post.'}
            </p>
          </div>

          {/* STEP 2: Post Expiry Timer (MANDATORY for #foodsplit and #cabsplit) */}
          {HASHTAG_CONFIGS[primaryTag].requiresTimer && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center space-x-1.5">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span>Mandatory Expiry Timer</span>
                  <span className="text-rose-500 font-bold">*</span>
                </label>
                <span className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                  Auto-deletes when time expires
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {TIMER_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setDurationMinutes(opt.value)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      durationMinutes === opt.value
                        ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-amber-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Basic Content */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                2. Title & Details <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleAiEnhance}
                disabled={aiEnhancing}
                className="inline-flex items-center space-x-1 text-xs font-bold text-purple-700 dark:text-purple-300 hover:text-purple-800 bg-purple-50 dark:bg-purple-950/40 px-2.5 py-1 rounded-lg border border-purple-200 dark:border-purple-800 active:scale-95 transition-all"
              >
                {aiEnhancing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>AI Enhance / Auto-Tags</span>
              </button>
            </div>

            <div>
              <input
                id="post-input-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  primaryTag === 'foodsplit'
                    ? "e.g., Chipotle Group Delivery to Hall 4 — need 2 more for free delivery!"
                    : primaryTag === 'cabsplit'
                    ? "e.g., Airport Uber XL split Friday 6 AM (2 seats open)"
                    : primaryTag === 'resell'
                    ? "e.g., iPad Air 5 (M1) 64GB with Apple Pencil 2"
                    : primaryTag === 'lost'
                    ? "e.g., LOST: Matte Black AirPods Pro 2 case at Science Library"
                    : "e.g., FOUND: Blue Stanley Tumbler on Basketball bleachers"
                }
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-purple-400"
                required
              />
            </div>

            <div>
              <textarea
                id="post-input-desc"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe details, timing, conditions, pickup/drop points, or instructions for campus peers..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                required
              />
            </div>

            {/* Extra Hashtags */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                Additional Hashtags (Press Enter to add):
              </label>
              <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
                <span className="text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/60 px-2 py-0.5 rounded-md">
                  #{primaryTag}
                </span>
                {extraTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-md"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 text-slate-400 hover:text-rose-500"
                    >
                      ×
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder="+ add hashtag"
                  className="text-xs bg-transparent border-none focus:outline-none text-slate-800 dark:text-slate-200 min-w-[100px]"
                />
              </div>
            </div>
          </div>

          {/* STEP 4: Intent Specific Custom Fields */}
          {primaryTag === 'foodsplit' && (
            <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 space-y-3">
              <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase">
                Food Split Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Restaurant Name</label>
                  <input
                    type="text"
                    value={restaurant}
                    onChange={(e) => setRestaurant(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Min Order Target ($)</label>
                  <input
                    type="number"
                    value={minOrder}
                    onChange={(e) => setMinOrder(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Delivery Drop Location</label>
                  <input
                    type="text"
                    value={foodDropLocation}
                    onChange={(e) => setFoodDropLocation(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Order Cutoff Time</label>
                  <input
                    type="text"
                    value={orderDeadline}
                    onChange={(e) => setOrderDeadline(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {primaryTag === 'cabsplit' && (
            <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 space-y-3">
              <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-300 uppercase">
                Cab & Ride Split Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Pickup Location</label>
                  <input
                    type="text"
                    value={cabPickup}
                    onChange={(e) => setCabPickup(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Destination</label>
                  <input
                    type="text"
                    value={cabDestination}
                    onChange={(e) => setCabDestination(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Departure Time</label>
                  <input
                    type="text"
                    value={departureTime}
                    onChange={(e) => setDepartureTime(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Available Passenger Seats</label>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    value={availableSeats}
                    onChange={(e) => setAvailableSeats(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Estimated Total Fare ($)</label>
                  <input
                    type="number"
                    value={estFare}
                    onChange={(e) => setEstFare(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {primaryTag === 'resell' && (
            <div className="p-4 rounded-2xl bg-violet-50/50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800/40 space-y-3">
              <h4 className="text-xs font-bold text-violet-900 dark:text-violet-300 uppercase">
                Item Resale Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Selling Price ($)</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Original / Retail Price ($)</label>
                  <input
                    type="number"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Item Condition</label>
                  <select
                    value={condition}
                    onChange={(e: any) => setCondition(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="brand_new">Brand New (Unopened)</option>
                    <option value="like_new">Like New (Mint)</option>
                    <option value="good">Good (Minor signs of use)</option>
                    <option value="fair">Fair (Fully functional)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Handover Spot</label>
                  <input
                    type="text"
                    value={itemLocation}
                    onChange={(e) => setItemLocation(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {(primaryTag === 'lost' || primaryTag === 'found') && (
            <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/40 space-y-3">
              <h4 className="text-xs font-bold text-rose-900 dark:text-rose-300 uppercase">
                {primaryTag === 'lost' ? 'Lost Item' : 'Found Item'} & Private Contact Sheet
              </h4>
              <p className="text-[11px] text-slate-500">
                This info will be shown directly on tap to facilitate 1-on-1 private handover.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Item Location (Found/Lost)</label>
                  <input
                    type="text"
                    value={locationFoundOrLost}
                    onChange={(e) => setLocationFoundOrLost(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">WhatsApp / Phone Number</label>
                  <input
                    type="text"
                    value={contactWhatsapp}
                    onChange={(e) => setContactWhatsapp(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Room / Hostel Location</label>
                  <input
                    type="text"
                    value={roomLocation}
                    onChange={(e) => setRoomLocation(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                {primaryTag === 'lost' && (
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Optional Reward</label>
                    <input
                      type="text"
                      value={reward}
                      onChange={(e) => setReward(e.target.value)}
                      placeholder="e.g., $15 treat / Coffee"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 5: Gallery Image Upload (Direct from Device) */}
          <div className="space-y-3">
            <ImageGalleryUploader
              value={uploadedGalleryImage}
              onChange={(imgData) => setUploadedGalleryImage(imgData)}
              label="3. Upload Post Photo from Gallery"
              aspectRatioLabel="Upload directly from your photo library or camera (PNG, JPG, WebP)"
              required={false}
              idPrefix="post-gallery"
            />

            {/* Alternative preset stickers if user has no photo ready */}
            {!uploadedGalleryImage && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                  Or pick a preset theme cover if you don't have a photo:
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {PRESET_IMAGES.map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedPresetUrl(img.url)}
                      className={`relative h-14 rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                        selectedPresetUrl === img.url
                          ? 'border-purple-500 scale-95 shadow-md'
                          : 'border-transparent hover:opacity-80'
                      }`}
                    >
                      <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                      <span className="absolute inset-x-0 bottom-0 bg-black/60 text-[9px] text-white text-center py-0.5 truncate px-1 font-semibold">
                        {img.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              id="submit-create-post-btn"
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
                <span>Publish Coordination Post</span>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
