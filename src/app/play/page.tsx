"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
  Suspense,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Chess, Square, PieceSymbol } from "chess.js";
import {
  Brain,
  RotateCcw,
  PlusCircle,
  Flag,
  Award,
  AlertCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Shield,
  Volume2,
  VolumeX,
  Radio,
  Cpu,
  Crown,
  Zap,
  Flame,
  Bot,
  Play as PlayIcon,
  Copy,
  Activity,
  Layers,
  MessageSquare,
  Send,
  Info,
  Swords,
  Timer,
} from "lucide-react";
import { saveMatch, SavedMatch } from "@/lib/matchStorage";
import {
  getUserProfile,
  subscribeUser,
  getUserServerSnapshot,
  recordMatchOutcome,
} from "@/lib/authStorage";
import { sfx } from "@/lib/soundFx";
import { StockfishEngine } from "@/lib/stockfishEngine";
import {
  ALL_TIME_CONTROLS,
  EngineBot,
  TimeControl,
  getBotById,
} from "@/lib/chessConstants";
import { ChessPieceSVG } from "@/components/ChessPieceSVG";

const PIECE_VALUES: Record<PieceSymbol, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

export interface ChatMessage {
  id: string;
  sender: "user" | "bot" | "system";
  text: string;
  timestamp: string;
  badge?: string;
}

const QUICK_CHIPS = [
  "Good luck! ⚔️",
  "Nice move! 💡",
  "Well played! 👏",
  "Checkmate? 👑",
  "Good game! 🤝",
  "Rematch! 🔁",
];

function detectOpening(moves: { san: string }[]): { name: string; eco: string } {
  const pgnMoves = moves.map((m) => m.san).join(" ");
  if (!pgnMoves) return { name: "Standard Starting Position", eco: "A00" };

  if (pgnMoves.startsWith("e4 e5 Nf3 Nc6 Bb5 a6")) return { name: "Ruy Lopez: Morphy Defense", eco: "C70" };
  if (pgnMoves.startsWith("e4 e5 Nf3 Nc6 Bb5")) return { name: "Ruy Lopez (Spanish Opening)", eco: "C60" };
  if (pgnMoves.startsWith("e4 e5 Nf3 Nc6 Bc4 Bc5")) return { name: "Italian Game: Giuoco Piano", eco: "C50" };
  if (pgnMoves.startsWith("e4 e5 Nf3 Nc6 Bc4 Nf6")) return { name: "Two Knights Defense", eco: "C55" };
  if (pgnMoves.startsWith("e4 e5 Nf3 Nc6 Bc4")) return { name: "Italian Game", eco: "C50" };
  if (pgnMoves.startsWith("e4 e5 Nf3 Nc6 d4")) return { name: "Scotch Game", eco: "C44" };
  if (pgnMoves.startsWith("e4 e5 Nf3 d6")) return { name: "Philidor Defense", eco: "C41" };
  if (pgnMoves.startsWith("e4 e5 Nf3 Nf6")) return { name: "Petrov's Defense", eco: "C42" };
  if (pgnMoves.startsWith("e4 e5 f4")) return { name: "King's Gambit", eco: "C30" };
  if (pgnMoves.startsWith("e4 e5 Nc3")) return { name: "Vienna Game", eco: "C25" };
  if (pgnMoves.startsWith("e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6")) return { name: "Sicilian: Najdorf", eco: "B90" };
  if (pgnMoves.startsWith("e4 c5 Nf3 Nc6")) return { name: "Sicilian: Old Sicilian", eco: "B30" };
  if (pgnMoves.startsWith("e4 c5 Nf3 e6")) return { name: "Sicilian: French Variation", eco: "B40" };
  if (pgnMoves.startsWith("e4 c5 Nf3 d6")) return { name: "Sicilian Defense: Modern", eco: "B50" };
  if (pgnMoves.startsWith("e4 c5")) return { name: "Sicilian Defense", eco: "B20" };
  if (pgnMoves.startsWith("e4 e6 d4 d5")) return { name: "French Defense: Classical", eco: "C10" };
  if (pgnMoves.startsWith("e4 e6")) return { name: "French Defense", eco: "C00" };
  if (pgnMoves.startsWith("e4 c6 d4 d5")) return { name: "Caro-Kann: Main Line", eco: "B12" };
  if (pgnMoves.startsWith("e4 c6")) return { name: "Caro-Kann Defense", eco: "B10" };
  if (pgnMoves.startsWith("e4 d5")) return { name: "Scandinavian Defense", eco: "B01" };
  if (pgnMoves.startsWith("e4 Nf6")) return { name: "Alekhine's Defense", eco: "B02" };
  if (pgnMoves.startsWith("e4 g6")) return { name: "Modern Defense", eco: "B06" };
  if (pgnMoves.startsWith("d4 d5 c4 e6")) return { name: "Queen's Gambit Declined", eco: "D30" };
  if (pgnMoves.startsWith("d4 d5 c4 dxc4")) return { name: "Queen's Gambit Accepted", eco: "D20" };
  if (pgnMoves.startsWith("d4 d5 c4 c6")) return { name: "Slav Defense", eco: "D10" };
  if (pgnMoves.startsWith("d4 d5 c4")) return { name: "Queen's Gambit", eco: "D06" };
  if (pgnMoves.startsWith("d4 Nf6 c4 g6 Nc3 Bg7")) return { name: "King's Indian Defense", eco: "E60" };
  if (pgnMoves.startsWith("d4 Nf6 c4 g6")) return { name: "King's Indian / Grünfeld", eco: "E60" };
  if (pgnMoves.startsWith("d4 Nf6 c4 e6")) return { name: "Nimzo / Bogo-Indian", eco: "E00" };
  if (pgnMoves.startsWith("d4 Nf6 Bf4")) return { name: "London System", eco: "D02" };
  if (pgnMoves.startsWith("d4 d5 Bf4")) return { name: "London System", eco: "D00" };
  if (pgnMoves.startsWith("d4 Nf6")) return { name: "Indian Defense", eco: "A45" };
  if (pgnMoves.startsWith("d4 d5")) return { name: "Queen's Pawn Game", eco: "D00" };
  if (pgnMoves.startsWith("c4 e5")) return { name: "English: King's English", eco: "A20" };
  if (pgnMoves.startsWith("c4")) return { name: "English Opening", eco: "A10" };
  if (pgnMoves.startsWith("Nf3 d5")) return { name: "Réti Opening", eco: "A06" };
  if (pgnMoves.startsWith("Nf3")) return { name: "Zukertort Opening", eco: "A04" };
  if (pgnMoves.startsWith("e4 e5")) return { name: "Open Game (King's Pawn)", eco: "C20" };
  if (pgnMoves.startsWith("e4")) return { name: "King's Pawn Opening", eco: "B00" };
  if (pgnMoves.startsWith("d4")) return { name: "Queen's Pawn Opening", eco: "A40" };

  return { name: "Tactical Position", eco: "A00" };
}

function TacticalPlayArea() {
  const searchParams = useSearchParams();
  const rawTime = searchParams.get("time") || "3+2";
  const normalizedTime = rawTime.replace(/\s+/g, "+");
  const botParam = searchParams.get("bot") || "lvl-20";

  // Reactive current user profile
  const user = useSyncExternalStore(
    subscribeUser,
    getUserProfile,
    getUserServerSnapshot
  );

  // Time control & Bot configuration
  const chosenTimeControl: TimeControl = useMemo(() => {
    return (
      ALL_TIME_CONTROLS.find(
        (tc) => tc.id === normalizedTime || tc.id === rawTime
      ) || ALL_TIME_CONTROLS[4]
    );
  }, [normalizedTime, rawTime]);

  const chosenBot: EngineBot = useMemo(() => {
    return getBotById(botParam);
  }, [botParam]);

  // Game state
  const gameRef = useRef<Chess>(new Chess());
  const [board, setBoard] = useState(() => new Chess().board());
  const [fen, setFen] = useState(
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
  );
  const turn = useMemo(() => (fen.split(" ")[1] as "w" | "b") || "w", [fen]);

  // Selection & drag state
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<string[]>([]);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [draggedSquare, setDraggedSquare] = useState<Square | null>(null);
  const [dragOverSquare, setDragOverSquare] = useState<Square | null>(null);

  // Tab state: "notation" | "info" | "chat" | "telemetry"
  const [activeTab, setActiveTab] = useState<"notation" | "info" | "chat" | "telemetry">("notation");

  // Move history & navigation stepper
  const [moveHistory, setMoveHistory] = useState<
    { san: string; from: Square; to: Square; fenAfter: string }[]
  >([]);
  const [viewingPly, setViewingPly] = useState<number | null>(null);

  // Perspective & settings
  const [is3D, setIs3D] = useState(false);
  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const [isEngineThinking, setIsEngineThinking] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Clocks
  const [whiteTime, setWhiteTime] = useState(chosenTimeControl.baseMinutes * 60);
  const [blackTime, setBlackTime] = useState(chosenTimeControl.baseMinutes * 60);

  // First Move Grace (3s) & Auto-Abort (60s) Deadline Timers
  const [whiteGrace, setWhiteGrace] = useState(3);
  const [whiteAbortSeconds, setWhiteAbortSeconds] = useState(60);
  const [blackGrace, setBlackGrace] = useState(3);
  const [blackAbortSeconds, setBlackAbortSeconds] = useState(60);
  const [isBotAfkSimulated, setIsBotAfkSimulated] = useState(false);

  // Game termination state
  const [matchEnded, setMatchEnded] = useState<{
    result: "VICTORY" | "DEFEAT" | "DRAW" | "ABORTED";
    reason: string;
    eloChange: string;
  } | null>(null);

  const hasSaved = useRef(false);
  const engineRef = useRef<StockfishEngine | null>(null);
  const moveListRef = useRef<HTMLDivElement>(null);

  // In-Game Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => [
    {
      id: "init-1",
      sender: "system",
      text: `Tactical engagement initialized: ${chosenTimeControl.name} (${chosenTimeControl.timeLabel}) vs ${chosenBot.name} [${chosenBot.elo} ELO]`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
    {
      id: "init-2",
      sender: "bot",
      text:
        chosenBot.level >= 15
          ? `Greetings, operator. I am ${chosenBot.name} (${chosenBot.title}). My neural network is ready at depth ${chosenBot.depth}. Let us see your tactical preparation.`
          : `Hello! I'm ${chosenBot.name}. Looking forward to a great match! Have fun!`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (activeTab === "chat" && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, isBotTyping, activeTab]);

  const addChatMessage = useCallback(
    (sender: "user" | "bot" | "system", text: string, badge?: string) => {
      const timeStr = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      setChatMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          sender,
          text,
          timestamp: timeStr,
          badge,
        },
      ]);
      setActiveTab((currTab) => {
        if (currTab !== "chat" && sender !== "user") {
          setUnreadChatCount((count) => count + 1);
        }
        return currTab;
      });
    },
    []
  );

  const handleSendMessage = useCallback(
    (customText?: string) => {
      const text = (customText || chatInput).trim();
      if (!text) return;

      addChatMessage("user", text);
      if (!customText) setChatInput("");

      if (!isSoundMuted) {
        sfx.playMove();
      }

      setIsBotTyping(true);
      const lower = text.toLowerCase();

      setTimeout(() => {
        setIsBotTyping(false);
        let botReply = "";

        if (
          lower.includes("hello") ||
          lower.includes("hi") ||
          lower.includes("hey") ||
          lower.includes("مرحبا") ||
          lower.includes("سلام") ||
          lower.includes("اهلا")
        ) {
          botReply =
            chosenBot.level >= 15
              ? `Greetings. My evaluation indicates an intense match ahead. Focus on your piece coordination.`
              : `Hello there! Glad to play with you. Let's see your tactical vision! ♟️`;
        } else if (
          lower.includes("good luck") ||
          lower.includes("gl") ||
          lower.includes("بالتوفيق") ||
          lower.includes("حظ موفق")
        ) {
          botReply = `Thank you, operator. May the sharpest calculations prevail on the board! ⚔️`;
        } else if (
          lower.includes("nice move") ||
          lower.includes("good move") ||
          lower.includes("well played") ||
          lower.includes("حلوة") ||
          lower.includes("جامدة") ||
          lower.includes("روعة")
        ) {
          botReply =
            chosenBot.level >= 15
              ? `Calculated to depth ${chosenBot.depth}. Thank you for the compliment, operator.`
              : `Thanks! I've been studying grandmaster games! 💡`;
        } else if (
          lower.includes("gg") ||
          lower.includes("good game") ||
          lower.includes("لعبة حلوة") ||
          lower.includes("شكرا") ||
          lower.includes("thanks")
        ) {
          botReply = `Good game! An instructive encounter with interesting tactical motifs. 🤝`;
        } else if (
          lower.includes("checkmate") ||
          lower.includes("كش") ||
          lower.includes("مات")
        ) {
          botReply = `The position is razor sharp. Every single tempo counts right now! 👑`;
        } else if (
          lower.includes("rematch") ||
          lower.includes("نعيد") ||
          lower.includes("تاني")
        ) {
          botReply = `Always ready for another engagement. Hit the reset button whenever you wish! 🔁`;
        } else if (
          lower.includes("blunder") ||
          lower.includes("غلطت") ||
          lower.includes("mistake")
        ) {
          botReply = `Even grandmasters blunder under time pressure. Fight on until the end! 🛡️`;
        } else {
          const highBotQuotes = [
            `Position evaluated at depth ${chosenBot.depth}. My nodes detect subtle tension in the center.`,
            `An intriguing strategic choice. Let us see how your pawn chain develops.`,
            `Tactical calculation ongoing. Keep your king safe and pieces active.`,
            `The board state is complex. Every move shifts the evaluation curve.`,
          ];
          const midBotQuotes = [
            `I'm analyzing the board carefully. Don't leave any pieces unprotected! 🎯`,
            `Solid move! I need to be careful with my king safety.`,
            `A tactical fight in the center! Let's see who breaks through first.`,
            `Interesting attempt! My neural engine is evaluating the counter-play.`,
          ];
          const quotes = chosenBot.level >= 12 ? highBotQuotes : midBotQuotes;
          botReply = quotes[Math.floor(Math.random() * quotes.length)];
        }

        addChatMessage("bot", botReply);
        if (!isSoundMuted) {
          sfx.playCheck();
        }
      }, 600 + Math.random() * 500);
    },
    [chatInput, isSoundMuted, chosenBot, addChatMessage]
  );

  const addLog = useCallback(
    (type: string, message: string) => {
      if (type === "alert") {
        addChatMessage("system", message, "ALERT");
      } else if (type === "system") {
        addChatMessage("system", message);
      }
    },
    [addChatMessage]
  );

  // Dynamic detected opening
  const detectedOpening = useMemo(
    () => detectOpening(moveHistory),
    [moveHistory]
  );

  // FEN tactical state inspection
  const fenParts = fen.split(" ");
  const whiteCanCastleK = fenParts[2]?.includes("K") ?? false;
  const whiteCanCastleQ = fenParts[2]?.includes("Q") ?? false;
  const blackCanCastleK = fenParts[2]?.includes("k") ?? false;
  const blackCanCastleQ = fenParts[2]?.includes("q") ?? false;
  const enPassantSquare = fenParts[3] && fenParts[3] !== "-" ? fenParts[3] : null;
  const halfmoveClock = fenParts[4] || "0";
  const isInCheck = useMemo(() => {
    try {
      return new Chess(fen).inCheck();
    } catch {
      return false;
    }
  }, [fen]);

  // Initialize Stockfish with local worker
  useEffect(() => {
    const engine = new StockfishEngine();
    engine.init();
    engine.setDifficulty(chosenBot.elo, chosenBot.skillLevel);
    engineRef.current = engine;
    return () => {
      engine.terminate();
    };
  }, [chosenBot]);

  // Auto-scroll move list
  useEffect(() => {
    if (moveListRef.current) {
      moveListRef.current.scrollTop = moveListRef.current.scrollHeight;
    }
  }, [moveHistory]);

  // Active displayed board (historical if inspecting, live otherwise)
  const displayBoard = useMemo(() => {
    if (viewingPly === null || viewingPly >= moveHistory.length) {
      return board;
    }
    const tempGame = new Chess();
    for (let i = 0; i <= viewingPly && i < moveHistory.length; i++) {
      try {
        tempGame.move(moveHistory[i].san);
      } catch {}
    }
    return tempGame.board();
  }, [board, viewingPly, moveHistory]);

  const isInspectingHistory =
    viewingPly !== null && viewingPly < moveHistory.length - 1;

  // Material calculation & captured pieces
  const { capturedByWhite, capturedByBlack, materialDiff } = useMemo(() => {
    const fullSet = { p: 8, n: 2, b: 2, r: 2, q: 1 };
    const currentCounts = {
      w: { p: 0, n: 0, b: 0, r: 0, q: 0 },
      b: { p: 0, n: 0, b: 0, r: 0, q: 0 },
    };

    board.forEach((row) => {
      row.forEach((cell) => {
        if (cell && cell.type !== "k") currentCounts[cell.color][cell.type]++;
      });
    });

    const capWhite: PieceSymbol[] = [];
    const capBlack: PieceSymbol[] = [];
    let whiteScore = 0;
    let blackScore = 0;

    (Object.keys(fullSet) as (keyof typeof fullSet)[]).forEach((type) => {
      const missingBlack = fullSet[type] - currentCounts.b[type];
      for (let i = 0; i < missingBlack; i++) capWhite.push(type);
      const missingWhite = fullSet[type] - currentCounts.w[type];
      for (let i = 0; i < missingWhite; i++) capBlack.push(type);
      whiteScore += currentCounts.w[type] * PIECE_VALUES[type];
      blackScore += currentCounts.b[type] * PIECE_VALUES[type];
    });

    return {
      capturedByWhite: capWhite,
      capturedByBlack: capBlack,
      materialDiff: whiteScore - blackScore,
    };
  }, [board]);

  // Match ending handler
  const triggerEndGame = useCallback(
    (result: "VICTORY" | "DEFEAT" | "DRAW" | "ABORTED", reason: string) => {
      if (hasSaved.current) return;
      hasSaved.current = true;
      setIsEngineThinking(false);

      if (!isSoundMuted) {
        if (result === "ABORTED") {
          sfx.playMove();
        } else {
          sfx.playGameOver(result === "VICTORY");
        }
      }

      const eloDelta =
        result === "VICTORY"
          ? "+8 ELO"
          : result === "DEFEAT"
          ? "-7 ELO"
          : result === "ABORTED"
          ? "0 ELO"
          : "+1 ELO";
      setMatchEnded({ result, reason, eloChange: eloDelta });
      addLog("alert", `Match Concluded: ${result} (${reason}). Delta: ${eloDelta}`);

      if (result === "ABORTED") {
        addChatMessage(
          "system",
          `⚠️ Match Aborted: ${reason}. Rating unchanged (0 ELO).`,
          "ABORT"
        );
      }

      // Save match to storage for analysis
      const newSavedMatch: SavedMatch = {
        id: `nx-${Date.now()}`,
        format: chosenTimeControl.name,
        opponent: chosenBot.name,
        opponentRating: chosenBot.elo,
        result,
        eloChange: eloDelta,
        opening: "Cyber Arena Protocol",
        accuracy: result === "VICTORY" ? "95.8% CAPS" : "88.4% CAPS",
        timestamp: "JUST NOW",
        moves: moveHistory.map((m) => ({ san: m.san, evalStr: "0.0" })),
      };
      saveMatch(newSavedMatch);

      // Record in auth profile
      recordMatchOutcome(
        result,
        chosenTimeControl.category,
        result === "VICTORY" ? "95.8% CAPS" : "88.4% CAPS"
      );
    },
    [chosenTimeControl, chosenBot, moveHistory, isSoundMuted, addLog, addChatMessage]
  );

  // Match countdown timer & First Move (3s grace + 60s abort) handler
  useEffect(() => {
    if (matchEnded) return;

    // Checkmate & Draw checks (applicable at any point)
    const game = gameRef.current;
    if (game.isCheckmate()) {
      const timer = setTimeout(() => {
        if (game.turn() === "b") {
          triggerEndGame("VICTORY", "CHECKMATE BY WHITE");
        } else {
          triggerEndGame("DEFEAT", "CHECKMATE BY BLACK");
        }
      }, 0);
      return () => clearTimeout(timer);
    }
    if (game.isDraw()) {
      const timer = setTimeout(() => {
        triggerEndGame("DRAW", "DRAW / STALEMATE");
      }, 0);
      return () => clearTimeout(timer);
    }

    // Phase 1: White's first move pending (moveHistory.length === 0)
    // Game clock does NOT decrease until White moves.
    // 3s grace countdown -> 60s abort timeout.
    if (moveHistory.length === 0) {
      const interval = setInterval(() => {
        setWhiteGrace((currGrace) => {
          if (currGrace > 0) {
            return currGrace - 1;
          }
          // 3s grace ended -> decrement whiteAbortSeconds
          setWhiteAbortSeconds((currAbort) => {
            if (currAbort <= 1) {
              triggerEndGame("ABORTED", "White failed to make first move in time (60s timeout)");
              return 0;
            }
            return currAbort - 1;
          });
          return 0;
        });
      }, 1000);
      return () => clearInterval(interval);
    }

    // Phase 2: Black's first move pending (moveHistory.length === 1)
    // 3s grace countdown after White's move -> 60s abort timeout + Black match clock decreasing.
    if (moveHistory.length === 1) {
      const interval = setInterval(() => {
        setBlackGrace((currGrace) => {
          if (currGrace > 0) {
            return currGrace - 1;
          }
          // 3s grace ended -> decrement blackAbortSeconds & black clock
          setBlackAbortSeconds((currAbort) => {
            if (currAbort <= 1) {
              triggerEndGame("ABORTED", "Black failed to make first move in time (60s timeout)");
              return 0;
            }
            return currAbort - 1;
          });
          setBlackTime((prev) => Math.max(0, prev - 1));
          return 0;
        });
      }, 1000);
      return () => clearInterval(interval);
    }

    // Phase 3: Both players made at least one move (moveHistory.length >= 2)
    // Standard alternating match clocks
    if (whiteTime <= 0) {
      const timer = setTimeout(() => triggerEndGame("DEFEAT", "WHITE TIME EXPIRED"), 0);
      return () => clearTimeout(timer);
    }
    if (blackTime <= 0) {
      const timer = setTimeout(() => triggerEndGame("VICTORY", "BLACK TIME EXPIRED"), 0);
      return () => clearTimeout(timer);
    }

    const interval = setInterval(() => {
      if (gameRef.current.turn() === "w") {
        setWhiteTime((prev) => {
          if (prev <= 1) {
            triggerEndGame("DEFEAT", "WHITE TIME EXPIRED");
            return 0;
          }
          return prev - 1;
        });
      } else {
        setBlackTime((prev) => {
          if (prev <= 1) {
            triggerEndGame("VICTORY", "BLACK TIME EXPIRED");
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [fen, whiteTime, blackTime, matchEnded, triggerEndGame, moveHistory.length]);

  // Execute UCI move for Black (AI Bot)
  const executeEngineMove = useCallback(
    (uci: string) => {
      const game = gameRef.current;
      if (matchEnded || game.turn() !== "b" || uci.length < 4 || isBotAfkSimulated) {
        setIsEngineThinking(false);
        return;
      }

      const from = uci.substring(0, 2) as Square;
      const to = uci.substring(2, 4) as Square;
      const promotion = uci.length > 4 ? uci[4] : undefined;

      const destPiece = game.get(to);
      const move = game.move({ from, to, promotion });

      setIsEngineThinking(false);

      if (move) {
        if (!isSoundMuted) {
          if (destPiece) sfx.playCapture();
          else sfx.playMove();
          if (game.inCheck()) setTimeout(() => sfx.playCheck(), 120);
        }

        // Increment for Black
        setBlackTime((prev) => prev + chosenTimeControl.incrementSeconds);

        setMoveHistory((prev) => [
          ...prev,
          { san: move.san, from, to, fenAfter: game.fen() },
        ]);
        setLastMove({ from, to });
        setBoard(game.board());
        setFen(game.fen());
        setViewingPly(null);

        addLog("engine", `${chosenBot.name} calculated ${move.san} (${from} → ${to}).`);
      }
    },
    [matchEnded, isSoundMuted, chosenTimeControl.incrementSeconds, chosenBot, addLog, isBotAfkSimulated]
  );

  // Execute player move from `from` to `to`
  const handleExecuteMove = useCallback(
    (fromSquare: Square, toSquare: Square) => {
      if (matchEnded || gameRef.current.turn() !== "w") return false;

      // Resume live view if player was inspecting history
      setViewingPly(null);

      const game = gameRef.current;
      const destPiece = game.get(toSquare);

      try {
        const move = game.move({
          from: fromSquare,
          to: toSquare,
          promotion: "q",
        });

        if (move) {
          if (!isSoundMuted) {
            if (destPiece) sfx.playCapture();
            else sfx.playMove();
            if (game.inCheck()) setTimeout(() => sfx.playCheck(), 120);
          }

          // Increment for White
          setWhiteTime((prev) => prev + chosenTimeControl.incrementSeconds);

          setMoveHistory((prev) => [
            ...prev,
            { san: move.san, from: fromSquare, to: toSquare, fenAfter: game.fen() },
          ]);
          setLastMove({ from: fromSquare, to: toSquare });
          setSelectedSquare(null);
          setPossibleMoves([]);
          setBoard(game.board());
          setFen(game.fen());

          addLog("move", `White played ${move.san}.`);

          // If this was White's first move, initialize Black's 3s grace & 60s abort timeout
          const isWhiteFirstMove = moveHistory.length === 0;
          if (isWhiteFirstMove) {
            setBlackGrace(3);
            setBlackAbortSeconds(60);
          }

          // Trigger Engine AI response automatically (non-blocking async Web Worker)
          if (!game.isGameOver() && game.turn() === "b") {
            if (isBotAfkSimulated) {
              setIsEngineThinking(false);
              addLog("system", "Bot auto-move halted (Simulated AFK for first-move timeout test).");
            } else {
              setIsEngineThinking(true);
              const currentTurnFen = game.fen();
              // On Black's first move, give 3.4s delay to allow 3s grace + abort countdown display
              const minNaturalDelay = isWhiteFirstMove
                ? 3400
                : Math.min(Math.max(250, chosenBot.moveTimeMs / 2), 600);
              const searchStartTime = Date.now();

              engineRef.current?.searchMove(
                currentTurnFen,
                chosenBot.depth,
                (bestUci) => {
                  const elapsed = Date.now() - searchStartTime;
                  const remaining = Math.max(0, minNaturalDelay - elapsed);
                  if (remaining > 0) {
                    setTimeout(() => {
                      executeEngineMove(bestUci);
                    }, remaining);
                  } else {
                    executeEngineMove(bestUci);
                  }
                },
                chosenBot.skillLevel
              );
            }
          }
          return true;
        }
      } catch {
        setSelectedSquare(null);
        setPossibleMoves([]);
      }
      return false;
    },
    [matchEnded, isSoundMuted, chosenTimeControl.incrementSeconds, chosenBot, executeEngineMove, addLog, moveHistory.length, isBotAfkSimulated]
  );

  // Click-to-move handler
  const handleSquareClick = (square: Square) => {
    if (matchEnded || gameRef.current.turn() !== "w") return;
    const game = gameRef.current;
    const piece = game.get(square);

    if (selectedSquare && possibleMoves.includes(square)) {
      handleExecuteMove(selectedSquare, square);
      return;
    }

    if (piece && piece.color === "w") {
      setSelectedSquare(square);
      const legal = game.moves({ square, verbose: true }).map((m) => m.to);
      setPossibleMoves(legal);
      return;
    }

    setSelectedSquare(null);
    setPossibleMoves([]);
  };

  // Drag-and-drop handlers
  const handleDragStart = (e: React.DragEvent, square: Square) => {
    if (matchEnded || gameRef.current.turn() !== "w") {
      e.preventDefault();
      return;
    }
    const piece = gameRef.current.get(square);
    if (!piece || piece.color !== "w") {
      e.preventDefault();
      return;
    }

    setDraggedSquare(square);
    setSelectedSquare(square);
    const legal = gameRef.current.moves({ square, verbose: true }).map((m) => m.to);
    setPossibleMoves(legal);
    e.dataTransfer.setData("text/plain", square);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, square: Square) => {
    if (possibleMoves.includes(square)) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setDragOverSquare(square);
    }
  };

  const handleDragLeave = () => {
    setDragOverSquare(null);
  };

  const handleDrop = (e: React.DragEvent, targetSquare: Square) => {
    e.preventDefault();
    setDragOverSquare(null);
    const sourceSquare = draggedSquare || (e.dataTransfer.getData("text/plain") as Square);
    setDraggedSquare(null);

    if (sourceSquare && possibleMoves.includes(targetSquare)) {
      handleExecuteMove(sourceSquare, targetSquare);
    } else {
      setSelectedSquare(null);
      setPossibleMoves([]);
    }
  };

  // Stepper Navigation
  const stepFirst = () => setViewingPly(0);
  const stepPrev = () => {
    const cur = viewingPly ?? moveHistory.length - 1;
    setViewingPly(Math.max(0, cur - 1));
  };
  const stepNext = () => {
    if (viewingPly === null) return;
    if (viewingPly >= moveHistory.length - 1) {
      setViewingPly(null);
    } else {
      setViewingPly(viewingPly + 1);
    }
  };
  const stepLast = () => setViewingPly(null);

  // Copy PGN
  const handleCopyPGN = () => {
    const pgn = gameRef.current.pgn();
    navigator.clipboard.writeText(pgn || "1. e4");
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 1500);
  };

  // Undo move
  const handleUndoMove = () => {
    if (matchEnded) return;
    const game = gameRef.current;
    if (game.history().length === 0) return;

    game.undo();
    let undoneCount = 1;

    if (game.turn() === "b") {
      const u2 = game.undo();
      if (u2) undoneCount = 2;
    }

    const hist = game.history({ verbose: true });
    if (hist.length > 0) {
      const last = hist[hist.length - 1];
      setLastMove({ from: last.from as Square, to: last.to as Square });
    } else {
      setLastMove(null);
    }

    if (hist.length === 0) {
      setWhiteGrace(3);
      setWhiteAbortSeconds(60);
      setBlackGrace(3);
      setBlackAbortSeconds(60);
    } else if (hist.length === 1) {
      setBlackGrace(3);
      setBlackAbortSeconds(60);
    }

    setBoard(game.board());
    setFen(game.fen());
    setSelectedSquare(null);
    setPossibleMoves([]);
    setMoveHistory((prev) => prev.slice(0, -undoneCount));
    setViewingPly(null);
    if (!isSoundMuted) sfx.playMove();
    addLog("system", "Move undone by operator.");
  };

  // New Game handler
  const handleNewGame = () => {
    gameRef.current = new Chess();
    setBoard(gameRef.current.board());
    setFen(gameRef.current.fen());
    setSelectedSquare(null);
    setPossibleMoves([]);
    setLastMove(null);
    setMoveHistory([]);
    setViewingPly(null);
    setWhiteTime(chosenTimeControl.baseMinutes * 60);
    setBlackTime(chosenTimeControl.baseMinutes * 60);
    setWhiteGrace(3);
    setWhiteAbortSeconds(60);
    setBlackGrace(3);
    setBlackAbortSeconds(60);
    setIsBotAfkSimulated(false);
    setMatchEnded(null);
    setIsEngineThinking(false);
    hasSaved.current = false;
    addLog("system", "Reset board. Commencing new engagement.");
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
  const ranks = ["8", "7", "6", "5", "4", "3", "2", "1"];

  const renderUserAvatar = () => {
    switch (user.avatar) {
      case "neural-queen":
        return <Crown className="w-4 h-4" />;
      case "synth-knight":
        return <Shield className="w-4 h-4" />;
      case "matrix-rook":
        return <Zap className="w-4 h-4" />;
      case "quantum-titan":
        return <Flame className="w-4 h-4" />;
      case "zero-ghost":
        return <Bot className="w-4 h-4" />;
      default:
        return <Cpu className="w-4 h-4" />;
    }
  };

  return (
    <div
      className="text-[var(--nx-text-primary)] h-screen max-h-screen overflow-hidden flex flex-col select-none relative"
      style={{ backgroundColor: "#070A0F" }}
    >
      <div className="absolute inset-0 bg-grid-pattern opacity-15 pointer-events-none" />

      {/* ═══ COMPACT HEADER (48px) ═══ */}
      <header className="h-12 shrink-0 glass-subtle px-4 flex items-center justify-between z-40 relative border-b border-[var(--nx-border)]">
        <div className="flex items-center gap-2.5">
          <Link
            href="/"
            className="w-7 h-7 rounded-lg bg-[var(--nx-cyan)]/10 border border-[var(--nx-cyan)]/30 flex items-center justify-center text-[var(--nx-cyan)] hover:bg-[var(--nx-cyan)]/20 transition-all duration-200"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
          </Link>
          <div className="flex items-center gap-2.5">
            <span className="font-extrabold text-sm tracking-wider text-white">
              NEXUS <span className="text-[var(--nx-cyan)]">{"//"}</span> ARENA
            </span>
            <span className="nx-chip bg-[var(--nx-purple)]/20 text-[var(--nx-violet)] border border-[var(--nx-purple)]/30 text-xs font-sans font-semibold py-1 px-2.5">
              {chosenTimeControl.timeLabel} • {chosenBot.title} (LVL {chosenBot.level})
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5 ml-2 font-sans font-semibold text-xs">
              <span className="relative flex h-2 w-2">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    turn === "w" ? "bg-[var(--nx-cyan)]" : "bg-[var(--nx-purple)]"
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    turn === "w" ? "bg-[var(--nx-cyan)]" : "bg-[var(--nx-purple)]"
                  }`}
                />
              </span>
              <span className="text-[var(--nx-cyan-dim)] uppercase tracking-wide">
                {matchEnded
                  ? matchEnded.reason
                  : isEngineThinking
                  ? `${chosenBot.name} CALCULATING...`
                  : `${turn === "w" ? "YOUR" : chosenBot.name + "'S"} TURN`}
              </span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 font-sans text-xs">
          <nav className="hidden lg:flex items-center gap-1 bg-[var(--nx-bg-surface)]/80 p-0.5 rounded-lg border border-[var(--nx-border)] text-xs font-bold">
            <Link
              href="/"
              className="px-3 py-1 text-[var(--nx-text-muted)] hover:text-white transition-colors rounded-md"
            >
              LOBBY
            </Link>
            <Link
              href="/play"
              className="px-3 py-1 rounded-md bg-[var(--nx-bg-card)] text-[var(--nx-cyan)] font-extrabold border border-[var(--nx-cyan)]/30"
            >
              ARENA
            </Link>
            <Link
              href="/analysis"
              className="px-3 py-1 text-[var(--nx-text-muted)] hover:text-white transition-colors rounded-md"
            >
              ANALYSIS
            </Link>
            <Link
              href="/profile"
              className="px-3 py-1 text-[var(--nx-text-muted)] hover:text-white transition-colors rounded-md"
            >
              PROFILE
            </Link>
          </nav>

          <button
            onClick={() => setIsSoundMuted(!isSoundMuted)}
            className="w-8 h-8 rounded-lg bg-[var(--nx-bg-card)] border border-[var(--nx-border)] flex items-center justify-center text-[var(--nx-text-muted)] hover:text-white transition-colors"
            title={isSoundMuted ? "Unmute Sound" : "Mute Sound"}
          >
            {isSoundMuted ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>

          <button
            onClick={handleNewGame}
            className="nx-btn nx-btn-primary py-1.5 px-3 text-xs font-bold rounded-lg"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>NEW GAME</span>
          </button>
        </div>
      </header>

      {/* ═══ DYNAMIC SPLIT-SCREEN WORKSPACE (LOCKED 100vh ZERO-SCROLL) ═══ */}
      <main className="flex-1 min-h-0 px-3 md:px-5 py-2.5 grid grid-cols-12 gap-4 overflow-hidden relative z-10 max-w-[1720px] mx-auto w-full">
        {/* ═══ LEFT HALF (~60%): LARGE CHESSBOARD & PLAYER PANELS ═══ */}
        <section className="col-span-12 lg:col-span-7 xl:col-span-7 flex flex-col justify-between items-center h-full min-h-0 gap-1.5 relative">
          {/* Opponent Card (Black) */}
          <div className="w-full glass rounded-xl px-4 py-2.5 flex items-center justify-between shrink-0 border border-[var(--nx-border)]">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-lg bg-[var(--nx-bg-card)] border flex items-center justify-center shrink-0"
                style={{
                  borderColor: `${chosenBot.avatarColor}60`,
                  backgroundColor: `${chosenBot.avatarColor}15`,
                }}
              >
                <Brain className="w-5 h-5" style={{ color: chosenBot.avatarColor }} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base text-white font-sans">{chosenBot.name}</span>
                  <span
                    className="nx-chip text-xs font-sans font-bold py-0.5 px-2.5 rounded-md"
                    style={{
                      color: chosenBot.avatarColor,
                      backgroundColor: `${chosenBot.avatarColor}18`,
                    }}
                  >
                    LVL {chosenBot.level} • {chosenBot.elo} ELO
                  </span>
                </div>
                <div className="flex items-center gap-1 text-sm font-sans font-bold text-[var(--nx-violet)] mt-0.5">
                  {capturedByBlack.map((p, i) => (
                    <ChessPieceSVG key={i} type={p} color="w" size="xs" />
                  ))}
                  {materialDiff < 0 && (
                    <span className="text-[var(--nx-violet)] font-extrabold ml-1">
                      +{Math.abs(materialDiff)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Black Timer & Abort Indicator */}
            <div className="flex flex-col items-end gap-1">
              {moveHistory.length === 1 && !matchEnded && (
                <div className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-400 animate-pulse">
                  <Timer className="w-3 h-3" />
                  <span>
                    {blackGrace > 0
                      ? `STARTS IN ${blackGrace}s`
                      : `ABORT: 0:${blackAbortSeconds < 10 ? "0" : ""}${blackAbortSeconds}`}
                  </span>
                </div>
              )}
              <div
                className={`font-sans text-2xl md:text-3xl font-black tracking-tight px-4 py-1.5 rounded-xl border transition-all duration-300 ${
                  turn === "b" && !matchEnded
                    ? "bg-[var(--nx-purple)] text-black border-[var(--nx-violet)] shadow-[0_0_16px_rgba(168,85,247,0.5)]"
                    : "bg-[var(--nx-bg-card)] text-[var(--nx-violet)] border-[var(--nx-purple)]/30"
                }`}
              >
                {formatTime(blackTime)}
              </div>
            </div>
          </div>

          {/* Large Chessboard Viewport */}
          <div className="flex-1 min-h-0 w-full flex items-center justify-center relative overflow-hidden">
            {/* 2D Flat / 3D Tilt button */}
            <div className="absolute top-1 right-2 z-30 flex items-center glass p-0.5 rounded-lg border border-[var(--nx-border)]">
              <button
                type="button"
                onClick={() => setIs3D(false)}
                className={`px-3 py-1 text-xs uppercase font-bold rounded font-sans transition-all ${
                  !is3D
                    ? "bg-[var(--nx-cyan)] text-black shadow-[0_0_8px_rgba(0,242,255,0.4)]"
                    : "text-[var(--nx-text-muted)] hover:text-white"
                }`}
              >
                2D Flat
              </button>
              <button
                type="button"
                onClick={() => setIs3D(true)}
                className={`px-3 py-1 text-xs uppercase font-bold rounded font-sans transition-all ${
                  is3D
                    ? "bg-[var(--nx-cyan)] text-black shadow-[0_0_8px_rgba(0,242,255,0.4)]"
                    : "text-[var(--nx-text-muted)] hover:text-white"
                }`}
              >
                3D Tilt
              </button>
            </div>

            {/* 3D Wrapper */}
            <div
              className="relative flex items-center justify-center transition-all duration-500 ease-out"
              style={{
                perspective: is3D ? "1000px" : "none",
                perspectiveOrigin: "50% 65%",
              }}
            >
              {/* Luxury Board Frame */}
              <div
                className="relative rounded-2xl p-2.5 transition-transform duration-500 ease-out border-2 shadow-2xl"
                style={{
                  transform: is3D ? "rotateX(34deg) scale(0.96)" : "none",
                  transformStyle: is3D ? "preserve-3d" : "flat",
                  backgroundColor: "#0B0F19",
                  borderColor: "rgba(0, 242, 255, 0.35)",
                  boxShadow: is3D
                    ? "0 30px 70px rgba(0,0,0,0.95), 0 0 35px rgba(0,242,255,0.25)"
                    : "0 10px 40px rgba(0,0,0,0.8), 0 0 20px rgba(0,242,255,0.15)",
                }}
              >
                {/* Board Grid (~50-54% of viewport scale, strictly fits within 100vh) */}
                <div
                  className={`grid grid-cols-8 grid-rows-8 rounded-xl border border-white/10 ${
                    is3D ? "overflow-visible" : "overflow-hidden"
                  }`}
                  style={{
                    width: "min(54vh, 48vw, 520px)",
                    height: "min(54vh, 48vw, 520px)",
                    transformStyle: is3D ? "preserve-3d" : "flat",
                  }}
                >
                  {displayBoard.map((row, rIdx) =>
                    row.map((cell, cIdx) => {
                      const squareName = `${files[cIdx]}${ranks[rIdx]}` as Square;
                      const isLight = (rIdx + cIdx) % 2 === 0;
                      const isSelected = selectedSquare === squareName;
                      const isMoveTarget = possibleMoves.includes(squareName);
                      const isLastMoveSquare =
                        lastMove &&
                        (lastMove.from === squareName || lastMove.to === squareName);
                      const isDragOver = dragOverSquare === squareName;

                      return (
                        <div
                          key={squareName}
                          data-square={squareName}
                          onClick={() => handleSquareClick(squareName)}
                          onDragOver={(e) => handleDragOver(e, squareName)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, squareName)}
                          className={`relative w-full h-full flex items-center justify-center cursor-pointer select-none transition-colors duration-150 ${
                            isLight ? "board-square-light" : "board-square-dark"
                          } ${isLastMoveSquare ? "board-square-lastmove" : ""} ${
                            isSelected
                              ? "board-square-selected ring-1 ring-[var(--nx-cyan)] z-20"
                              : ""
                          } ${
                            isDragOver
                              ? "bg-[var(--nx-cyan)]/30 ring-2 ring-[var(--nx-cyan)]"
                              : ""
                          } ${
                            isMoveTarget
                              ? cell
                                ? "board-square-capture"
                                : "board-square-target"
                              : ""
                          }`}
                          style={{
                            transformStyle: is3D ? "preserve-3d" : "flat",
                            zIndex: is3D ? (rIdx + 1) * 4 : undefined,
                          }}
                        >
                          {/* Rank labels */}
                          {cIdx === 0 && (
                            <span
                              className={`absolute top-0.5 left-1 font-sans text-xs md:text-sm font-extrabold select-none pointer-events-none ${
                                isLight
                                  ? "text-white/45"
                                  : "text-[var(--nx-cyan-dim)]/60"
                              }`}
                            >
                              {ranks[rIdx]}
                            </span>
                          )}

                          {/* File labels */}
                          {rIdx === 7 && (
                            <span
                              className={`absolute bottom-0.5 right-1 font-sans text-xs md:text-sm font-extrabold select-none pointer-events-none ${
                                isLight
                                  ? "text-white/45"
                                  : "text-[var(--nx-cyan-dim)]/60"
                              }`}
                            >
                              {files[cIdx]}
                            </span>
                          )}

                          {/* 3D Base Shadow on Square Surface */}
                          {is3D && cell && (
                            <div
                              className="absolute pointer-events-none rounded-full"
                              style={{
                                bottom: "12%",
                                left: "50%",
                                transform: "translateX(-50%)",
                                width: "60%",
                                height: "24%",
                                background:
                                  "radial-gradient(ellipse at center, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)",
                                filter: "blur(1.5px)",
                              }}
                            />
                          )}

                          {/* Chess Piece (Strictly centered horizontally and vertically) */}
                          {cell && (
                            <div
                              draggable={
                                turn === "w" &&
                                !matchEnded &&
                                cell.color === "w" &&
                                !isInspectingHistory
                              }
                              onDragStart={(e) => handleDragStart(e, squareName)}
                              className={`w-full h-full flex items-center justify-center transition-all duration-150 relative ${
                                isSelected ? "scale-110 drop-shadow-2xl z-30" : "hover:scale-105"
                              }`}
                              style={{
                                transform:
                                  is3D && !isSelected
                                    ? "rotateX(-34deg) translateY(-20%) translateZ(14px) scale(1.15)"
                                    : undefined,
                                transformOrigin: is3D ? "50% 90%" : "50% 50%",
                                transformStyle: is3D ? "preserve-3d" : "flat",
                                filter: is3D
                                  ? cell.color === "w"
                                    ? "drop-shadow(0 6px 8px rgba(0,0,0,0.95)) drop-shadow(0 0 6px rgba(0,242,255,0.7))"
                                    : "drop-shadow(0 6px 8px rgba(0,0,0,0.95)) drop-shadow(0 0 6px rgba(168,85,247,0.7))"
                                  : undefined,
                              }}
                            >
                              <ChessPieceSVG type={cell.type} color={cell.color} size="board" />
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* User Player Card (White) */}
          <div className="w-full glass rounded-xl px-4 py-2.5 flex items-center justify-between shrink-0 border border-[var(--nx-border)]">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border"
                style={{
                  backgroundColor: `${user.avatarColor}20`,
                  color: user.avatarColor,
                  borderColor: `${user.avatarColor}40`,
                }}
              >
                {renderUserAvatar()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base text-white font-sans">{user.username}</span>
                  {user.title && user.title !== "NONE" && (
                    <span className="nx-chip text-xs font-sans font-bold py-0.5 px-2.5 bg-[var(--nx-purple)]/20 text-[var(--nx-violet)] border border-[var(--nx-purple)]/30 rounded-md">
                      {user.title}
                    </span>
                  )}
                  <span className="nx-chip bg-[var(--nx-cyan)]/15 text-[var(--nx-cyan)] text-xs font-sans font-bold py-0.5 px-2.5 rounded-md">
                    {user.rating} ELO (YOU)
                  </span>
                </div>
                <div className="flex items-center gap-1 text-sm font-sans font-bold text-[var(--nx-cyan)] mt-0.5">
                  {capturedByWhite.map((p, i) => (
                    <ChessPieceSVG key={i} type={p} color="b" size="xs" />
                  ))}
                  {materialDiff > 0 && (
                    <span className="text-[var(--nx-cyan)] font-extrabold ml-1">
                      +{materialDiff}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* White Timer & Abort Indicator */}
            <div className="flex flex-col items-end gap-1">
              {moveHistory.length === 0 && !matchEnded && (
                <div className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-400 animate-pulse">
                  <Timer className="w-3 h-3" />
                  <span>
                    {whiteGrace > 0
                      ? `STARTS IN ${whiteGrace}s`
                      : `ABORT: 0:${whiteAbortSeconds < 10 ? "0" : ""}${whiteAbortSeconds}`}
                  </span>
                </div>
              )}
              <div
                className={`font-sans text-2xl md:text-3xl font-black tracking-tight px-4 py-1.5 rounded-xl border transition-all duration-300 ${
                  turn === "w" && !matchEnded
                    ? "bg-[var(--nx-cyan)] text-black border-white/40 shadow-[0_0_16px_rgba(0,242,255,0.5)]"
                    : "bg-[var(--nx-bg-card)] text-[var(--nx-cyan)] border-[var(--nx-cyan)]/30"
                }`}
              >
                {formatTime(whiteTime)}
              </div>
            </div>
          </div>
        </section>

        {/* ═══ RIGHT HALF (~40%): UNIFIED TABBED CONTROL PANEL ═══ */}
        <aside className="col-span-12 lg:col-span-5 xl:col-span-5 flex flex-col h-full min-h-0 glass rounded-2xl border border-[var(--nx-border)] p-3 overflow-hidden">
          {/* Navigation Tabs Header (4 Tabs: MOVES, INFO, CHAT, ENGINE) */}
          <div className="grid grid-cols-4 gap-1 bg-[var(--nx-bg-surface)] p-1 rounded-xl border border-[var(--nx-border)] font-sans text-xs shrink-0 mb-2.5">
            <button
              onClick={() => setActiveTab("notation")}
              className={`py-2 rounded-lg font-bold text-xs tracking-wide flex items-center justify-center gap-1 transition-all ${
                activeTab === "notation"
                  ? "bg-[var(--nx-cyan)] text-black shadow-[0_0_10px_rgba(0,242,255,0.35)]"
                  : "text-[var(--nx-text-muted)] hover:text-white"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>MOVES</span>
            </button>
            <button
              onClick={() => setActiveTab("info")}
              className={`py-2 rounded-lg font-bold text-xs tracking-wide flex items-center justify-center gap-1 transition-all ${
                activeTab === "info"
                  ? "bg-[var(--nx-cyan)] text-black shadow-[0_0_10px_rgba(0,242,255,0.35)]"
                  : "text-[var(--nx-text-muted)] hover:text-white"
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              <span>INFO</span>
            </button>
            <button
              onClick={() => {
                setActiveTab("chat");
                setUnreadChatCount(0);
              }}
              className={`relative py-2 rounded-lg font-bold text-xs tracking-wide flex items-center justify-center gap-1 transition-all ${
                activeTab === "chat"
                  ? "bg-[var(--nx-cyan)] text-black shadow-[0_0_10px_rgba(0,242,255,0.35)]"
                  : "text-[var(--nx-text-muted)] hover:text-white"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>CHAT</span>
              {unreadChatCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-[var(--nx-cyan)] shadow-[0_0_6px_var(--nx-cyan)] animate-pulse" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("telemetry")}
              className={`py-2 rounded-lg font-bold text-xs tracking-wide flex items-center justify-center gap-1 transition-all ${
                activeTab === "telemetry"
                  ? "bg-[var(--nx-cyan)] text-black shadow-[0_0_10px_rgba(0,242,255,0.35)]"
                  : "text-[var(--nx-text-muted)] hover:text-white"
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>ENGINE</span>
            </button>
          </div>

          {/* TAB 1: NOTATION & STEPPER CONTROLS */}
          {activeTab === "notation" && (
            <div className="flex-1 min-h-0 flex flex-col gap-2 overflow-hidden animate-fade-in font-sans">
              <div className="flex items-center justify-between text-xs text-[var(--nx-text-muted)] px-1 shrink-0 font-medium">
                <span className="font-extrabold text-xs md:text-sm text-white uppercase flex items-center gap-1.5">
                  <PlayIcon className="w-3.5 h-3.5 text-[var(--nx-cyan)]" />
                  MOVE HISTORY ({moveHistory.length} PLIES)
                </span>
                <button
                  onClick={handleCopyPGN}
                  className="flex items-center gap-1 text-[var(--nx-cyan)] hover:underline text-xs font-bold"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedNotification ? "COPIED!" : "COPY PGN"}</span>
                </button>
              </div>

              {/* Moves grid */}
              <div
                ref={moveListRef}
                className="flex-1 min-h-0 overflow-y-auto bg-[var(--nx-bg-card)]/50 rounded-xl p-2 border border-[var(--nx-border)]"
              >
                <div className="grid grid-cols-2 gap-1.5 text-xs md:text-sm">
                  {moveHistory.map((mv, idx) => {
                    const isSelectedPly = viewingPly === idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setViewingPly(idx)}
                        className={`p-2 rounded-lg border flex items-center justify-between text-left transition-all ${
                          isSelectedPly
                            ? "bg-[var(--nx-cyan)] text-black border-white shadow-[0_0_8px_rgba(0,242,255,0.4)] font-bold"
                            : idx % 2 === 0
                            ? "bg-[var(--nx-cyan)]/5 border-[var(--nx-cyan)]/15 text-[var(--nx-cyan)] hover:bg-[var(--nx-cyan)]/10"
                            : "bg-[var(--nx-purple)]/5 border-[var(--nx-purple)]/15 text-[var(--nx-violet)] hover:bg-[var(--nx-purple)]/10"
                        }`}
                      >
                        <span
                          className={`text-xs font-semibold ${
                            isSelectedPly ? "text-black/70" : "text-[var(--nx-text-muted)]"
                          }`}
                        >
                          {Math.floor(idx / 2) + 1}
                          {idx % 2 === 0 ? "." : "…"}
                        </span>
                        <span className="font-bold text-xs md:text-sm font-mono">{mv.san}</span>
                      </button>
                    );
                  })}
                  {moveHistory.length === 0 && (
                    <div className="col-span-2 py-12 text-center text-[var(--nx-text-muted)] text-xs md:text-sm flex flex-col items-center gap-2">
                      <PlayIcon className="w-5 h-5 text-[var(--nx-cyan)]/40" />
                      Make your opening move to begin
                    </div>
                  )}
                </div>
              </div>

              {/* Stepper Navigation */}
              <div className="bg-[var(--nx-bg-card)] p-2.5 rounded-xl border border-[var(--nx-border)] flex flex-col gap-1.5 shrink-0">
                <div className="flex items-center justify-between text-xs text-[var(--nx-text-muted)] px-1 font-semibold">
                  <span>STEP INSPECTION</span>
                  <span className="font-bold text-[var(--nx-cyan)] text-xs md:text-sm">
                    {viewingPly !== null ? `PLY ${viewingPly + 1} OF ${moveHistory.length}` : "LIVE ARENA"}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={stepFirst}
                    title="First move (⏮)"
                    className="py-2 rounded-lg bg-[var(--nx-bg-surface)] border border-[var(--nx-border)] hover:border-[var(--nx-cyan)]/40 text-[var(--nx-text-muted)] hover:text-white flex items-center justify-center transition-all"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={stepPrev}
                    title="Previous move (◀)"
                    className="py-2 rounded-lg bg-[var(--nx-bg-surface)] border border-[var(--nx-border)] hover:border-[var(--nx-cyan)]/40 text-[var(--nx-text-muted)] hover:text-white flex items-center justify-center transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={stepNext}
                    title="Next move (▶)"
                    className="py-2 rounded-lg bg-[var(--nx-bg-surface)] border border-[var(--nx-border)] hover:border-[var(--nx-cyan)]/40 text-[var(--nx-text-muted)] hover:text-white flex items-center justify-center transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={stepLast}
                    title="Last / Live move (⏭)"
                    className={`py-2 rounded-lg border flex items-center justify-center transition-all ${
                      viewingPly === null
                        ? "bg-[var(--nx-cyan)]/15 border-[var(--nx-cyan)] text-[var(--nx-cyan)] font-bold"
                        : "bg-[var(--nx-bg-surface)] border-[var(--nx-border)] text-[var(--nx-text-muted)] hover:text-white"
                    }`}
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MATCH INFO (معلومات وتفاصيل الماتش) */}
          {activeTab === "info" && (
            <div className="flex-1 min-h-0 flex flex-col gap-2.5 overflow-y-auto animate-fade-in font-sans text-xs pr-1">
              {/* Engagement Status & Opening Banner */}
              <div className="bg-[var(--nx-bg-card)] p-3 rounded-xl border border-[var(--nx-border)] flex flex-col gap-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[var(--nx-text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                    <Swords className="w-3.5 h-3.5 text-amber-400" />
                    MATCH ENGAGEMENT
                  </span>
                  {matchEnded ? (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                      matchEnded.result === "ABORTED"
                        ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                        : "bg-purple-500/20 text-purple-300 border-purple-500/40"
                    }`}>
                      {matchEnded.result === "ABORTED" ? "ABORTED (0 ELO)" : `ENDED: ${matchEnded.result}`}
                    </span>
                  ) : moveHistory.length === 0 ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse flex items-center gap-1">
                      <Timer className="w-3 h-3" />
                      WHITE: {whiteGrace > 0 ? `STARTS IN ${whiteGrace}s` : `ABORT 0:${whiteAbortSeconds < 10 ? '0' : ''}${whiteAbortSeconds}`}
                    </span>
                  ) : moveHistory.length === 1 ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse flex items-center gap-1">
                      <Timer className="w-3 h-3" />
                      BLACK: {blackGrace > 0 ? `STARTS IN ${blackGrace}s` : `ABORT 0:${blackAbortSeconds < 10 ? '0' : ''}${blackAbortSeconds}`}
                    </span>
                  ) : isInCheck ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      KING IN CHECK
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                      LIVE ARENA
                    </span>
                  )}
                </div>

                {/* First Move Auto-Abort Protocol Panel */}
                {moveHistory.length <= 1 && !matchEnded && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-2.5 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-amber-400">
                      <span className="flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        AUTO-ABORT PROTOCOL (60s DEADLINE)
                      </span>
                      <span className="font-mono text-xs">
                        {moveHistory.length === 0
                          ? whiteGrace > 0
                            ? `Starts in ${whiteGrace}s`
                            : `0:${whiteAbortSeconds < 10 ? "0" : ""}${whiteAbortSeconds}`
                          : blackGrace > 0
                          ? `Starts in ${blackGrace}s`
                          : `0:${blackAbortSeconds < 10 ? "0" : ""}${blackAbortSeconds}`}
                      </span>
                    </div>
                    <p className="text-[10px] text-amber-200/80 leading-relaxed">
                      {moveHistory.length === 0
                        ? "Match clock is frozen until White's 1st move. White has a 60s deadline (starts after 3s grace) or match aborts."
                        : "White moved. Black has a 60s deadline (starts after 3s delay) to play move 1 or match aborts."}
                    </p>
                    <div className="flex items-center justify-between pt-1 border-t border-amber-500/20 text-[10px]">
                      <button
                        type="button"
                        onClick={() =>
                          triggerEndGame(
                            "ABORTED",
                            moveHistory.length === 0
                              ? "White failed to make first move in time (60s timeout test)"
                              : "Black failed to make first move in time (60s timeout test)"
                          )
                        }
                        className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 transition-all flex items-center gap-1"
                      >
                        <Timer className="w-3 h-3" />
                        TEST TIMEOUT (ABORT NOW)
                      </button>
                      {moveHistory.length === 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsBotAfkSimulated((prev) => !prev);
                            if (!isBotAfkSimulated) {
                              addChatMessage(
                                "system",
                                "Bot auto-move paused to simulate Black AFK timeout.",
                                "SIM"
                              );
                            }
                          }}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${
                            isBotAfkSimulated
                              ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                              : "bg-white/10 text-white/80 border-white/20 hover:bg-white/20"
                          }`}
                        >
                          {isBotAfkSimulated ? "BOT AFK (PAUSED)" : "SIMULATE BOT AFK"}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Detected Opening */}
                <div className="bg-[var(--nx-bg-surface)] p-2.5 rounded-lg border border-[var(--nx-border)] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="px-2 py-0.5 rounded bg-[var(--nx-cyan)]/15 text-[var(--nx-cyan)] font-black text-xs font-mono border border-[var(--nx-cyan)]/30 shrink-0">
                      {detectedOpening.eco}
                    </span>
                    <span className="text-xs md:text-sm font-extrabold text-white truncate">
                      {detectedOpening.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-[var(--nx-text-muted)] shrink-0 font-mono">
                    OPENING
                  </span>
                </div>
              </div>

              {/* Head-to-Head Duel Card */}
              <div className="bg-[var(--nx-bg-card)] p-3 rounded-xl border border-[var(--nx-border)] flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-bold text-[var(--nx-text-muted)] uppercase tracking-wider">
                  <span>COMBATANTS</span>
                  <span className="text-[var(--nx-cyan)] font-mono">
                    {chosenTimeControl.timeLabel} • {chosenTimeControl.name}
                  </span>
                </div>

                <div className="grid grid-cols-5 items-center gap-2 bg-[var(--nx-bg-surface)] p-3 rounded-xl border border-[var(--nx-border)]">
                  {/* White / User */}
                  <div className="col-span-2 flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-white border border-[var(--nx-cyan)] shadow-[0_0_6px_var(--nx-cyan)] shrink-0" />
                      <span className="font-extrabold text-white text-xs md:text-sm truncate">
                        {user?.username || "GUEST"}
                      </span>
                    </div>
                    <span className="text-xs text-[var(--nx-text-muted)] font-mono">
                      {user?.rating || 1500} ELO
                    </span>
                    <span className="text-xs md:text-sm font-extrabold text-[var(--nx-cyan)] font-mono mt-0.5">
                      {formatTime(whiteTime)}
                    </span>
                  </div>

                  {/* VS center icon */}
                  <div className="col-span-1 flex flex-col items-center justify-center">
                    <div className="w-7 h-7 rounded-full bg-[var(--nx-bg-card)] border border-[var(--nx-border)] flex items-center justify-center shadow-lg">
                      <Swords className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <span className="text-[9px] text-[var(--nx-text-muted)] font-black uppercase mt-0.5">VS</span>
                  </div>

                  {/* Black / Bot */}
                  <div className="col-span-2 flex flex-col items-end gap-1 text-right">
                    <div className="flex items-center gap-1.5 justify-end">
                      <span className="font-extrabold text-white text-xs md:text-sm truncate">
                        {chosenBot.name}
                      </span>
                      <span className="w-3 h-3 rounded-full bg-[#1D1533] border border-[var(--nx-purple)] shadow-[0_0_6px_var(--nx-purple)] shrink-0" />
                    </div>
                    <span className="text-xs text-[var(--nx-violet)] font-mono font-bold">
                      {chosenBot.title} ({chosenBot.elo})
                    </span>
                    <span className="text-xs md:text-sm font-extrabold text-[var(--nx-purple)] font-mono mt-0.5">
                      {formatTime(blackTime)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Live Match Metrics */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[var(--nx-bg-card)] p-2.5 rounded-xl border border-[var(--nx-border)] flex flex-col gap-1">
                  <span className="text-[10px] text-[var(--nx-text-muted)] uppercase font-semibold">TURN & PACE</span>
                  <span className="text-xs md:text-sm font-extrabold text-white flex items-center gap-1">
                    <Timer className="w-3.5 h-3.5 text-[var(--nx-cyan)] shrink-0" />
                    <span className="truncate">
                      {turn === "w" ? "White to Move" : `${chosenBot.name} Thinking`}
                    </span>
                  </span>
                  <span className="text-[11px] text-[var(--nx-text-secondary)] font-mono">
                    Move {Math.floor(moveHistory.length / 2) + 1} • {moveHistory.length} Plies
                  </span>
                </div>

                <div className="bg-[var(--nx-bg-card)] p-2.5 rounded-xl border border-[var(--nx-border)] flex flex-col gap-1">
                  <span className="text-[10px] text-[var(--nx-text-muted)] uppercase font-semibold">MATERIAL DIFF</span>
                  <span
                    className={`text-xs md:text-sm font-extrabold ${
                      materialDiff > 0
                        ? "text-[var(--nx-cyan)]"
                        : materialDiff < 0
                        ? "text-[var(--nx-violet)]"
                        : "text-white"
                    }`}
                  >
                    {materialDiff > 0
                      ? `+${materialDiff} White`
                      : materialDiff < 0
                      ? `+${Math.abs(materialDiff)} Black`
                      : "Equal Balance (0)"}
                  </span>
                  <span className="text-[11px] text-[var(--nx-text-secondary)] font-mono">
                    {capturedByWhite.length} cap / {capturedByBlack.length} lost
                  </span>
                </div>
              </div>

              {/* Castling & Tactical Flags */}
              <div className="bg-[var(--nx-bg-card)] p-3 rounded-xl border border-[var(--nx-border)] flex flex-col gap-2">
                <span className="text-[11px] font-bold text-[var(--nx-text-muted)] uppercase tracking-wider block">
                  CASTLING RIGHTS & BOARD STATE
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-[var(--nx-bg-surface)] p-2.5 rounded-lg border border-[var(--nx-border)] flex flex-col gap-1">
                    <span className="text-[var(--nx-cyan)] font-extrabold text-[11px]">WHITE CASTLING:</span>
                    <div className="flex items-center gap-2 font-mono text-[var(--nx-text-secondary)] text-xs">
                      <span>O-O: {whiteCanCastleK ? "✓ Yes" : "✕ No"}</span>
                      <span>•</span>
                      <span>O-O-O: {whiteCanCastleQ ? "✓ Yes" : "✕ No"}</span>
                    </div>
                  </div>
                  <div className="bg-[var(--nx-bg-surface)] p-2.5 rounded-lg border border-[var(--nx-border)] flex flex-col gap-1">
                    <span className="text-[var(--nx-violet)] font-extrabold text-[11px]">BLACK CASTLING:</span>
                    <div className="flex items-center gap-2 font-mono text-[var(--nx-text-secondary)] text-xs">
                      <span>O-O: {blackCanCastleK ? "✓ Yes" : "✕ No"}</span>
                      <span>•</span>
                      <span>O-O-O: {blackCanCastleQ ? "✓ Yes" : "✕ No"}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-[var(--nx-text-secondary)] pt-1 px-1">
                  <span>
                    En Passant: <strong className="text-white font-mono">{enPassantSquare || "None"}</strong>
                  </span>
                  <span>
                    Halfmove 50-Rule: <strong className="text-white font-mono">{halfmoveClock} / 50</strong>
                  </span>
                </div>
              </div>

              {/* Session Meta */}
              <div className="bg-[var(--nx-bg-card)] p-2.5 rounded-xl border border-[var(--nx-border)] flex items-center justify-between text-[11px] text-[var(--nx-text-muted)]">
                <span>PROTOCOL: <strong className="text-white font-mono">ARENA PROTOCOL v2.4</strong></span>
                <span>ENGINE: <strong className="text-[var(--nx-cyan)] font-mono">STOCKFISH 19 WASM</strong></span>
              </div>
            </div>
          )}

          {/* TAB 3: IN-GAME CHAT (الشات مع الخصم والبوت) */}
          {activeTab === "chat" && (
            <div className="flex-1 min-h-0 flex flex-col gap-2 overflow-hidden animate-fade-in font-sans text-xs">
              {/* Chat Header info */}
              <div className="flex items-center justify-between text-xs px-1 text-[var(--nx-text-muted)] font-semibold shrink-0">
                <span className="text-white font-extrabold uppercase flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-[var(--nx-cyan)]" />
                  TACTICAL CHANNEL • {chosenBot.name}
                </span>
                <span className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  ONLINE
                </span>
              </div>

              {/* Chat Messages Log */}
              <div className="flex-1 min-h-0 overflow-y-auto p-2.5 flex flex-col gap-2.5 rounded-xl bg-[var(--nx-bg-card)]/50 border border-[var(--nx-border)]">
                {chatMessages.map((msg) => {
                  if (msg.sender === "system") {
                    return (
                      <div key={msg.id} className="flex items-center justify-center my-1">
                        <span className="text-[10px] md:text-[11px] px-3 py-1 rounded-full bg-[var(--nx-bg-surface)] text-[var(--nx-text-muted)] border border-[var(--nx-border)] text-center font-mono leading-tight">
                          {msg.text}
                        </span>
                      </div>
                    );
                  }

                  if (msg.sender === "user") {
                    return (
                      <div key={msg.id} className="flex flex-col items-end gap-1 max-w-[85%] self-end">
                        <div className="flex items-center gap-1.5 text-[10px] text-[var(--nx-text-muted)]">
                          <span className="font-bold text-[var(--nx-cyan)]">{user?.username || "You"}</span>
                          <span>{msg.timestamp}</span>
                        </div>
                        <div className="px-3.5 py-2 rounded-2xl rounded-tr-xs bg-[var(--nx-cyan)]/15 border border-[var(--nx-cyan)]/40 text-white text-xs md:text-sm shadow-[0_0_12px_rgba(0,242,255,0.12)] leading-relaxed break-words">
                          {msg.text}
                        </div>
                      </div>
                    );
                  }

                  // Bot message
                  return (
                    <div key={msg.id} className="flex items-start gap-2 max-w-[88%] self-start">
                      <div
                        className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[10px] font-black border border-white/20 mt-1 shadow-sm"
                        style={{ backgroundColor: chosenBot.avatarColor, color: "#000" }}
                      >
                        <Bot className="w-3.5 h-3.5 text-black" />
                      </div>
                      <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-1.5 text-[10px] text-[var(--nx-text-muted)] flex-wrap">
                          <span className="font-bold text-[var(--nx-violet)]">{chosenBot.name}</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-[var(--nx-purple)]/20 text-[var(--nx-violet)] border border-[var(--nx-purple)]/30 font-semibold font-mono">
                            {chosenBot.title}
                          </span>
                          <span>{msg.timestamp}</span>
                        </div>
                        <div className="px-3.5 py-2 rounded-2xl rounded-tl-xs bg-[var(--nx-bg-surface)] border border-[var(--nx-purple)]/40 text-white text-xs md:text-sm shadow-[0_0_12px_rgba(168,85,247,0.12)] leading-relaxed break-words">
                          {msg.text}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Bot Typing Indicator */}
                {isBotTyping && (
                  <div className="flex items-center gap-2 self-start bg-[var(--nx-bg-surface)] border border-[var(--nx-purple)]/30 px-3 py-1.5 rounded-full text-[11px] text-[var(--nx-violet)]">
                    <Bot className="w-3 h-3 text-[var(--nx-purple)] animate-spin" />
                    <span>{chosenBot.name} is calculating reply</span>
                    <span className="flex gap-1 ml-0.5">
                      <span className="w-1 h-1 rounded-full bg-[var(--nx-purple)] animate-bounce" />
                      <span className="w-1 h-1 rounded-full bg-[var(--nx-purple)] animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1 h-1 rounded-full bg-[var(--nx-purple)] animate-bounce [animation-delay:0.4s]" />
                    </span>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* Quick Reaction Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-1 shrink-0 no-scrollbar">
                {QUICK_CHIPS.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(chip)}
                    className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[var(--nx-bg-surface)] hover:bg-[var(--nx-cyan)]/20 text-[var(--nx-text-secondary)] hover:text-white border border-[var(--nx-border)] hover:border-[var(--nx-cyan)]/40 shrink-0 transition-all active:scale-95"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Chat Input Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-1.5 shrink-0 pt-0.5"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Transmit message to opponent..."
                  className="flex-1 bg-[var(--nx-bg-surface)] border border-[var(--nx-border)] focus:border-[var(--nx-cyan)] text-white text-xs md:text-sm rounded-xl px-3 py-2 outline-none transition-colors"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="p-2.5 rounded-xl bg-[var(--nx-cyan)] text-black font-extrabold hover:brightness-110 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-[0_0_8px_rgba(0,242,255,0.3)]"
                  title="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* TAB 4: TELEMETRY & MATERIAL */}
          {activeTab === "telemetry" && (
            <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-y-auto animate-fade-in font-sans text-xs pr-1">
              {/* Bot Specs */}
              <div className="bg-[var(--nx-bg-card)] p-3 rounded-xl border border-[var(--nx-border)] flex flex-col gap-2">
                <span className="text-xs font-bold text-[var(--nx-text-muted)] uppercase tracking-wider block">
                  AI ENGINE SPECIFICATION
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-[var(--nx-bg-surface)] p-2.5 rounded-lg border border-[var(--nx-border)]">
                    <span className="text-xs text-[var(--nx-text-muted)] uppercase font-semibold block">DIFFICULTY</span>
                    <span className="text-sm md:text-base font-extrabold text-[var(--nx-cyan)]">LVL {chosenBot.level} / 20</span>
                    <span className="text-xs text-[var(--nx-text-secondary)] font-medium block">{chosenBot.title}</span>
                  </div>
                  <div className="bg-[var(--nx-bg-surface)] p-2.5 rounded-lg border border-[var(--nx-border)]">
                    <span className="text-xs text-[var(--nx-text-muted)] uppercase font-semibold block">CALC DEPTH</span>
                    <span className="text-sm md:text-base font-extrabold text-[var(--nx-violet)]">DEPTH {chosenBot.depth} NNUE</span>
                    <span className="text-xs text-[var(--nx-text-secondary)] font-medium block">Stockfish 19 WASM</span>
                  </div>
                </div>
                <p className="text-xs md:text-sm text-[var(--nx-text-secondary)] leading-relaxed mt-1 font-medium">
                  {chosenBot.desc}
                </p>
              </div>

              {/* Material Breakdown */}
              <div className="bg-[var(--nx-bg-card)] p-3 rounded-xl border border-[var(--nx-border)] flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs md:text-sm font-bold">
                  <span className="text-[var(--nx-text-muted)] uppercase">MATERIAL BALANCE</span>
                  <span
                    className={`font-extrabold ${
                      materialDiff > 0
                        ? "text-[var(--nx-cyan)]"
                        : materialDiff < 0
                        ? "text-[var(--nx-violet)]"
                        : "text-white"
                    }`}
                  >
                    {materialDiff > 0
                      ? `+${materialDiff} WHITE ADVANTAGE`
                      : materialDiff < 0
                      ? `+${Math.abs(materialDiff)} BLACK ADVANTAGE`
                      : "EQUAL MATERIAL"}
                  </span>
                </div>

                <div className="flex flex-col gap-2 pt-1">
                  {/* Captured by White */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--nx-bg-surface)] border border-[var(--nx-border)]">
                    <span className="text-xs md:text-sm font-bold text-[var(--nx-cyan)]">White Captured:</span>
                    <div className="flex items-center gap-1">
                      {capturedByWhite.map((p, i) => (
                        <ChessPieceSVG key={i} type={p} color="b" size="xs" />
                      ))}
                      {capturedByWhite.length === 0 && (
                        <span className="text-xs text-[var(--nx-text-muted)]">None</span>
                      )}
                    </div>
                  </div>

                  {/* Captured by Black */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--nx-bg-surface)] border border-[var(--nx-border)]">
                    <span className="text-xs md:text-sm font-bold text-[var(--nx-violet)]">Black Captured:</span>
                    <div className="flex items-center gap-1">
                      {capturedByBlack.map((p, i) => (
                        <ChessPieceSVG key={i} type={p} color="w" size="xs" />
                      ))}
                      {capturedByBlack.length === 0 && (
                        <span className="text-xs text-[var(--nx-text-muted)]">None</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="bg-[var(--nx-bg-card)] p-3 rounded-xl border border-[var(--nx-border)] flex items-center justify-between text-xs md:text-sm font-bold">
                <span className="text-[var(--nx-text-muted)] uppercase">ENGINE WORKER:</span>
                <span className="flex items-center gap-2 font-bold">
                  <Radio
                    className={`w-4 h-4 ${
                      isEngineThinking ? "text-[var(--nx-purple)] animate-pulse" : "text-[var(--nx-green)]"
                    }`}
                  />
                  <span className={isEngineThinking ? "text-[var(--nx-violet)]" : "text-[var(--nx-green)]"}>
                    {isEngineThinking ? "CALCULATING DEPTH 20..." : "STOCKFISH 19 NNUE READY"}
                  </span>
                </span>
              </div>
            </div>
          )}

          {/* Bottom Action Bar */}
          <div className="pt-2.5 border-t border-[var(--nx-border)] grid grid-cols-2 gap-2 mt-auto shrink-0 font-sans text-xs">
            <button
              onClick={handleUndoMove}
              disabled={matchEnded !== null}
              className="nx-btn nx-btn-secondary py-2.5 rounded-lg text-xs md:text-sm font-bold w-full disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" />
              <span>TAKEBACK</span>
            </button>
            {moveHistory.length <= 1 ? (
              <button
                onClick={() =>
                  triggerEndGame(
                    "ABORTED",
                    moveHistory.length === 0
                      ? "White aborted match before first move"
                      : "Black aborted match before first move"
                  )
                }
                disabled={matchEnded !== null}
                className="nx-btn py-2.5 rounded-lg text-xs md:text-sm font-bold w-full disabled:opacity-50 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-400 flex items-center justify-center gap-1.5 transition-all"
                title="Abort Match without rating penalty (0 ELO)"
              >
                <AlertCircle className="w-4 h-4" />
                <span>ABORT MATCH (0 ELO)</span>
              </button>
            ) : (
              <button
                onClick={() => triggerEndGame("DEFEAT", "WHITE RESIGNED")}
                disabled={matchEnded !== null}
                className="nx-btn nx-btn-danger py-2.5 rounded-lg text-xs md:text-sm font-bold w-full disabled:opacity-50"
              >
                <Flag className="w-4 h-4" />
                <span>RESIGN MATCH</span>
              </button>
            )}
          </div>
        </aside>

        {/* ═══ GAME OVER MODAL ═══ */}
        {matchEnded && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-scale-in">
            <div
              className={`w-full max-w-md p-6 rounded-2xl border-2 flex flex-col items-center gap-4 relative glass ${
                matchEnded.result === "VICTORY"
                  ? "border-[var(--nx-cyan)]/70 neon-cyan"
                  : matchEnded.result === "DEFEAT"
                  ? "border-[var(--nx-red)]/70 shadow-[0_0_30px_rgba(239,68,68,0.3)]"
                  : matchEnded.result === "ABORTED"
                  ? "border-amber-500/70 shadow-[0_0_30px_rgba(245,158,11,0.3)]"
                  : "border-[var(--nx-violet)]/70 neon-purple"
              }`}
              style={{ backgroundColor: "#070A0Ff0" }}
            >
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center animate-float ${
                  matchEnded.result === "VICTORY"
                    ? "bg-[var(--nx-cyan)]/15 text-[var(--nx-cyan)]"
                    : matchEnded.result === "DEFEAT"
                    ? "bg-[var(--nx-red)]/15 text-[var(--nx-red)]"
                    : matchEnded.result === "ABORTED"
                    ? "bg-amber-500/15 text-amber-400"
                    : "bg-[var(--nx-violet)]/15 text-[var(--nx-violet)]"
                }`}
              >
                {matchEnded.result === "VICTORY" ? (
                  <Award className="w-8 h-8" />
                ) : matchEnded.result === "ABORTED" ? (
                  <AlertCircle className="w-8 h-8 text-amber-400" />
                ) : (
                  <AlertCircle className="w-8 h-8" />
                )}
              </div>

              <div className="text-center flex flex-col gap-1">
                <span
                  className={`text-2xl font-black font-sans tracking-wide ${
                    matchEnded.result === "VICTORY"
                      ? "text-[var(--nx-cyan)] neon-text-cyan"
                      : matchEnded.result === "DEFEAT"
                      ? "text-[var(--nx-red)]"
                      : matchEnded.result === "ABORTED"
                      ? "text-amber-400"
                      : "text-[var(--nx-violet)] neon-text-purple"
                  }`}
                >
                  {matchEnded.result === "ABORTED" ? "GAME ABORTED" : matchEnded.result}
                </span>
                <span className="font-sans text-xs text-[var(--nx-text-muted)] font-medium">
                  {matchEnded.reason}
                </span>
                <span
                  className={`font-sans text-sm font-bold mt-1 ${
                    matchEnded.result === "ABORTED"
                      ? "text-amber-400 font-mono"
                      : "text-[var(--nx-green)]"
                  }`}
                >
                  {matchEnded.eloChange} {matchEnded.result === "ABORTED" ? "(RATINGS UNCHANGED)" : ""}
                </span>
              </div>

              <div className="w-full flex flex-col gap-2 mt-2">
                {matchEnded.result !== "ABORTED" && (
                  <Link
                    href="/analysis"
                    className="nx-btn nx-btn-primary w-full py-2.5 rounded-xl text-xs justify-center"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>REVIEW IN ANALYSIS HUB</span>
                  </Link>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleNewGame}
                    className={`py-2 rounded-lg text-xs font-bold w-full flex items-center justify-center gap-1.5 transition-all ${
                      matchEnded.result === "ABORTED"
                        ? "bg-[var(--nx-cyan)] text-black shadow-[0_0_12px_rgba(0,242,255,0.4)]"
                        : "nx-btn nx-btn-secondary text-[10px]"
                    }`}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{matchEnded.result === "ABORTED" ? "START NEW MATCH" : "PLAY AGAIN"}</span>
                  </button>
                  <Link
                    href="/"
                    className="nx-btn nx-btn-secondary py-2 rounded-lg text-xs font-bold w-full text-center flex items-center justify-center"
                  >
                    LOBBY
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function TacticalArenaContent() {
  const searchParams = useSearchParams();
  const rawTime = searchParams.get("time") || "3+2";
  const botParam = searchParams.get("bot") || "lvl-15";
  return <TacticalPlayArea key={`${rawTime}_${botParam}`} />;
}

export default function TacticalArenaPage() {
  return (
    <Suspense
      fallback={
        <div
          className="h-screen flex items-center justify-center"
          style={{ backgroundColor: "#070A0F" }}
        >
          <div className="flex flex-col items-center gap-3 animate-pulse-glow">
            <Zap className="w-8 h-8 text-[var(--nx-cyan)]" />
            <span className="font-sans font-semibold text-xs text-[var(--nx-cyan)] tracking-wider">
              CONNECTING ARENA ENGINE...
            </span>
          </div>
        </div>
      }
    >
      <TacticalArenaContent />
    </Suspense>
  );
}