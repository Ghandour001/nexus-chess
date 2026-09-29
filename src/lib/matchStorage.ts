export interface SavedMatch {
  id: string;
  format: string;
  opponent: string;
  opponentRating: number;
  result: "VICTORY" | "DEFEAT" | "DRAW" | "ABORTED";
  eloChange: string;
  opening: string;
  accuracy: string;
  timestamp: string;
  moves: { san: string; evalStr: string }[];
}

const STORAGE_KEY = "nexus_chess_matches";

export const DEFAULT_MATCHES: SavedMatch[] = [
  {
    id: "nx-01",
    format: "BLITZ 3+2",
    opponent: "VALKYRIE-09",
    opponentRating: 2842,
    result: "VICTORY",
    eloChange: "+8 ELO",
    opening: "C84 Ruy Lopez",
    accuracy: "96.2% CAPS",
    timestamp: "TODAY, 14:22 UTC",
    moves: [],
  },
  {
    id: "nx-02",
    format: "BLITZ 3+2",
    opponent: "MAGNUS_CORE",
    opponentRating: 2915,
    result: "DEFEAT",
    eloChange: "-7 ELO",
    opening: "B90 Sicilian",
    accuracy: "92.4% CAPS",
    timestamp: "YESTERDAY, 21:05 UTC",
    moves: [],
  },
];

let cachedRaw: string | null = null;
let cachedMatches: SavedMatch[] = DEFAULT_MATCHES;

export const getStoredMatches = (): SavedMatch[] => {
  if (typeof window === "undefined") return DEFAULT_MATCHES;
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    return DEFAULT_MATCHES;
  }
  if (data !== cachedRaw) {
    cachedRaw = data;
    try {
      cachedMatches = JSON.parse(data);
    } catch {
      cachedMatches = DEFAULT_MATCHES;
    }
  }
  return cachedMatches;
};

const listeners = new Set<() => void>();

export const subscribeMatches = (onStoreChange: () => void) => {
  listeners.add(onStoreChange);
  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      cachedRaw = null;
      onStoreChange();
    }
  };
  window.addEventListener("storage", handleStorage);
  return () => {
    listeners.delete(onStoreChange);
    window.removeEventListener("storage", handleStorage);
  };
};

export const saveMatch = (match: SavedMatch) => {
  if (typeof window === "undefined") return;
  const current = getStoredMatches();
  const updated = [match, ...current];
  const serialized = JSON.stringify(updated);
  cachedRaw = serialized;
  cachedMatches = updated;
  localStorage.setItem(STORAGE_KEY, serialized);
  listeners.forEach((listener) => listener());
};

const emptySnapshot: SavedMatch[] = [];
export const getMatchesServerSnapshot = (): SavedMatch[] => emptySnapshot;