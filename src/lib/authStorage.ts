export interface UserProfile {
  id: string;
  username: string;
  title: string; // e.g. "GM", "IM", "FM", "CM", "NM", "NONE"
  avatar: string; // icon identifier
  avatarColor: string;
  bio: string;
  rating: number; // overall rating
  bulletRating: number;
  blitzRating: number;
  rapidRating: number;
  classicalRating: number;
  peakRating: number;
  joinedDate: string;
  isLoggedIn: boolean;
  // Dynamic combat vectors (calculated from matches)
  aggressionIndex: number;
  endgameConversion: number;
  tacticalAccuracy: number;
  openingDepth: number;
}

export interface RegisteredAccount extends UserProfile {
  password: string; // stored credentials
}

export const AVATAR_PRESETS = [
  { id: "cyber-kasparov", label: "Kasparov Cyber", color: "#00F2FF", icon: "Cpu" },
  { id: "neural-queen", label: "Neural Queen", color: "#A855F7", icon: "Crown" },
  { id: "synth-knight", label: "Synth Knight", color: "#4ADE80", icon: "Shield" },
  { id: "matrix-rook", label: "Matrix Warden", color: "#38BDF8", icon: "Zap" },
  { id: "quantum-titan", label: "Quantum Titan", color: "#F59E0B", icon: "Flame" },
  { id: "zero-ghost", label: "Zero Ghost", color: "#EC4899", icon: "Bot" },
];

export const TITLE_OPTIONS = ["GM", "IM", "FM", "CM", "NM", "NONE"];

const STORAGE_KEY_SESSION = "nexus_chess_auth_user";
const STORAGE_KEY_USERS = "nexus_registered_users";

export const DEFAULT_USER: UserProfile = {
  id: "user-kasparov",
  username: "CYBER_KASPAROV",
  title: "GM",
  avatar: "cyber-kasparov",
  avatarColor: "#00F2FF",
  bio: "Grandmaster operating from Tokyo Quantum Div. NNUE Specialist & Classical endgame purist.",
  rating: 2895,
  bulletRating: 2750,
  blitzRating: 2895,
  rapidRating: 2840,
  classicalRating: 2910,
  peakRating: 2942,
  joinedDate: "FEB 2026",
  isLoggedIn: true,
  aggressionIndex: 88,
  endgameConversion: 94,
  tacticalAccuracy: 91,
  openingDepth: 78,
};

// Seed default master account into registry
function getRegisteredAccounts(): Record<string, RegisteredAccount> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USERS);
    if (!raw) {
      const initial: Record<string, RegisteredAccount> = {
        "CYBER_KASPAROV": {
          ...DEFAULT_USER,
          password: "password123",
        },
      };
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveRegisteredAccounts(accounts: Record<string, RegisteredAccount>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(accounts));
}

let cachedUserRaw: string | null = null;
let cachedUserProfile: UserProfile = DEFAULT_USER;
const authListeners = new Set<() => void>();

export const getUserProfile = (): UserProfile => {
  if (typeof window === "undefined") return DEFAULT_USER;
  const data = localStorage.getItem(STORAGE_KEY_SESSION);
  if (!data) {
    return DEFAULT_USER;
  }
  if (data !== cachedUserRaw) {
    cachedUserRaw = data;
    try {
      cachedUserProfile = { ...DEFAULT_USER, ...JSON.parse(data) };
    } catch {
      cachedUserProfile = DEFAULT_USER;
    }
  }
  return cachedUserProfile;
};

export const subscribeUser = (onStoreChange: () => void) => {
  authListeners.add(onStoreChange);
  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY_SESSION || e.key === STORAGE_KEY_USERS) {
      cachedUserRaw = null;
      onStoreChange();
    }
  };
  window.addEventListener("storage", handleStorage);
  return () => {
    authListeners.delete(onStoreChange);
    window.removeEventListener("storage", handleStorage);
  };
};

export const getUserServerSnapshot = (): UserProfile => DEFAULT_USER;

export const updateUserProfile = (updates: Partial<UserProfile>) => {
  if (typeof window === "undefined") return;
  const current = getUserProfile();
  const updated: UserProfile = { ...current, ...updates };
  const serialized = JSON.stringify(updated);
  cachedUserRaw = serialized;
  cachedUserProfile = updated;
  localStorage.setItem(STORAGE_KEY_SESSION, serialized);

  // Also update registered accounts database
  const accounts = getRegisteredAccounts();
  const key = updated.username.toUpperCase();
  if (accounts[key]) {
    accounts[key] = { ...accounts[key], ...updated };
    saveRegisteredAccounts(accounts);
  }

  authListeners.forEach((fn) => fn());
};

// Real Authentication: Strictly verify credentials against registered users
export const loginUser = (username: string, password: string): { success: boolean; error?: string } => {
  const cleanUsername = username.trim().toUpperCase();
  if (!cleanUsername) return { success: false, error: "Please enter your operator callsign." };
  if (!password) return { success: false, error: "Please enter your security key / password." };

  const accounts = getRegisteredAccounts();
  const account = accounts[cleanUsername];

  if (!account) {
    return {
      success: false,
      error: `Operator "${cleanUsername}" is not registered. Please create a new profile first.`,
    };
  }

  if (account.password !== password) {
    return {
      success: false,
      error: "Authentication failed. Incorrect password credentials.",
    };
  }

  // Set session
  const sessionUser: UserProfile = {
    ...account,
    isLoggedIn: true,
  };
  const serialized = JSON.stringify(sessionUser);
  cachedUserRaw = serialized;
  cachedUserProfile = sessionUser;
  localStorage.setItem(STORAGE_KEY_SESSION, serialized);
  authListeners.forEach((fn) => fn());

  return { success: true };
};

// Real Registration: Ensure username uniqueness and store in nexus_registered_users
export const registerUser = (
  username: string,
  password: string,
  title: string = "FM",
  avatarId: string = "synth-knight",
  startingElo: number = 2400
): { success: boolean; error?: string } => {
  const cleanUsername = username.trim().toUpperCase();
  if (!cleanUsername || cleanUsername.length < 3) {
    return { success: false, error: "Callsign must be at least 3 characters." };
  }
  if (!password || password.length < 4) {
    return { success: false, error: "Security password must be at least 4 characters." };
  }

  const accounts = getRegisteredAccounts();
  if (accounts[cleanUsername]) {
    return {
      success: false,
      error: `Callsign "${cleanUsername}" is already taken. Please choose another username.`,
    };
  }

  const preset = AVATAR_PRESETS.find((a) => a.id === avatarId) || AVATAR_PRESETS[2];
  const newAccount: RegisteredAccount = {
    id: `user-${Date.now()}`,
    username: cleanUsername,
    password,
    title,
    avatar: preset.id,
    avatarColor: preset.color,
    bio: `Neural arena operator. Certified ${title} division.`,
    rating: startingElo,
    bulletRating: startingElo - 40,
    blitzRating: startingElo,
    rapidRating: startingElo + 25,
    classicalRating: startingElo + 50,
    peakRating: startingElo,
    joinedDate: "JUST NOW",
    isLoggedIn: true,
    aggressionIndex: 80,
    endgameConversion: 85,
    tacticalAccuracy: 86,
    openingDepth: 72,
  };

  accounts[cleanUsername] = newAccount;
  saveRegisteredAccounts(accounts);

  // Set active session
  const sessionUser: UserProfile = { ...newAccount };
  const serialized = JSON.stringify(sessionUser);
  cachedUserRaw = serialized;
  cachedUserProfile = sessionUser;
  localStorage.setItem(STORAGE_KEY_SESSION, serialized);
  authListeners.forEach((fn) => fn());

  return { success: true };
};

export const logoutUser = () => {
  const guest: UserProfile = {
    ...DEFAULT_USER,
    id: "guest-user",
    username: "GUEST_OPERATOR",
    title: "NONE",
    rating: 1200,
    isLoggedIn: false,
  };
  const serialized = JSON.stringify(guest);
  cachedUserRaw = serialized;
  cachedUserProfile = guest;
  localStorage.setItem(STORAGE_KEY_SESSION, serialized);
  authListeners.forEach((fn) => fn());
};

// Record match outcome into active profile and persistent registry
export const recordMatchOutcome = (
  result: "VICTORY" | "DEFEAT" | "DRAW" | "ABORTED",
  category: "BULLET" | "BLITZ" | "RAPID" | "CLASSICAL" | string = "BLITZ",
  accuracyStr: string = "92.4% CAPS"
) => {
  const current = getUserProfile();
  const eloDelta =
    result === "VICTORY" ? 8 : result === "DEFEAT" ? -7 : result === "ABORTED" ? 0 : 1;
  const newRating = Math.max(400, current.rating + eloDelta);
  const newPeak = Math.max(current.peakRating, newRating);

  const updates: Partial<UserProfile> = {
    rating: newRating,
    peakRating: newPeak,
  };

  if (category.includes("BULLET")) {
    updates.bulletRating = Math.max(400, current.bulletRating + eloDelta);
  } else if (category.includes("RAPID")) {
    updates.rapidRating = Math.max(400, current.rapidRating + eloDelta);
  } else if (category.includes("CLASSICAL")) {
    updates.classicalRating = Math.max(400, current.classicalRating + eloDelta);
  } else {
    updates.blitzRating = Math.max(400, current.blitzRating + eloDelta);
  }

  const accuracyNum = parseFloat(accuracyStr) || 90;
  updates.tacticalAccuracy = Math.round((current.tacticalAccuracy * 4 + accuracyNum) / 5);
  if (result === "VICTORY") {
    updates.endgameConversion = Math.min(99, current.endgameConversion + 1);
    updates.aggressionIndex = Math.min(98, current.aggressionIndex + 1);
  }

  updateUserProfile(updates);
};
