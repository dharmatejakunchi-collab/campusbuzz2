import { db } from './firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, writeBatch, query, where } from 'firebase/firestore';
import { Post, ClubAnnouncement, CampusEvent, Complaint, UserProfile } from '../types';

export const INITIAL_USERS: UserProfile[] = [
  {
    uid: 'demo_student_alex',
    email: 'dharmatejakunchi@gmail.com',
    displayName: 'Campus Admin',
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    role: 'admin',
    studentId: 'ADM-2026-001',
    hostel: 'Administrative Block',
    department: 'University Administration',
    phone: '+1 (555) 382-9104',
    whatsapp: '+15553829104',
    bio: 'Campus Administrator & Moderator',
    verifiedStudent: true,
    createdAt: Date.now()
  },
  {
    uid: 'demo_student_user',
    email: 'student@campus.edu',
    displayName: 'Student User',
    photoURL: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    role: 'student',
    studentId: 'CS-2026-104',
    hostel: 'Hostel Block A',
    department: 'Computer Science',
    phone: '+1 (555) 491-7721',
    whatsapp: '+15554917721',
    bio: 'Student exploring campus buzz and food splits',
    verifiedStudent: true,
    createdAt: Date.now()
  },
  {
    uid: 'demo_club_rep',
    email: 'robotics@campus.edu',
    displayName: 'Robotics Society',
    photoURL: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=150&auto=format&fit=crop&q=80',
    role: 'club',
    clubName: 'Robotics Society',
    department: 'Engineering Council',
    bio: 'Official Robotics Club on campus',
    verifiedStudent: true,
    createdAt: Date.now()
  }
];

export const INITIAL_POSTS: Post[] = [];
export const INITIAL_ANNOUNCEMENTS: ClubAnnouncement[] = [];
export const INITIAL_EVENTS: CampusEvent[] = [];
export const INITIAL_COMPLAINTS: Complaint[] = [];

// Demo document IDs that need purging from Firestore
const DEMO_POST_IDS = ['post_food_1', 'post_cab_1', 'post_resell_1', 'post_lost_1', 'post_found_1', 'post_food_2'];
const DEMO_ANNOUNCEMENT_IDS = ['announcement_1', 'announcement_2', 'announcement_3'];
const DEMO_EVENT_IDS = ['event_hackathon_1', 'event_cultural_1', 'event_career_1'];
const DEMO_COMPLAINT_IDS = ['complaint_1', 'complaint_2', 'complaint_3'];

/**
 * Actively purges all demo posts, complaints, announcements, and events from Firestore
 */
export async function purgeAllDemoData(): Promise<{ success: boolean; count: number }> {
  let deletedCount = 0;
  try {
    const batch = writeBatch(db);

    // Delete known demo posts
    for (const id of DEMO_POST_IDS) {
      batch.delete(doc(db, 'posts', id));
      deletedCount++;
    }

    // Delete known demo announcements
    for (const id of DEMO_ANNOUNCEMENT_IDS) {
      batch.delete(doc(db, 'club_announcements', id));
      deletedCount++;
    }

    // Delete known demo events
    for (const id of DEMO_EVENT_IDS) {
      batch.delete(doc(db, 'events', id));
      deletedCount++;
    }

    // Delete known demo complaints
    for (const id of DEMO_COMPLAINT_IDS) {
      batch.delete(doc(db, 'complaints', id));
      deletedCount++;
    }

    // Also scan collections for any docs created with 'demo_' prefix
    const postsSnap = await getDocs(collection(db, 'posts'));
    postsSnap.forEach((d) => {
      if (d.id.startsWith('post_') || d.id.startsWith('demo_') || DEMO_POST_IDS.includes(d.id)) {
        batch.delete(d.ref);
        deletedCount++;
      }
    });

    const complaintsSnap = await getDocs(collection(db, 'complaints'));
    complaintsSnap.forEach((d) => {
      if (d.id.startsWith('complaint_') || DEMO_COMPLAINT_IDS.includes(d.id)) {
        batch.delete(d.ref);
        deletedCount++;
      }
    });

    const announcementsSnap = await getDocs(collection(db, 'club_announcements'));
    announcementsSnap.forEach((d) => {
      if (d.id.startsWith('announcement_') || DEMO_ANNOUNCEMENT_IDS.includes(d.id)) {
        batch.delete(d.ref);
        deletedCount++;
      }
    });

    const eventsSnap = await getDocs(collection(db, 'events'));
    eventsSnap.forEach((d) => {
      if (d.id.startsWith('event_') || DEMO_EVENT_IDS.includes(d.id)) {
        batch.delete(d.ref);
        deletedCount++;
      }
    });

    await batch.commit();
    console.log(`Successfully purged ${deletedCount} demo records from database.`);
    return { success: true, count: deletedCount };
  } catch (error) {
    console.error('Error purging demo data:', error);
    return { success: false, count: deletedCount };
  }
}

/**
 * Ensures initial admin user exists in Firestore without populating demo posts
 */
export async function seedDatabaseIfEmpty() {
  try {
    // Purge any lingering demo documents to ensure clean database
    await purgeAllDemoData();

    // Ensure initial users are saved if users collection is empty
    const usersSnap = await getDocs(collection(db, 'users'));
    if (usersSnap.empty) {
      const batch = writeBatch(db);
      for (const u of INITIAL_USERS) {
        batch.set(doc(db, 'users', u.uid), u);
      }
      await batch.commit();
    }
  } catch (error) {
    console.error('Error verifying database state:', error);
  }
}

