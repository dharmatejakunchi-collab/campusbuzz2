import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

export function formatTimeRemaining(expiresAt?: number): {
  formatted: string;
  totalSeconds: number;
  isExpired: boolean;
  urgency: 'normal' | 'soon' | 'critical' | 'expired';
} {
  if (!expiresAt) {
    return { formatted: 'No limit', totalSeconds: Infinity, isExpired: false, urgency: 'normal' };
  }

  const now = Date.now();
  const diff = expiresAt - now;

  if (diff <= 0) {
    return { formatted: 'Expired', totalSeconds: 0, isExpired: true, urgency: 'expired' };
  }

  const totalSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  let formatted = '';
  if (hours > 0) {
    formatted = `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    formatted = `${minutes}m ${seconds}s`;
  } else {
    formatted = `${seconds}s`;
  }

  let urgency: 'normal' | 'soon' | 'critical' | 'expired' = 'normal';
  if (diff <= 5 * 60 * 1000) {
    urgency = 'critical'; // < 5 mins (flashing red)
  } else if (diff <= 20 * 60 * 1000) {
    urgency = 'soon'; // < 20 mins (amber)
  }

  return { formatted, totalSeconds, isExpired: false, urgency };
}

// Hook that triggers re-render every second for ticking countdowns and auto-deletes when expired
export function useCountdown(expiresAt?: number, postId?: string) {
  const [time, setTime] = useState(() => formatTimeRemaining(expiresAt));

  useEffect(() => {
    if (!expiresAt) return;

    // Run every second
    const interval = setInterval(() => {
      const updated = formatTimeRemaining(expiresAt);
      setTime(updated);

      if (updated.isExpired && postId) {
        // Auto-delete post from Firestore once expired
        deleteDoc(doc(db, 'posts', postId)).catch(() => {});
        deleteDoc(doc(db, 'rooms', postId)).catch(() => {});
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, postId]);

  return time;
}

// Background auto-cleanup worker that periodically checks for and deletes expired posts in Firestore
export function useBackgroundExpiryWorker() {
  useEffect(() => {
    const runWorker = async () => {
      try {
        const now = Date.now();
        const postsRef = collection(db, 'posts');
        const snapshot = await getDocs(postsRef);

        const deletePromises: Promise<any>[] = [];
        snapshot.forEach((postDoc) => {
          const data = postDoc.data();
          if (data.expiresAt && data.expiresAt <= now) {
            // Auto delete expired post and room from database
            console.log(`[Expiry Worker] Auto-deleting expired post: ${postDoc.id} (${data.title})`);
            deletePromises.push(deleteDoc(doc(db, 'posts', postDoc.id)));
            deletePromises.push(deleteDoc(doc(db, 'rooms', postDoc.id)).catch(() => {}));
          }
        });

        await Promise.all(deletePromises);
      } catch (err) {
        console.error('[Expiry Worker Error]', err);
      }
    };

    // Run immediately and then every 10 seconds as background task
    runWorker();
    const interval = setInterval(runWorker, 10000);
    return () => clearInterval(interval);
  }, []);
}

