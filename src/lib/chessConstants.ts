export interface TimeControl {
  id: string;
  name: string;
  category: "BULLET" | "BLITZ" | "RAPID" | "CLASSICAL";
  baseMinutes: number;
  incrementSeconds: number;
  timeLabel: string;
  desc: string;
}

export interface EngineBot {
  id: string;
  name: string;
  level: number; // 1 to 20
  elo: number;
  skillLevel: number; // 0 to 20 UCI Skill Level
  depth: number;
  moveTimeMs: number;
  title: string;
  category: "NOVICE" | "TACTICAL" | "EXPERT" | "GRANDMASTER";
  avatarColor: string;
  desc: string;
}

// 1. Time Controls
export const ALL_TIME_CONTROLS: TimeControl[] = [
  // Bullet
  { id: "1+0", name: "Hyper Bullet", category: "BULLET", baseMinutes: 1, incrementSeconds: 0, timeLabel: "1 + 0", desc: "Twitch speed reflexes" },
  { id: "1+1", name: "Bullet Increment", category: "BULLET", baseMinutes: 1, incrementSeconds: 1, timeLabel: "1 + 1", desc: "Anti-flagging sprint" },
  { id: "2+1", name: "Dynamic Bullet", category: "BULLET", baseMinutes: 2, incrementSeconds: 1, timeLabel: "2 + 1", desc: "Quick tactical conversion" },

  // Blitz
  { id: "3+0", name: "Classic Blitz", category: "BLITZ", baseMinutes: 3, incrementSeconds: 0, timeLabel: "3 + 0", desc: "Pure scramble friction" },
  { id: "3+2", name: "Arena Blitz", category: "BLITZ", baseMinutes: 3, incrementSeconds: 2, timeLabel: "3 + 2", desc: "Official tournament standard" },
  { id: "5+0", name: "Five Minute Blitz", category: "BLITZ", baseMinutes: 5, incrementSeconds: 0, timeLabel: "5 + 0", desc: "Solid tactical depth" },
  { id: "5+3", name: "Master Blitz", category: "BLITZ", baseMinutes: 5, incrementSeconds: 3, timeLabel: "5 + 3", desc: "Deep conversion margin" },

  // Rapid
  { id: "10+0", name: "Rapid Standard", category: "RAPID", baseMinutes: 10, incrementSeconds: 0, timeLabel: "10 + 0", desc: "Positional calculation" },
  { id: "15+10", name: "Precision Rapid", category: "RAPID", baseMinutes: 15, incrementSeconds: 10, timeLabel: "15 + 10", desc: "Ample strategic windows" },
  { id: "30+0", name: "Classical Rapid", category: "RAPID", baseMinutes: 30, incrementSeconds: 0, timeLabel: "30 + 0", desc: "Endgame maneuvering" },

  // Classical
  { id: "60+0", name: "Classical Hour", category: "CLASSICAL", baseMinutes: 60, incrementSeconds: 0, timeLabel: "60 + 0", desc: "Deep tournament preparation" },
  { id: "90+30", name: "FIDE Standard", category: "CLASSICAL", baseMinutes: 90, incrementSeconds: 30, timeLabel: "90 + 30", desc: "Full championship pacing" },
];

// 2. Full 20 Engine Bot Tiers (Skill 1 to 20, ELO 800 to 3500+)
export const ENGINE_BOTS: EngineBot[] = [
  // ── NOVICE TIER (1-5) ──
  {
    id: "lvl-1",
    name: "NEO_ROOKIE",
    level: 1,
    skillLevel: 1,
    elo: 800,
    depth: 3,
    moveTimeMs: 200,
    title: "NOVICE I",
    category: "NOVICE",
    avatarColor: "#6FFBBE",
    desc: "Frequent hanging piece blunders and simple single-move focus.",
  },
  {
    id: "lvl-2",
    name: "SPROUT_CORE",
    level: 2,
    skillLevel: 2,
    elo: 920,
    depth: 3,
    moveTimeMs: 250,
    title: "NOVICE II",
    category: "NOVICE",
    avatarColor: "#57E8AE",
    desc: "Understands piece captures; prone to early queen traps.",
  },
  {
    id: "lvl-3",
    name: "BIT_RUNNER",
    level: 3,
    skillLevel: 3,
    elo: 1050,
    depth: 4,
    moveTimeMs: 300,
    title: "CADET I",
    category: "NOVICE",
    avatarColor: "#4EDEA3",
    desc: "Plays basic opening moves; struggles with knight forks.",
  },
  {
    id: "lvl-4",
    name: "PULSE_CADET",
    level: 4,
    skillLevel: 4,
    elo: 1180,
    depth: 4,
    moveTimeMs: 350,
    title: "CADET II",
    category: "NOVICE",
    avatarColor: "#3DD498",
    desc: "Solid center development; occasional back-rank vulnerability.",
  },
  {
    id: "lvl-5",
    name: "VECTOR_BOT",
    level: 5,
    skillLevel: 5,
    elo: 1300,
    depth: 5,
    moveTimeMs: 400,
    title: "APPRENTICE",
    category: "NOVICE",
    avatarColor: "#30C990",
    desc: "Identifies basic pins and skewers; susceptible to pawn storm attacks.",
  },

  // ── TACTICAL TIER (6-10) ──
  {
    id: "lvl-6",
    name: "GRID_DEFENDER",
    level: 6,
    skillLevel: 6,
    elo: 1420,
    depth: 5,
    moveTimeMs: 400,
    title: "CLUB I",
    category: "TACTICAL",
    avatarColor: "#00F2FF",
    desc: "Aggressive wing player with keen eye for unprotected pieces.",
  },
  {
    id: "lvl-7",
    name: "CIPHER_SCOUT",
    level: 7,
    skillLevel: 7,
    elo: 1540,
    depth: 6,
    moveTimeMs: 450,
    title: "CLUB II",
    category: "TACTICAL",
    avatarColor: "#00D8F0",
    desc: "Standard book openings; solid minor piece coordination.",
  },
  {
    id: "lvl-8",
    name: "QUANTUM_AGENT",
    level: 8,
    skillLevel: 8,
    elo: 1660,
    depth: 7,
    moveTimeMs: 500,
    title: "TACTICIAN",
    category: "TACTICAL",
    avatarColor: "#00BCE0",
    desc: "Calculates 2-3 moves deep; defends checks and counter-attacks.",
  },
  {
    id: "lvl-9",
    name: "LOGIC_PHANTOM",
    level: 9,
    skillLevel: 9,
    elo: 1780,
    depth: 8,
    moveTimeMs: 500,
    title: "INTERMEDIATE",
    category: "TACTICAL",
    avatarColor: "#38BDF8",
    desc: "Prefers active piece play and open diagonals for bishops.",
  },
  {
    id: "lvl-10",
    name: "SUBNET_STRIKER",
    level: 10,
    skillLevel: 10,
    elo: 1900,
    depth: 9,
    moveTimeMs: 550,
    title: "ADVANCED",
    category: "TACTICAL",
    avatarColor: "#60A5FA",
    desc: "Strong tactical punishment of uncastled kings; steady calculation.",
  },

  // ── EXPERT TIER (11-15) ──
  {
    id: "lvl-11",
    name: "CYBER_SENTINEL",
    level: 11,
    skillLevel: 11,
    elo: 2020,
    depth: 10,
    moveTimeMs: 600,
    title: "EXPERT I",
    category: "EXPERT",
    avatarColor: "#818CF8",
    desc: "Accurate rook endgames and subtle positional strangulation.",
  },
  {
    id: "lvl-12",
    name: "MATRIX_WARDEN",
    level: 12,
    skillLevel: 12,
    elo: 2150,
    depth: 11,
    moveTimeMs: 600,
    title: "EXPERT II",
    category: "EXPERT",
    avatarColor: "#A78BFA",
    desc: "Deep knowledge of pawn structures and pawn breaks.",
  },
  {
    id: "lvl-13",
    name: "NEURAL_KNIGHT",
    level: 13,
    skillLevel: 13,
    elo: 2280,
    depth: 12,
    moveTimeMs: 650,
    title: "CANDIDATE MASTER",
    category: "EXPERT",
    avatarColor: "#C084FC",
    desc: "Precise calculation in complex double-edged tactical scrambles.",
  },
  {
    id: "lvl-14",
    name: "APEX_TACTICIAN",
    level: 14,
    skillLevel: 14,
    elo: 2400,
    depth: 13,
    moveTimeMs: 700,
    title: "FIDE MASTER",
    category: "EXPERT",
    avatarColor: "#DDB7FF",
    desc: "Virtually zero simple tactical oversights; sharp king safety.",
  },
  {
    id: "lvl-15",
    name: "VALKYRIE-09",
    level: 15,
    skillLevel: 15,
    elo: 2550,
    depth: 14,
    moveTimeMs: 750,
    title: "IM CORE",
    category: "EXPERT",
    avatarColor: "#F472B6",
    desc: "Ruthless tactical sharpness with NNUE positional evaluation.",
  },

  // ── GRANDMASTER TIER (16-20) ──
  {
    id: "lvl-16",
    name: "SYNAPSE_OVERLORD",
    level: 16,
    skillLevel: 16,
    elo: 2700,
    depth: 15,
    moveTimeMs: 800,
    title: "GRANDMASTER I",
    category: "GRANDMASTER",
    avatarColor: "#FB7185",
    desc: "World-class endgame technique and impenetrable defensive resilience.",
  },
  {
    id: "lvl-17",
    name: "CHRONOS_PRIME",
    level: 17,
    skillLevel: 17,
    elo: 2880,
    depth: 16,
    moveTimeMs: 850,
    title: "GRANDMASTER II",
    category: "GRANDMASTER",
    avatarColor: "#F43F5E",
    desc: "Ruthless prophylactic mastery; snuffs out counterplay before it begins.",
  },
  {
    id: "lvl-18",
    name: "DEEP_NEXUS",
    level: 18,
    skillLevel: 18,
    elo: 3050,
    depth: 17,
    moveTimeMs: 900,
    title: "SUPER GM",
    category: "GRANDMASTER",
    avatarColor: "#E11D48",
    desc: "Superhuman piece harmony and dynamic speculative piece sacrifices.",
  },
  {
    id: "lvl-19",
    name: "ZERO_ZENITH",
    level: 19,
    skillLevel: 19,
    elo: 3250,
    depth: 18,
    moveTimeMs: 950,
    title: "WORLD TITAN",
    category: "GRANDMASTER",
    avatarColor: "#FB923C",
    desc: "Near-flawless engine precision across all phases of the contest.",
  },
  {
    id: "lvl-20",
    name: "STOCKFISH MAX",
    level: 20,
    skillLevel: 20,
    elo: 3500,
    depth: 20,
    moveTimeMs: 1000,
    title: "OMNISCIENT NNUE",
    category: "GRANDMASTER",
    avatarColor: "#FBBF24",
    desc: "Full unconstrained NNUE depth. Infallible calculation and endgame tablebases.",
  },
];

// Helper to look up bot by id (with legacy fallback aliases)
export function getBotById(id: string): EngineBot {
  const legacyAliases: Record<string, string> = {
    sprout: "lvl-1",
    cadet: "lvl-4",
    agent: "lvl-8",
    sentinel: "lvl-11",
    valkyrie: "lvl-15",
    stockfish_max: "lvl-20",
  };

  const targetId = legacyAliases[id] || id;
  const found = ENGINE_BOTS.find((b) => b.id === targetId);
  return found || ENGINE_BOTS[14]; // Default to Valkyrie-09 (Level 15)
}