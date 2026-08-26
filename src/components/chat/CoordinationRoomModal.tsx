import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Send, 
  UtensilsCrossed, 
  Car, 
  Tag, 
  Clock, 
  Users, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Lock, 
  DollarSign, 
  AlertCircle,
  MapPin,
  Sparkles,
  ShoppingBag,
  Calculator,
  UserCheck
} from 'lucide-react';
import { Post, ChatMessage, CoordinationRoom, FoodOrderItem, CabSeatReservation, ResellOffer } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import confetti from 'canvas-confetti';
import { useCountdown } from '../../hooks/usePostExpiry';

interface CoordinationRoomModalProps {
  post: Post | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CoordinationRoomModal: React.FC<CoordinationRoomModalProps> = ({
  post,
  isOpen,
  onClose
}) => {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [roomData, setRoomData] = useState<CoordinationRoom | null>(null);
  const [inputText, setInputText] = useState('');
  
  // Food split interactive input
  const [foodItemName, setFoodItemName] = useState('');
  const [foodItemPrice, setFoodItemPrice] = useState<string>('9.50');
  const [showAddFoodItem, setShowAddFoodItem] = useState(false);

  // Cab split interactive seat reservation
  const [pickupSpotInput, setPickupSpotInput] = useState('');

  // Resell offer input
  const [offerInput, setOfferInput] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const countdown = useCountdown(post?.expiresAt);

  // Initialize or listen to Room Document
  useEffect(() => {
    if (!post || !isOpen) return;

    const roomRef = doc(db, 'rooms', post.id);

    const unsubRoom = onSnapshot(
      roomRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setRoomData(snapshot.data() as CoordinationRoom);
        } else {
          // Initialize room if not exists yet
          const newRoom: CoordinationRoom = {
            id: post.id,
            postId: post.id,
            title: post.title,
            type: (post.primaryHashtag as any) || 'foodsplit',
            authorId: post.authorId,
            authorName: post.authorName,
            authorAvatar: post.authorAvatar,
            isClosed: false,
            members: {
              [post.authorId]: {
                name: post.authorName,
                avatar: post.authorAvatar,
                joinedAt: Date.now(),
                role: 'Host'
              }
            },
            memberCount: 1,
            foodItems: post.primaryHashtag === 'foodsplit' ? [
              {
                id: 'init_item_1',
                userId: post.authorId,
                userName: post.authorName,
                name: 'Burrito Bowl with Guacamole',
                price: 13.50,
                qty: 1
              }
            ] : [],
            cabSeats: post.primaryHashtag === 'cabsplit' ? [
              {
                seatNumber: 1,
                userId: post.authorId,
                userName: post.authorName,
                pickupPoint: post.metadata?.cab?.pickup || 'Host Gate',
                luggage: '1 suitcase'
              }
            ] : [],
            offers: [],
            createdAt: Date.now()
          };
          setDoc(roomRef, newRoom).catch(console.error);
          setRoomData(newRoom);
        }
      },
      (err) => {
        console.warn('Notice listening to room:', err.message);
      }
    );

    // Auto-join current user to members list if not already
    if (profile) {
      updateDoc(roomRef, {
        [`members.${profile.uid}`]: {
          name: profile.displayName,
          avatar: profile.photoURL,
          joinedAt: Date.now(),
          role: profile.uid === post.authorId ? 'Host' : 'Participant'
        }
      }).catch(() => {});
    }

    // Subscribe to messages subcollection
    const messagesQuery = query(
      collection(db, 'rooms', post.id, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubMessages = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const msgs: ChatMessage[] = [];
        snapshot.forEach((d) => {
          msgs.push({ id: d.id, ...d.data() } as ChatMessage);
        });
        setMessages(msgs);
      },
      (err) => {
        console.warn('Notice listening to messages:', err.message);
      }
    );

    return () => {
      unsubRoom();
      unsubMessages();
    };
  }, [post?.id, isOpen, profile?.uid]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen || !post) return null;

  const isAuthor = profile?.uid === post.authorId;
  const isClosed = roomData?.isClosed || post.isClosed || post.isExpired;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !profile) return;

    try {
      const msgData: Partial<ChatMessage> = {
        roomId: post.id,
        senderId: profile.uid,
        senderName: profile.displayName,
        senderAvatar: profile.photoURL,
        senderRole: isAuthor ? 'Host' : 'Student',
        text: inputText.trim(),
        createdAt: Date.now()
      };

      await addDoc(collection(db, 'rooms', post.id, 'messages'), msgData);
      setInputText('');
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  // Food Item handlers
  const handleAddFoodItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodItemName.trim() || !profile) return;
    const priceNum = parseFloat(foodItemPrice) || 0;

    const newItem: FoodOrderItem = {
      id: `item_${Date.now()}`,
      userId: profile.uid,
      userName: profile.displayName,
      userAvatar: profile.photoURL,
      name: foodItemName.trim(),
      price: priceNum,
      qty: 1
    };

    const currentItems = roomData?.foodItems || [];
    const updated = [...currentItems, newItem];

    try {
      await updateDoc(doc(db, 'rooms', post.id), {
        foodItems: updated
      });

      // Also post a system message to chat
      await addDoc(collection(db, 'rooms', post.id, 'messages'), {
        roomId: post.id,
        senderId: profile.uid,
        senderName: profile.displayName,
        senderAvatar: profile.photoURL,
        text: `🛒 Added to group order: "${foodItemName}" ($${priceNum.toFixed(2)})`,
        isSystem: true,
        createdAt: Date.now()
      });

      setFoodItemName('');
      setShowAddFoodItem(false);
    } catch (err) {
      console.error('Error adding food item:', err);
    }
  };

  const handleRemoveFoodItem = async (itemId: string) => {
    if (!roomData?.foodItems) return;
    const updated = roomData.foodItems.filter(i => i.id !== itemId);
    try {
      await updateDoc(doc(db, 'rooms', post.id), {
        foodItems: updated
      });
    } catch (err) {
      console.error('Error removing food item:', err);
    }
  };

  // Cab Seat Claim Handler
  const handleClaimSeat = async (seatNumber: number) => {
    if (!profile) return;
    const currentSeats = roomData?.cabSeats || [];
    const existingIndex = currentSeats.findIndex(s => s.seatNumber === seatNumber);

    let updated = [...currentSeats];
    if (existingIndex >= 0) {
      // If already claimed by user, unclaim
      if (currentSeats[existingIndex].userId === profile.uid) {
        updated.splice(existingIndex, 1);
      } else {
        return; // occupied by someone else
      }
    } else {
      updated.push({
        seatNumber,
        userId: profile.uid,
        userName: profile.displayName,
        userAvatar: profile.photoURL,
        pickupPoint: pickupSpotInput.trim() || 'Campus Gate',
        luggage: '1 backpack / bag'
      });

      // System notification
      await addDoc(collection(db, 'rooms', post.id, 'messages'), {
        roomId: post.id,
        senderId: profile.uid,
        senderName: profile.displayName,
        senderAvatar: profile.photoURL,
        text: `🚗 Claimed Seat #${seatNumber} (Pickup: ${pickupSpotInput || 'Campus Gate'})`,
        isSystem: true,
        createdAt: Date.now()
      });
    }

    try {
      await updateDoc(doc(db, 'rooms', post.id), {
        cabSeats: updated
      });
    } catch (err) {
      console.error('Error claiming seat:', err);
    }
  };

  // Resell Offer Handler
  const handleSendOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(offerInput);
    if (!amount || !profile) return;

    const newOffer: ResellOffer = {
      id: `offer_${Date.now()}`,
      userId: profile.uid,
      userName: profile.displayName,
      userAvatar: profile.photoURL,
      offerAmount: amount,
      status: 'pending',
      timestamp: Date.now()
    };

    const currentOffers = roomData?.offers || [];
    try {
      await updateDoc(doc(db, 'rooms', post.id), {
        offers: [...currentOffers, newOffer]
      });

      await addDoc(collection(db, 'rooms', post.id, 'messages'), {
        roomId: post.id,
        senderId: profile.uid,
        senderName: profile.displayName,
        senderAvatar: profile.photoURL,
        text: `🏷️ Made an offer: $${amount.toFixed(2)}`,
        isSystem: true,
        createdAt: Date.now()
      });

      setOfferInput('');
    } catch (err) {
      console.error('Error submitting offer:', err);
    }
  };

  // Close Room Handler
  const handleCloseRoom = async (reason: string) => {
    if (!isAuthor) return;
    try {
      await updateDoc(doc(db, 'rooms', post.id), {
        isClosed: true,
        closedAt: Date.now(),
        closedReason: reason
      });

      await updateDoc(doc(db, 'posts', post.id), {
        isClosed: true,
        closedReason: reason
      });

      await addDoc(collection(db, 'rooms', post.id, 'messages'), {
        roomId: post.id,
        senderId: profile?.uid || 'system',
        senderName: profile?.displayName || 'Host',
        senderAvatar: profile?.photoURL || '',
        text: `🔒 Coordination Complete: Room marked closed by Host (${reason})`,
        isSystem: true,
        createdAt: Date.now()
      });

      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    } catch (err) {
      console.error('Error closing room:', err);
    }
  };

  // Calculate food totals & split
  const foodItems = roomData?.foodItems || [];
  const foodTotal = foodItems.reduce((acc, i) => acc + (i.price * (i.qty || 1)), 0);
  const minOrderTarget = post.metadata?.food?.minOrder || 30;
  const foodProgressPercent = Math.min(100, Math.round((foodTotal / minOrderTarget) * 100));
  const uniqueParticipants = Array.from(new Set(foodItems.map(i => i.userId))).length || 1;
  const perPersonEst = (foodTotal / uniqueParticipants).toFixed(2);

  // Cab calculations
  const totalSeats = post.metadata?.cab?.totalSeats || 4;
  const claimedSeats = roomData?.cabSeats || [];
  const estFare = post.metadata?.cab?.estimatedFare || 40;
  const farePerPerson = (estFare / (claimedSeats.length || 1)).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-md overflow-hidden">
      <div className="relative w-full max-w-4xl h-[90vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* ROOM TOP HEADER */}
        <div className="px-4 sm:px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="relative shrink-0">
              <img
                src={post.imageUrl}
                alt={post.title}
                className="w-11 h-11 rounded-xl object-cover border border-slate-300 dark:border-slate-700 shadow-sm"
              />
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-black uppercase px-2 py-0.5 rounded-md bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300">
                  #{post.primaryHashtag} Room
                </span>
                {post.expiresAt && !isClosed && (
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center">
                    <Clock className="w-3 h-3 mr-1 text-orange-500" />
                    {countdown.formatted} remaining
                  </span>
                )}
                {isClosed && (
                  <span className="text-[11px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                    🔒 Room Closed
                  </span>
                )}
              </div>
              <h2 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                {post.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Host Controls */}
            {isAuthor && !isClosed && (
              <button
                id="host-close-room-btn"
                onClick={() => {
                  if (post.primaryHashtag === 'foodsplit') handleCloseRoom('Order Placed Successfully');
                  else if (post.primaryHashtag === 'cabsplit') handleCloseRoom('Cab Departed');
                  else handleCloseRoom('Item Sold to Buyer');
                }}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md flex items-center space-x-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  {post.primaryHashtag === 'foodsplit'
                    ? 'Order Placed (Close)'
                    : post.primaryHashtag === 'cabsplit'
                    ? 'Booked & Departed'
                    : 'Mark as Sold'}
                </span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* INTERACTIVE COORDINATION DASHBOARD BANNER */}
        <div className="bg-slate-100/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 p-3 sm:p-4">
          
          {/* FOOD SPLIT BOARD */}
          {post.primaryHashtag === 'foodsplit' && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <ShoppingBag className="w-4 h-4 text-amber-500" />
                    <span className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                      {post.metadata?.food?.restaurant || 'Group Order Cart'}
                    </span>
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                      ${foodTotal.toFixed(2)} / ${minOrderTarget} target
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Drop: <span className="font-semibold text-slate-700 dark:text-slate-300">{post.metadata?.food?.dropLocation || 'Campus Lobby'}</span>
                    {' • '}Est. Share: <span className="font-bold text-emerald-600">${perPersonEst}/person ({uniqueParticipants} participants)</span>
                  </div>
                </div>

                {!isClosed && (
                  <button
                    id="add-food-item-toggle-btn"
                    onClick={() => setShowAddFoodItem(!showAddFoodItem)}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-sm flex items-center space-x-1 self-start sm:self-auto"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add My Dish</span>
                  </button>
                )}
              </div>

              {/* Progress bar to Min Order */}
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full transition-all duration-500"
                  style={{ width: `${foodProgressPercent}%` }}
                />
              </div>

              {/* Add dish form modal inside */}
              {showAddFoodItem && (
                <form onSubmit={handleAddFoodItem} className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-amber-300 dark:border-amber-700 shadow-lg flex flex-col sm:flex-row items-center gap-2 animate-in fade-in">
                  <input
                    type="text"
                    value={foodItemName}
                    onChange={(e) => setFoodItemName(e.target.value)}
                    placeholder="Item name (e.g. Double Chicken Burrito Bowl)"
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                    required
                  />
                  <div className="flex items-center space-x-1 w-full sm:w-28">
                    <span className="text-xs font-bold text-slate-400">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={foodItemPrice}
                      onChange={(e) => setFoodItemPrice(e.target.value)}
                      placeholder="Price"
                      className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                      required
                    />
                  </div>
                  <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={() => setShowAddFoodItem(false)}
                      className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3.5 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs shadow"
                    >
                      Add to Cart
                    </button>
                  </div>
                </form>
              )}

              {/* List of current items added */}
              <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
                {foodItems.map((item) => (
                  <div
                    key={item.id}
                    className="shrink-0 flex items-center space-x-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-lg text-xs"
                  >
                    <span className="font-bold text-slate-800 dark:text-slate-200">{item.userName?.split(' ')[0]}:</span>
                    <span className="text-slate-600 dark:text-slate-300">{item.name}</span>
                    <span className="font-black text-amber-600 dark:text-amber-400">${item.price.toFixed(2)}</span>
                    {(profile?.uid === item.userId || isAuthor) && (
                      <button
                        onClick={() => handleRemoveFoodItem(item.id)}
                        className="text-slate-400 hover:text-rose-500 ml-1"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CAB SPLIT BOARD */}
          {post.primaryHashtag === 'cabsplit' && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <Car className="w-4 h-4 text-emerald-500" />
                    <span className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                      To: {post.metadata?.cab?.destination}
                    </span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      Departing: {post.metadata?.cab?.departureTime}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Est. Total: <span className="font-bold text-slate-800 dark:text-slate-200">${estFare}</span>
                    {' • '}Fare Split: <span className="font-black text-emerald-600">${farePerPerson}/passenger</span> ({claimedSeats.length}/{totalSeats} seats filled)
                  </div>
                </div>

                {!isClosed && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={pickupSpotInput}
                      onChange={(e) => setPickupSpotInput(e.target.value)}
                      placeholder="My pickup point"
                      className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                )}
              </div>

              {/* Interactive Seats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Array.from({ length: totalSeats }).map((_, idx) => {
                  const seatNum = idx + 1;
                  const reservation = claimedSeats.find(s => s.seatNumber === seatNum);
                  const isUserSeat = reservation && reservation.userId === profile?.uid;

                  return (
                    <button
                      key={seatNum}
                      onClick={() => !isClosed && handleClaimSeat(seatNum)}
                      disabled={isClosed}
                      className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                        reservation
                          ? isUserSeat
                            ? 'bg-emerald-500 text-white border-emerald-600 shadow-md'
                            : 'bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                          : 'bg-white dark:bg-slate-900/60 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 text-slate-500'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-[11px] font-black uppercase">
                          Seat #{seatNum} {idx === 0 ? '(Host)' : ''}
                        </div>
                        <div className="text-xs font-bold truncate">
                          {reservation ? reservation.userName : '+ Click to Claim'}
                        </div>
                        {reservation?.pickupPoint && (
                          <div className="text-[9px] truncate opacity-90">
                            📍 {reservation.pickupPoint}
                          </div>
                        )}
                      </div>
                      <UserCheck className={`w-4 h-4 shrink-0 ${reservation ? 'opacity-100' : 'opacity-30'}`} />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* RESELL BOARD */}
          {post.primaryHashtag === 'resell' && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <div className="flex items-center space-x-2">
                  <Tag className="w-4 h-4 text-violet-500" />
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                    Asking Price: ${post.metadata?.resell?.price}
                  </span>
                  {post.metadata?.resell?.originalPrice && (
                    <span className="line-through text-xs text-slate-400">
                      ${post.metadata?.resell?.originalPrice}
                    </span>
                  )}
                  <span className="text-[10px] font-bold uppercase bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 px-2 py-0.5 rounded">
                    {post.metadata?.resell?.condition}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Meetup: {post.metadata?.resell?.itemLocation || 'Campus Center'} • Negotiable in live room
                </div>
              </div>

              {!isClosed && !isAuthor && (
                <form onSubmit={handleSendOffer} className="flex items-center space-x-2">
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">$</span>
                    <input
                      type="number"
                      value={offerInput}
                      onChange={(e) => setOfferInput(e.target.value)}
                      placeholder="Make offer"
                      className="w-32 pl-6 pr-2 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-xl shadow"
                  >
                    Submit Offer
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* MESSAGES SCROLL AREA */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 bg-slate-50/50 dark:bg-slate-900/50">
          {messages.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs space-y-2">
              <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 mx-auto flex items-center justify-center">
                <UtensilsCrossed className="w-5 h-5 text-slate-400" />
              </div>
              <p className="font-semibold">Welcome to the live coordination room!</p>
              <p className="text-[11px]">Send a message to coordinate order items, pickup timing, or ask questions.</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = profile?.uid === msg.senderId;

              if (msg.isSystem) {
                return (
                  <div key={msg.id} className="text-center my-2">
                    <span className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-800/40 shadow-sm">
                      {msg.text}
                    </span>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className={`flex items-end space-x-2 ${isMine ? 'justify-end' : 'justify-start'}`}
                >
                  {!isMine && (
                    <img
                      src={msg.senderAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                      alt={msg.senderName}
                      className="w-7 h-7 rounded-full object-cover shrink-0 border border-slate-300 dark:border-slate-700"
                    />
                  )}

                  <div className={`max-w-[75%] space-y-1 ${isMine ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center space-x-1.5 px-1">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                        {msg.senderName}
                      </span>
                      {msg.senderRole === 'Host' && (
                        <span className="text-[9px] uppercase font-black px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400">
                          Host
                        </span>
                      )}
                    </div>

                    <div
                      className={`px-4 py-2 rounded-2xl text-xs leading-relaxed shadow-sm ${
                        isMine
                          ? 'bg-orange-500 text-white rounded-br-none'
                          : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-bl-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* BOTTOM MESSAGE INPUT BAR */}
        <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          {isClosed ? (
            <div className="text-center py-2 text-xs font-bold text-slate-400">
              🔒 This coordination room has been closed by the host.
            </div>
          ) : (
            <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
              <input
                id="room-message-input"
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Message all students in this #${post.primaryHashtag} room...`}
                className="flex-1 px-4 py-2.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
              />
              <button
                id="send-room-msg-btn"
                type="submit"
                disabled={!inputText.trim()}
                className="p-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white shadow-md transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};
