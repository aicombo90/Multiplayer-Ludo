import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  initializeFirestore,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  onSnapshot,
  collection,
  query,
  where,
  arrayUnion,
  serverTimestamp
} from 'firebase/firestore';
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  signOut,
  User
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { GameState, RealmId, Token } from '../types';
import { REALMS } from '../constants/gameConstants';

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId || '(default)');
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
export const facebookProvider = new FacebookAuthProvider();

export interface UserProfile {
  uid: string;
  displayName: string;
  email?: string | null;
  photoURL?: string | null;
  isGuest: boolean;
  totalGames: number;
  totalWins: number;
  createdAt?: number;
  updatedAt?: number;
}

// Helper function to prevent operations from hanging indefinitely (e.g., popups blocked or Firestore latency)
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number, timeoutErrCode = 'timeout'): Promise<T> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      const err: any = new Error(`Operation timed out after ${timeoutMs}ms`);
      err.code = timeoutErrCode;
      reject(err);
    }, timeoutMs);

    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
};

// Fetch or create user profile document in Firestore
export const fetchOrCreateUserProfile = async (user: User, customName?: string): Promise<UserProfile> => {
  const fallbackName = customName?.trim() || user.displayName || `Player_${user.uid.slice(0, 5)}`;
  try {
    const userRef = doc(db, 'users', user.uid);
    const snap = await withTimeout(getDoc(userRef), 2500, 'firestore_timeout');

    if (snap.exists()) {
      const data = snap.data() as UserProfile;
      if (customName && customName.trim() && customName !== data.displayName) {
        updateDoc(userRef, {
          displayName: customName.trim(),
          updatedAt: Date.now()
        }).catch(e => console.warn('Non-blocking updateDoc warning:', e));
        return { ...data, displayName: customName.trim() };
      }
      return data;
    } else {
      const newProfile: UserProfile = {
        uid: user.uid,
        displayName: fallbackName,
        email: user.email || null,
        photoURL: user.photoURL || null,
        isGuest: user.isAnonymous,
        totalGames: 0,
        totalWins: 0,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      setDoc(userRef, newProfile).catch(e => console.warn('Non-blocking setDoc warning:', e));
      return newProfile;
    }
  } catch (err) {
    console.warn('Error fetching or creating user profile (using local fallback):', err);
    return {
      uid: user.uid,
      displayName: fallbackName,
      isGuest: user.isAnonymous,
      totalGames: 0,
      totalWins: 0
    };
  }
};

// Login or Register with Email/Name (Permanent Profile)
export const loginWithEmailAccount = async (emailInput: string, nameInput: string): Promise<{ user: User; profile: UserProfile }> => {
  let user: any;
  try {
    if (auth.currentUser) {
      user = auth.currentUser;
    } else {
      const cred = await withTimeout(signInAnonymously(auth), 2500, 'auth_timeout');
      user = cred.user;
    }
  } catch (err) {
    const guestUid = `user_mail_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    user = { uid: guestUid, isAnonymous: false };
  }

  const sanitizedEmail = emailInput.trim().toLowerCase();
  const sanitizedName = nameInput.trim() || `Player_${user.uid.slice(0, 5)}`;

  // Query Firestore for existing profile by email if email provided
  try {
    if (sanitizedEmail) {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', sanitizedEmail));
      const querySnap = await withTimeout(getDocs(q), 2500, 'firestore_timeout');
      if (!querySnap.empty) {
        const existingDoc = querySnap.docs[0];
        const existingProfile = existingDoc.data() as UserProfile;
        localStorage.setItem('mythic_ludo_uid', existingProfile.uid);
        localStorage.setItem('mythic_ludo_player_name', existingProfile.displayName);
        localStorage.setItem('mythic_ludo_is_guest', 'false');
        return { user, profile: existingProfile };
      }
    }
  } catch (err) {
    console.warn('Email lookup failed, creating new profile', err);
  }

  const newProfile: UserProfile = {
    uid: user.uid,
    displayName: sanitizedName,
    email: sanitizedEmail || null,
    isGuest: false,
    totalGames: 0,
    totalWins: 0,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  try {
    const profileRef = doc(db, 'users', user.uid);
    setDoc(profileRef, newProfile).catch(e => console.warn('Non-blocking setDoc warning:', e));
  } catch (e) {
    console.warn('Firestore setDoc note:', e);
  }

  localStorage.setItem('mythic_ludo_uid', user.uid);
  localStorage.setItem('mythic_ludo_player_name', sanitizedName);
  localStorage.setItem('mythic_ludo_is_guest', 'false');
  return { user, profile: newProfile };
};

// Update User Stats (Games Played & Wins)
export const updateUserStatsInFirestore = async (uid: string, won: boolean): Promise<void> => {
  try {
    const userRef = doc(db, 'users', uid);
    const snap = await withTimeout(getDoc(userRef), 2000, 'firestore_timeout');
    if (snap.exists()) {
      const currentData = snap.data() as UserProfile;
      updateDoc(userRef, {
        totalGames: (currentData.totalGames || 0) + 1,
        totalWins: won ? (currentData.totalWins || 0) + 1 : (currentData.totalWins || 0),
        updatedAt: Date.now()
      }).catch(e => console.warn('Non-blocking stats update error:', e));
    }
  } catch (err) {
    console.warn('Error updating user stats:', err);
  }
};

// Google Sign In Popup (with 2.5s timeout & auto-fallback for restricted iframe popups)
export const loginWithGoogle = async (customName?: string): Promise<{ user: User; profile: UserProfile }> => {
  try {
    const result = await withTimeout(signInWithPopup(auth, googleProvider), 2500, 'auth/popup-blocked');
    const profile = await fetchOrCreateUserProfile(result.user, customName);
    localStorage.setItem('mythic_ludo_uid', result.user.uid);
    localStorage.setItem('mythic_ludo_player_name', profile.displayName);
    localStorage.setItem('mythic_ludo_is_guest', 'false');
    return { user: result.user, profile };
  } catch (err: any) {
    console.warn('Google Auth popup failed/blocked in frame, executing instant fallback login:', err);
    const fallbackEmail = `${(customName || 'google_player').toLowerCase().replace(/[^a-z0-9]/g, '_')}@gmail.com`;
    return loginWithEmailAccount(fallbackEmail, customName || 'Google Player');
  }
};

// Facebook Sign In Popup (with 2.5s timeout & auto-fallback for restricted iframe popups)
export const loginWithFacebook = async (customName?: string): Promise<{ user: User; profile: UserProfile }> => {
  try {
    const result = await withTimeout(signInWithPopup(auth, facebookProvider), 2500, 'auth/popup-blocked');
    const profile = await fetchOrCreateUserProfile(result.user, customName);
    localStorage.setItem('mythic_ludo_uid', result.user.uid);
    localStorage.setItem('mythic_ludo_player_name', profile.displayName);
    localStorage.setItem('mythic_ludo_is_guest', 'false');
    return { user: result.user, profile };
  } catch (err: any) {
    console.warn('Facebook Auth popup failed/blocked in frame, executing instant fallback login:', err);
    const fallbackEmail = `${(customName || 'fb_player').toLowerCase().replace(/[^a-z0-9]/g, '_')}@facebook.com`;
    return loginWithEmailAccount(fallbackEmail, customName || 'Facebook Player');
  }
};

// Guest Sign In (Temporary or Persistent session)
export const loginAsGuest = async (customName?: string): Promise<{ user: any; profile: UserProfile }> => {
  let userObj: any = null;
  try {
    const cred = await withTimeout(signInAnonymously(auth), 2500, 'auth_timeout');
    userObj = cred.user;
  } catch (err) {
    console.warn('Firebase Anonymous Auth fallback triggered:', err);
    const guestUid = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    userObj = { uid: guestUid, isAnonymous: true };
  }

  const nameToUse = customName?.trim() || `Player ${Math.floor(100 + Math.random() * 899)}`;
  const profile: UserProfile = {
    uid: userObj.uid,
    displayName: nameToUse,
    isGuest: true,
    totalGames: 0,
    totalWins: 0
  };
  localStorage.setItem('mythic_ludo_uid', userObj.uid);
  localStorage.setItem('mythic_ludo_player_name', nameToUse);
  localStorage.setItem('mythic_ludo_is_guest', 'true');
  return { user: userObj, profile };
};

// Check if a registered or guest user is auto-logged in from previous session
export const checkAutoLoginUser = async (): Promise<UserProfile | null> => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe();
      if (user && !user.isAnonymous) {
        const profile = await fetchOrCreateUserProfile(user);
        if (profile) {
          localStorage.setItem('mythic_ludo_uid', profile.uid);
          localStorage.setItem('mythic_ludo_player_name', profile.displayName);
          localStorage.setItem('mythic_ludo_is_guest', 'false');
          resolve(profile);
          return;
        }
      }

      const storedUid = localStorage.getItem('mythic_ludo_uid');
      const storedName = localStorage.getItem('mythic_ludo_player_name');
      const isGuestStr = localStorage.getItem('mythic_ludo_is_guest');

      if (storedUid && storedName) {
        try {
          const userRef = doc(db, 'users', storedUid);
          const snap = await getDoc(userRef);
          if (snap.exists()) {
            const data = snap.data() as UserProfile;
            resolve(data);
            return;
          }
        } catch (err) {
          console.warn('Auto login Firestore doc fetch note:', err);
        }

        // Local stored fallback profile
        const localProfile: UserProfile = {
          uid: storedUid,
          displayName: storedName,
          isGuest: isGuestStr === 'true',
          totalGames: 0,
          totalWins: 0
        };
        resolve(localProfile);
        return;
      }

      resolve(null);
    });
  });
};

// Get or create persistent user ID (guarantees consistency between sync and async calls)
export const getUserId = async (): Promise<string> => {
  let localUid = localStorage.getItem('mythic_ludo_uid');
  if (!localUid) {
    localUid = 'usr_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
    localStorage.setItem('mythic_ludo_uid', localUid);
  }

  try {
    if (auth.currentUser) {
      localStorage.setItem('mythic_ludo_uid', auth.currentUser.uid);
      return auth.currentUser.uid;
    }
    const cred = await signInAnonymously(auth);
    localStorage.setItem('mythic_ludo_uid', cred.user.uid);
    return cred.user.uid;
  } catch (err) {
    console.warn('Using local session ID for player:', localUid, err);
    return localUid;
  }
};

export const getCurrentUserIdSync = (): string => {
  if (auth.currentUser?.uid) {
    localStorage.setItem('mythic_ludo_uid', auth.currentUser.uid);
    return auth.currentUser.uid;
  }
  let localUid = localStorage.getItem('mythic_ludo_uid');
  if (!localUid) {
    localUid = 'usr_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
    localStorage.setItem('mythic_ludo_uid', localUid);
  }
  return localUid;
};

export interface RoomPlayer {
  id: string;
  name: string;
  realmIdx: RealmId;
  isHost: boolean;
  ready: boolean;
}

export interface RoomData {
  roomCode: string;
  createdAt: number;
  hostId: string;
  status: 'waiting' | 'playing' | 'finished' | 'cancelled';
  maxPlayers: number; // 2, 3, or 4
  matchType?: 'normal' | 'relic';
  players: RoomPlayer[];
  gameState: GameState | null;
  lastMoveAction?: string;
  lastEmote?: {
    senderId: string;
    senderName: string;
    emoji: string;
    label: string;
    timestamp: number;
  };
  updatedAt: number;
}

// Generate random 6-character alphanumeric room code
export const generateRoomCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Create a new room in Firestore
export const createRoomInFirestore = async (
  playerName: string,
  realmIdx: RealmId,
  maxPlayers: number,
  matchType: 'normal' | 'relic' = 'normal'
): Promise<{ roomCode: string; userId: string }> => {
  const userId = await getUserId();
  const roomCode = generateRoomCode();

  const initialPlayer: RoomPlayer = {
    id: userId,
    name: playerName || 'Host',
    realmIdx,
    isHost: true,
    ready: true
  };

  const roomRef = doc(db, 'rooms', roomCode);
  const roomData: RoomData = {
    roomCode,
    createdAt: Date.now(),
    hostId: userId,
    status: 'waiting',
    maxPlayers,
    matchType,
    players: [initialPlayer],
    gameState: null,
    updatedAt: Date.now()
  };

  await setDoc(roomRef, roomData);
  return { roomCode, userId };
};

// Join existing room
export const joinRoomInFirestore = async (
  roomCode: string,
  playerName: string,
  preferredRealmIdx?: RealmId
): Promise<{ userId: string }> => {
  const userId = await getUserId();
  const formattedCode = roomCode.trim().toUpperCase();
  const roomRef = doc(db, 'rooms', formattedCode);
  const snap = await getDoc(roomRef);

  if (!snap.exists()) {
    throw new Error('রুম কোডটি পাওয়া যায়নি। সঠিক কোড লিখুন।');
  }

  const room = snap.data() as RoomData;

  if (room.status !== 'waiting') {
    throw new Error('এই খেলাটি ইতিমধ্যেই শুরু হয়ে গিয়েছে।');
  }

  // Check if player already in room
  const existingPlayer = room.players.find(p => p.id === userId);
  if (existingPlayer) {
    return { userId };
  }

  if (room.players.length >= room.maxPlayers) {
    throw new Error('রুমটি সম্পূর্ণ পূর্ণ হয়ে গেছে (Full)!');
  }

  // Find taken realms
  const takenRealms = new Set(room.players.map(p => p.realmIdx));
  let chosenRealm = preferredRealmIdx ?? 0;
  if (takenRealms.has(chosenRealm)) {
    // Pick first available realm
    const available = [0, 1, 2, 3].find(r => !takenRealms.has(r as RealmId));
    if (available !== undefined) {
      chosenRealm = available as RealmId;
    }
  }

  const newPlayer: RoomPlayer = {
    id: userId,
    name: playerName || `Player ${room.players.length + 1}`,
    realmIdx: chosenRealm,
    isHost: false,
    ready: true
  };

  await updateDoc(roomRef, {
    players: arrayUnion(newPlayer),
    updatedAt: Date.now()
  });

  return { userId };
};

// Start Room Match (Host only)
export const startRoomMatchInFirestore = async (
  roomCode: string,
  initialGameState: GameState
): Promise<void> => {
  const roomRef = doc(db, 'rooms', roomCode);
  const cleanGameState = JSON.parse(JSON.stringify(initialGameState));
  await updateDoc(roomRef, {
    status: 'playing',
    gameState: cleanGameState,
    updatedAt: Date.now()
  });
};

// Sync GameState update
export const updateRoomGameStateInFirestore = async (
  roomCode: string,
  newGameState: GameState,
  lastMoveAction?: string
): Promise<void> => {
  const roomRef = doc(db, 'rooms', roomCode);
  const cleanGameState = JSON.parse(JSON.stringify(newGameState));
  await updateDoc(roomRef, {
    gameState: cleanGameState,
    lastMoveAction: lastMoveAction || '',
    updatedAt: Date.now()
  });
};

// Cancel / Leave Room Match in Firestore
export const cancelRoomMatchInFirestore = async (roomCode: string): Promise<void> => {
  try {
    const formattedCode = roomCode.trim().toUpperCase();
    const roomRef = doc(db, 'rooms', formattedCode);
    await updateDoc(roomRef, {
      status: 'cancelled',
      updatedAt: Date.now()
    });
  } catch (err) {
    console.warn('Error cancelling room match:', err);
  }
};

// Send Emote Reaction in Room
export const sendEmoteInRoom = async (
  roomCode: string,
  senderId: string,
  senderName: string,
  emoji: string,
  label: string = ''
): Promise<void> => {
  const roomRef = doc(db, 'rooms', roomCode.trim().toUpperCase());
  await updateDoc(roomRef, {
    lastEmote: {
      senderId,
      senderName,
      emoji,
      label,
      timestamp: Date.now()
    },
    updatedAt: Date.now()
  });
};

// Subscribe to room updates
export const subscribeToRoom = (
  roomCode: string,
  onUpdate: (room: RoomData | null) => void
) => {
  const formattedCode = roomCode.trim().toUpperCase();
  const roomRef = doc(db, 'rooms', formattedCode);
  return onSnapshot(roomRef, (snap) => {
    if (snap.exists()) {
      onUpdate(snap.data() as RoomData);
    } else {
      onUpdate(null);
    }
  }, (err) => {
    console.warn('subscribeToRoom snapshot notice:', err);
  });
};

// Real-Time Voice Chat WebRTC Signaling Interface
export interface VoiceSignal {
  id?: string;
  senderId: string;
  targetId: string;
  type: 'offer' | 'answer' | 'candidate';
  payload: string; // JSON string of SDP / ICE candidate
  timestamp: number;
}

// Send WebRTC Signal for Voice Chat
export const sendVoiceSignal = async (
  roomCode: string,
  signal: VoiceSignal
): Promise<void> => {
  const formattedCode = roomCode.trim().toUpperCase();
  const signalDocRef = doc(db, 'rooms', formattedCode, 'voiceSignals', `${signal.senderId}_${signal.targetId}_${signal.type}_${Date.now()}`);
  console.log(`[VoiceChat-Signal] Outgoing ${signal.type} from ${signal.senderId} to ${signal.targetId} in room ${formattedCode}`);
  await setDoc(signalDocRef, signal);
};

// Subscribe to WebRTC Voice Signals addressed to current user
export const subscribeToVoiceSignals = (
  roomCode: string,
  myUserId: string,
  onSignal: (signal: VoiceSignal) => void
) => {
  const formattedCode = roomCode.trim().toUpperCase();
  const signalsRef = collection(db, 'rooms', formattedCode, 'voiceSignals');
  console.log(`[VoiceChat-Signal] Subscribing to voice signals for user ${myUserId} in room ${formattedCode}`);
  
  return onSnapshot(signalsRef, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const data = change.doc.data() as VoiceSignal;
        // Deliver signal if targeted to me or broadcast, and not sent by myself
        if ((data.targetId === myUserId || data.targetId === 'ALL') && data.senderId !== myUserId) {
          onSignal({ id: change.doc.id, ...data });
        }
      }
    });
  }, (err) => {
    console.warn('[VoiceChat-Signal] Voice signals snapshot error:', err);
  });
};
