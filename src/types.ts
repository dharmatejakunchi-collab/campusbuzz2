export type UserRole = 'student' | 'club' | 'committee' | 'admin';

export type HashtagType = 'foodsplit' | 'cabsplit' | 'resell' | 'lost' | 'found' | 'general';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: UserRole;
  studentId?: string;
  hostel?: string;
  department?: string;
  phone?: string;
  whatsapp?: string;
  telegram?: string;
  roomNumber?: string;
  bio?: string;
  clubName?: string;
  verifiedStudent: boolean;
  isBlocked?: boolean;
  blockedReason?: string;
  blockedAt?: number;
  blockedBy?: string;
  preferredTheme?: string;
  createdAt: number;
}

export interface PostContactInfo {
  phone?: string;
  whatsapp?: string;
  email?: string;
  telegram?: string;
  roomLocation?: string;
  preferredContactMethod?: 'whatsapp' | 'call' | 'email' | 'in_person';
}

export interface FoodMetadata {
  restaurant: string;
  minOrder?: number;
  currentTotal?: number;
  deliveryFee?: number;
  dropLocation: string;
  orderDeadline?: string;
  customItems?: { name: string; price: number }[];
}

export interface CabMetadata {
  pickup: string;
  destination: string;
  departureTime: string;
  totalSeats: number;
  availableSeats: number;
  estimatedFare: number;
  luggageSpace?: string;
  carModel?: string;
}

export interface ResellMetadata {
  price: number;
  originalPrice?: number;
  condition: 'brand_new' | 'like_new' | 'good' | 'fair';
  category: string;
  negotiable: boolean;
  itemLocation: string;
}

export interface LostFoundMetadata {
  itemType: string;
  locationFoundOrLost: string;
  dateOccurred: string;
  reward?: string;
  status: 'unclaimed' | 'claimed' | 'handed_over_to_security';
  securityDeskLocation?: string;
}

export interface PostMetadata {
  food?: FoodMetadata;
  cab?: CabMetadata;
  resell?: ResellMetadata;
  lostFound?: LostFoundMetadata;
}

export interface Post {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  hashtags: string[];
  primaryHashtag: HashtagType;
  authorId: string;
  authorName: string;
  authorEmail: string;
  authorAvatar: string;
  authorRole: UserRole;
  authorDepartment?: string;
  authorHostel?: string;
  contactInfo?: PostContactInfo;
  expiresAt?: number; // ms timestamp - mandatory for foodsplit and cabsplit
  durationMinutes?: number;
  isClosed?: boolean;
  closedReason?: string;
  isExpired?: boolean;
  metadata?: PostMetadata;
  createdAt: number;
  likesCount: number;
  likedBy: string[];
  viewsCount: number;
  pinned?: boolean;
}

export interface FoodOrderItem {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  name: string;
  price: number;
  qty: number;
  notes?: string;
}

export interface CabSeatReservation {
  seatNumber: number;
  userId: string;
  userName: string;
  userAvatar?: string;
  pickupPoint?: string;
  luggage?: string;
}

export interface ResellOffer {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  offerAmount: number;
  status: 'pending' | 'accepted' | 'declined';
  timestamp: number;
}

export interface CoordinationRoom {
  id: string;
  postId: string;
  title: string;
  type: 'foodsplit' | 'cabsplit' | 'resell';
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  isClosed: boolean;
  closedAt?: number;
  closedReason?: string;
  members: { [uid: string]: { name: string; avatar: string; joinedAt: number; role?: string } };
  memberCount: number;
  foodItems?: FoodOrderItem[];
  cabSeats?: CabSeatReservation[];
  offers?: ResellOffer[];
  createdAt: number;
  lastMessage?: string;
  lastMessageTime?: number;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderRole?: string;
  text: string;
  isSystem?: boolean;
  payload?: any;
  createdAt: number;
}

export interface ClubAnnouncement {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorRole: 'club' | 'committee' | 'admin';
  clubName: string;
  clubCategory: 'Technical' | 'Cultural' | 'Sports' | 'Academic' | 'Social' | 'Administration';
  clubBadgeIcon?: string;
  bannerUrl?: string;
  externalUrl?: string;
  googleFormUrl?: string;
  googleFormTitle?: string;
  attachmentName?: string;
  attachmentUrl?: string;
  linkedEventId?: string;
  isPinned?: boolean;
  createdAt: number;
  likesCount: number;
  likedBy: string[];
}

export interface EventAttendee {
  name: string;
  avatar: string;
  status: 'going' | 'interested';
  timestamp: number;
}

export interface CampusEvent {
  id: string;
  title: string;
  description: string;
  clubName: string;
  clubRole: 'club' | 'committee' | 'admin';
  organizerId: string;
  organizerName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  endTime?: string;
  venue: string;
  category: 'Technical' | 'Cultural' | 'Sports' | 'Academic' | 'Career' | 'Social';
  bannerUrl: string;
  registrationUrl?: string;
  linkedAnnouncementId?: string;
  attendees: { [userId: string]: EventAttendee };
  goingCount: number;
  interestedCount: number;
  maxSeats?: number;
  isCancelled?: boolean;
  createdAt: number;
}

export interface EventRequest {
  id: string;
  title: string;
  description: string;
  proposedDate: string;
  proposedTime: string;
  proposedVenue: string;
  category: string;
  requestedByStudentId: string;
  requestedByStudentName: string;
  requestedByStudentEmail: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNotes?: string;
  createdAt: number;
}

export type NavigationTab = 'feed' | 'clubs' | 'calendar' | 'complaints' | 'admin';

export type ComplaintStatus = 'under_review' | 'in_progress' | 'resolved' | 'acknowledged' | 'open' | 'investigating';

export interface AdminResponse {
  responderName: string;
  responderRole: string;
  response: string;
  updatedAt: number;
}

export interface Complaint {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  evidenceUrl?: string | null;
  imageUrl?: string;
  isAnonymousToPublic?: boolean;
  realAuthorId?: string;
  realAuthorName?: string;
  realAuthorEmail?: string;
  realAuthorHostel?: string;
  publicAuthorTag?: string;
  status: ComplaintStatus;
  upvotesCount: number;
  upvoters: string[];
  adminResponse?: AdminResponse | null;
  officialResponse?: string;
  officialResponseBy?: string;
  officialResponseAt?: number;
  resolvedByAuthor?: boolean;
  resolvedNote?: string;
  resolvedAt?: number | null;
  createdAt: number;
}
