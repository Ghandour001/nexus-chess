"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  Suspense,
  useSyncExternalStore,
  useRef,
  useCallback,
} from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Chess, Square } from "chess.js";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  ChevronLeft,
  ChevronRight,
  Swords,
  BarChart3,
  Target,
  Sparkles,
  RotateCcw,
  GitBranch,
  ArrowRight,
  Bot,
  Compass,
} from "lucide-react";
import {
  getStoredMatches,
  subscribeMatches,
  getMatchesServerSnapshot,
  SavedMatch,
} from "@/lib/matchStorage";
import { StockfishEngine } from "@/lib/stockfishEngine";
import { NexusHeader } from "@/components/NexusHeader";
import { ChessPieceSVG } from "@/components/ChessPieceSVG";
import { sfx } from "@/lib/soundFx";

// High-caliber default demonstration match if user has zero played matches
const DEMO_MATCH: SavedMatch = {
  id: "nx-grand-prix-01",
  format: "ARENA BLITZ 3+2",
  opponent: "VALKYRIE-09",
  opponentRating: 2550,
  result: "VICTORY",
  eloChange: "+8 ELO",
  opening: "C84 Ruy Lopez: Closed Defense",
  accuracy: "96.4% CAPS",
  timestamp: "TODAY, 14:22 UTC",
  moves: [
    { san: "e4", evalStr: "+0.2" },
    { san: "e5", evalStr: "+0.2" },
    { san: "Nf3", evalStr: "+0.3" },
    { san: "Nc6", evalStr: "+0.2" },
    { san: "Bb5", evalStr: "+0.3" },
    { san: "a6", evalStr: "+0.3" },
    { san: "Ba4", evalStr: "+0.4" },
    { san: "Nf6", evalStr: "+0.3" },
    { san: "O-O", evalStr: "+0.4" },
    { san: "Be7", evalStr: "+0.3" },
    { san: "Re1", evalStr: "+0.5" },
    { san: "b5", evalStr: "+0.4" },
    { san: "Bb3", evalStr: "+0.5" },
    { san: "d6", evalStr: "+0.4" },
    { san: "c3", evalStr: "+0.6" },
    { san: "O-O", evalStr: "+0.5" },
    { san: "h3", evalStr: "+0.6" },
    { san: "Nb8", evalStr: "+0.7" },
    { san: "d4", evalStr: "+0.8" },
    { san: "Nbd7", evalStr: "+0.8" },
    { san: "c4", evalStr: "+1.2" },
    { san: "c6", evalStr: "+1.1" },
    { san: "cxb5", evalStr: "+1.4" },
    { san: "axb5", evalStr: "+1.3" },
    { san: "Nc3", evalStr: "+1.8" },
    { san: "Bb7", evalStr: "+1.7" },
    { san: "Bg5", evalStr: "+2.2" },
    { san: "h6", evalStr: "+2.4" },
    { san: "Bh4", evalStr: "+2.6" },
    { san: "Nh5", evalStr: "+3.4" },
    { san: "Bxe7", evalStr: "+3.6" },
    { san: "Qxe7", evalStr: "+3.5" },
    { san: "Nxe5", evalStr: "+4.8" },
    { san: "Nxe5", evalStr: "+4.9" },
    { san: "Qxh5", evalStr: "+5.4" },
  ],
};

interface VariationMove {
  san: string;
  from: Square;
  to: Square;
  fen: string;
}

function AnalysisContent() {
  const searchParams = useSearchParams();
  const matchId = searchParams.get("id");

  const storedMatches = useSyncExternalStore(
    subscribeMatches,
    getStoredMatches,
    getMatchesServerSnapshot
  );

  const matches = useMemo(() => {
    return storedMatches.length > 0 ? storedMatches : [DEMO_MATCH];
  }, [storedMatches]);

  const [activeMatchId, setActiveMatchId] = useState<string>(matchId || matches[0].id);

  const match = useMemo(() => {
    const found = matches.find((m) => m.id === activeMatchId);
    return found || matches[0];
  }, [matches, activeMatchId]);

  // Main game navigation ply (0 = start, match.moves.length = end)
  const [selectedPly, setSelectedPly] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // ─── INTERACTIVE VARIATION SANDBOX STATE ───
  // When variationMoves has items, we are exploring an alternative branch!
  const [variationMoves, setVariationMoves] = useState<VariationMove[]>([]);
  const [variationBranchPly, setVariationBranchPly] = useState<number | null>(null);

  // Board interaction states
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<Square[]>([]);
  const [lastMoveSquares, setLastMoveSquares] = useState<{ from: Square; to: Square } | null>(null);
  const [dragOverSquare, setDragOverSquare] = useState<Square | null>(null);

  // Stockfish 19 NNUE evaluation & recommendation
  const [currentEvalCp, setCurrentEvalCp] = useState<number>(30);
  const [engineSuggestedMove, setEngineSuggestedMove] = useState<string | null>(null);
  const engineRef = useRef<StockfishEngine | null>(null);

  const currentPly = selectedPly ?? match.moves.length;
  const isVariationMode = variationMoves.length > 0;

  // Initialize Stockfish 19 NNUE Worker for deep analysis
  useEffect(() => {
    const engine = new StockfishEngine();
    engine.init();
    engineRef.current = engine;
    return () => {
      engine.terminate();
    };
  }, []);

  // Compute active board and FEN
  const { board, fen, activeGame } = useMemo(() => {
    const g = new Chess();

    if (!isVariationMode) {
      // Replaying original game line up to currentPly
      if (match && match.moves.length > 0) {
        for (let i = 0; i < currentPly && i < match.moves.length; i++) {
          try {
            g.move(match.moves[i].san);
          } catch {}
        }
      }
    } else {
      // Replaying original game line up to branch point, then variation moves
      const branchIndex = variationBranchPly ?? 0;
      for (let i = 0; i < branchIndex && i < match.moves.length; i++) {
        try {
          g.move(match.moves[i].san);
        } catch {}
      }
      for (const vm of variationMoves) {
        try {
          g.move({ from: vm.from, to: vm.to, promotion: "q" });
        } catch {}
      }
    }

    return { board: g.board(), fen: g.fen(), activeGame: g };
  }, [match, currentPly, isVariationMode, variationBranchPly, variationMoves]);

  // Request Stockfish 19 evaluation on position change
  useEffect(() => {
    if (engineRef.current && fen) {
      engineRef.current.evaluate(
        fen,
        (cp) => {
          setCurrentEvalCp(cp);
        },
        (bestUci) => {
          if (bestUci && bestUci.length >= 4) {
            setEngineSuggestedMove(bestUci);
          }
        }
      );
    }
  }, [fen]);

  // Auto-play timeline loop for game line
  useEffect(() => {
    if (!isPlaying || !match || isVariationMode) return;
    const maxMoves = match.moves.length;
    const timer = setInterval(() => {
      setSelectedPly((prev) => {
        const cur = prev ?? 0;
        if (cur >= maxMoves) {
          setIsPlaying(false);
          return cur;
        }
        return cur + 1;
      });
    }, 700);
    return () => clearInterval(timer);
  }, [isPlaying, match, isVariationMode]);

  // Format evaluation score
  const evalPercent = useMemo(() => {
    const clamped = Math.max(-600, Math.min(600, currentEvalCp));
    return ((clamped + 600) / 1200) * 100;
  }, [currentEvalCp]);

  const evalDisplay = useMemo(() => {
    if (Math.abs(currentEvalCp) >= 9000) {
      return currentEvalCp > 0 ? "+M" : "-M";
    }
    const val = currentEvalCp / 100;
    return val >= 0 ? `+${val.toFixed(1)}` : val.toFixed(1);
  }, [currentEvalCp]);

  // Execute move on the analysis board (Interactive Variation Branching)
  const handleMakeAnalysisMove = useCallback(
    (from: Square, to: Square) => {
      const g = new Chess(fen);
      const destPiece = g.get(to);

      try {
        const move = g.move({ from, to, promotion: "q" });
        if (move) {
          sfx.playMove();
          if (destPiece) sfx.playCapture();
          if (g.inCheck()) sfx.playCheck();

          setLastMoveSquares({ from, to });
          setSelectedSquare(null);
          setPossibleMoves([]);

          if (!isVariationMode) {
            // Check if this move matches the next move in the original match line
            const nextMatchMove = match.moves[currentPly];
            if (nextMatchMove && nextMatchMove.san === move.san) {
              // Just advance the main line
              setSelectedPly(currentPly + 1);
            } else {
              // Start an alternative variation branch!
              setVariationBranchPly(currentPly);
              setVariationMoves([{ san: move.san, from, to, fen: g.fen() }]);
            }
          } else {
            // Continue extending the current variation
            setVariationMoves((prev) => [
              ...prev,
              { san: move.san, from, to, fen: g.fen() },
            ]);
          }
          return true;
        }
      } catch {
        setSelectedSquare(null);
        setPossibleMoves([]);
      }
      return false;
    },
    [fen, isVariationMode, match.moves, currentPly]
  );

  // Click on a square
  const handleSquareClick = (square: Square) => {
    if (selectedSquare && possibleMoves.includes(square)) {
      handleMakeAnalysisMove(selectedSquare, square);
      return;
    }

    const piece = activeGame.get(square);
    if (piece) {
      setSelectedSquare(square);
      const legal = activeGame
        .moves({ square, verbose: true })
        .map((m) => m.to as Square);
      setPossibleMoves(legal);
      return;
    }

    setSelectedSquare(null);
    setPossibleMoves([]);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, square: Square) => {
    const piece = activeGame.get(square);
    if (!piece) {
      e.preventDefault();
      return;
    }
    setSelectedSquare(square);
    const legal = activeGame
      .moves({ square, verbose: true })
      .map((m) => m.to as Square);
    setPossibleMoves(legal);
    e.dataTransfer.setData("text/plain", square);
  };

  const handleDragOver = (e: React.DragEvent, square: Square) => {
    e.preventDefault();
    if (dragOverSquare !== square) setDragOverSquare(square);
  };

  const handleDrop = (e: React.DragEvent, toSquare: Square) => {
    e.preventDefault();
    setDragOverSquare(null);
    const fromSquare = e.dataTransfer.getData("text/plain") as Square;
    if (fromSquare && fromSquare !== toSquare) {
      handleMakeAnalysisMove(fromSquare, toSquare);
    }
  };

  // Reset to original game line
  const handleResetToMainLine = () => {
    setVariationMoves([]);
    setVariationBranchPly(null);
    setSelectedSquare(null);
    setPossibleMoves([]);
    setLastMoveSquares(null);
  };

  // Play top engine suggested move in sandbox
  const handlePlayEngineMove = () => {
    if (!engineSuggestedMove || engineSuggestedMove.length < 4) return;
    const from = engineSuggestedMove.substring(0, 2) as Square;
    const to = engineSuggestedMove.substring(2, 4) as Square;
    handleMakeAnalysisMove(from, to);
  };

  const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
  const ranks = ["8", "7", "6", "5", "4", "3", "2", "1"];

  return (
    <div
      className="text-slate-100 h-screen max-h-screen overflow-hidden flex flex-col select-none relative font-sans"
      style={{ backgroundColor: "#070A0F" }}
    >
      <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />

      <NexusHeader chipLabel="STOCKFISH 19 NNUE LAB" />

      {/* ═══ CLEAN PROFESSIONAL MATCH BAR ═══ */}
      <div className="w-full glass-subtle px-4 py-2 flex items-center justify-between text-xs sm:text-sm shrink-0 relative z-10 border-b border-white/10">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Match selector dropdown */}
          <select
            value={match.id}
            onChange={(e) => {
              setActiveMatchId(e.target.value);
              setSelectedPly(null);
              setIsPlaying(false);
              handleResetToMainLine();
            }}
            className="bg-[#0F1420] border border-white/15 rounded-lg px-2.5 py-1 text-white text-xs font-semibold outline-none cursor-pointer hover:border-cyan-400 transition-colors"
          >
            {matches.map((m) => (
              <option key={m.id} value={m.id}>
                {m.opponent} ({m.format}) — {m.result}
              </option>
            ))}
          </select>

          <span
            className={`font-bold flex items-center gap-1.5 px-2 py-0.5 rounded-md ${
              match.result === "VICTORY"
                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            {match.result} ({match.eloChange})
          </span>

          <span className="text-white/20">│</span>
          <span className="text-white font-semibold flex items-center gap-1">
            <Bot className="w-4 h-4 text-cyan-400" />
            {match.opponent} ({match.opponentRating} ELO)
          </span>

          <span className="text-white/20">│</span>
          <span className="text-slate-400 text-xs">{match.opening}</span>

          {isVariationMode && (
            <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-bold animate-pulse flex items-center gap-1">
              <GitBranch className="w-3.5 h-3.5" />
              VARIATION SANDBOX ACTIVE
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isVariationMode && (
            <button
              onClick={handleResetToMainLine}
              className="px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400 text-cyan-300 text-xs font-bold flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(0,242,255,0.2)]"
            >
              <RotateCcw className="w-3 h-3" />
              <span>RETURN TO GAME LINE</span>
            </button>
          )}

          <div className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-cyan-400 font-semibold text-xs">
            Accuracy: {match.accuracy}
          </div>
        </div>
      </div>

      {/* ═══ MAIN WORKSPACE (STRICT ZERO-SCROLL 100vh) ═══ */}
      <main className="flex-1 min-h-0 px-4 py-2 grid grid-cols-12 gap-3 overflow-hidden max-w-[1720px] mx-auto w-full relative z-10">
        {/* ── LEFT COLUMN: MOVE NOTATION & VARIATION TREE ── */}
        <aside className="col-span-3 flex flex-col gap-2 min-h-0 h-full">
          <div className="glass rounded-xl p-2.5 flex items-center justify-between shrink-0 border border-white/10">
            <span className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-cyan-400" />
              Game Notation
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {match.moves.length} moves
            </span>
          </div>

          {/* Move List */}
          <div className="glass rounded-xl p-2.5 flex-1 min-h-0 overflow-y-auto flex flex-col gap-2 border border-white/10">
            {/* If currently in an alternative variation, show the branch card */}
            {isVariationMode && (
              <div className="bg-purple-950/40 border border-purple-500/30 rounded-xl p-2.5 flex flex-col gap-2 shrink-0">
                <div className="flex items-center justify-between text-xs font-bold text-purple-300">
                  <span className="flex items-center gap-1">
                    <GitBranch className="w-3.5 h-3.5" />
                    Alternative Branch ({variationMoves.length} moves)
                  </span>
                  <button
                    onClick={handleResetToMainLine}
                    className="text-[11px] underline hover:text-white"
                  >
                    Reset
                  </button>
                </div>

                <div className="flex flex-wrap gap-1">
                  {variationMoves.map((vm, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-200 border border-purple-500/40 text-xs font-semibold"
                    >
                      {vm.san}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Main Game Line Moves */}
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              {match.moves.map((mv, idx) => {
                const isSelected = !isVariationMode && currentPly === idx + 1;
                const isBranchedHere = isVariationMode && variationBranchPly === idx + 1;

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      handleResetToMainLine();
                      setSelectedPly(idx + 1);
                    }}
                    className={`p-2 rounded-lg border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? "bg-cyan-500 text-black border-white shadow-[0_0_12px_rgba(0,242,255,0.4)] font-bold"
                        : isBranchedHere
                        ? "bg-purple-500/25 border-purple-400 text-purple-200 font-bold"
                        : idx % 2 === 0
                        ? "bg-white/[0.03] border-white/10 text-slate-200 hover:bg-white/[0.08]"
                        : "bg-white/[0.02] border-white/5 text-slate-300 hover:bg-white/[0.08]"
                    }`}
                  >
                    <span className="opacity-60 text-xs font-semibold">
                      {Math.floor(idx / 2) + 1}
                      {idx % 2 === 0 ? "." : "…"}
                    </span>
                    <span className="font-bold text-sm">{mv.san}</span>
                    <span className="text-xs opacity-75">{mv.evalStr}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* ── CENTER COLUMN: LARGE CHESSBOARD + EVALUATION BAR ── */}
        <section className="col-span-6 flex flex-col items-center justify-between h-full min-h-0 gap-2">
          {/* Board Viewport with Eval Bar */}
          <div className="flex-1 min-h-0 w-full flex items-center justify-center gap-3">
            {/* Live Stockfish Evaluation Bar */}
            <div
              className="w-4 bg-slate-800 rounded-full overflow-hidden flex flex-col-reverse relative border border-white/20 shrink-0 shadow-lg"
              style={{
                height: "min(68vh, 56vw, 660px)",
              }}
            >
              <div
                className="w-full rounded-full transition-all duration-300 ease-out"
                style={{
                  height: `${evalPercent}%`,
                  background: "linear-gradient(to top, #00F2FF, #00C4D0)",
                  boxShadow: "0 0 12px rgba(0, 242, 255, 0.6)",
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-[10px] font-bold text-white/90 [writing-mode:vertical-lr] rotate-180 drop-shadow">
                  {evalDisplay}
                </span>
              </div>
            </div>

            {/* Analysis Board Frame (Large Size: min 68vh, 56vw, 660px) */}
            <div
              className="relative rounded-2xl p-3 border-2 shadow-2xl flex items-center justify-center"
              style={{
                backgroundColor: "#0B0F19",
                borderColor: isVariationMode
                  ? "rgba(168, 85, 247, 0.5)"
                  : "rgba(0, 242, 255, 0.35)",
                boxShadow: isVariationMode
                  ? "0 0 30px rgba(168,85,247,0.25)"
                  : "0 0 30px rgba(0,242,255,0.2)",
              }}
            >
              <div
                className="grid grid-cols-8 grid-rows-8 rounded-xl overflow-hidden border border-white/10"
                style={{
                  width: "min(68vh, 56vw, 660px)",
                  height: "min(68vh, 56vw, 660px)",
                }}
              >
                {board.map((row, rIdx) =>
                  row.map((cell, cIdx) => {
                    const squareName = `${files[cIdx]}${ranks[rIdx]}` as Square;
                    const isLight = (rIdx + cIdx) % 2 === 0;
                    const isSelected = selectedSquare === squareName;
                    const isPossibleTarget = possibleMoves.includes(squareName);
                    const isLastMove =
                      lastMoveSquares &&
                      (lastMoveSquares.from === squareName ||
                        lastMoveSquares.to === squareName);
                    const isDragOver = dragOverSquare === squareName;

                    return (
                      <div
                        key={squareName}
                        onClick={() => handleSquareClick(squareName)}
                        onDragOver={(e) => handleDragOver(e, squareName)}
                        onDragLeave={() => setDragOverSquare(null)}
                        onDrop={(e) => handleDrop(e, squareName)}
                        className={`relative flex items-center justify-center select-none cursor-pointer transition-colors duration-150 ${
                          isLight ? "board-square-light" : "board-square-dark"
                        } ${isLastMove ? "board-square-lastmove" : ""} ${
                          isSelected
                            ? "board-square-selected ring-2 ring-cyan-400 z-10"
                            : ""
                        } ${
                          isDragOver
                            ? "ring-2 ring-cyan-300 bg-cyan-500/20 z-10"
                            : ""
                        }`}
                      >
                        {/* Rank coordinate */}
                        {cIdx === 0 && (
                          <span
                            className={`absolute top-1 left-1.5 text-xs font-bold select-none pointer-events-none ${
                              isLight ? "text-white/40" : "text-cyan-400/50"
                            }`}
                          >
                            {ranks[rIdx]}
                          </span>
                        )}

                        {/* File coordinate */}
                        {rIdx === 7 && (
                          <span
                            className={`absolute bottom-1 right-1.5 text-xs font-bold select-none pointer-events-none ${
                              isLight ? "text-white/40" : "text-cyan-400/50"
                            }`}
                          >
                            {files[cIdx]}
                          </span>
                        )}

                        {/* Piece */}
                        {cell && (
                          <div
                            draggable
                            onDragStart={(e) => handleDragStart(e, squareName)}
                            className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing"
                          >
                            <ChessPieceSVG
                              type={cell.type}
                              color={cell.color}
                              size="board"
                            />
                          </div>
                        )}

                        {/* Legal Move Dot indicator */}
                        {isPossibleTarget && !cell && (
                          <div className="absolute w-3.5 h-3.5 rounded-full bg-cyan-400/70 shadow-[0_0_8px_rgba(0,242,255,0.8)] pointer-events-none" />
                        )}

                        {/* Capture Ring indicator */}
                        {isPossibleTarget && cell && (
                          <div className="absolute inset-1 rounded-full border-2 border-cyan-400/80 shadow-[0_0_8px_rgba(0,242,255,0.8)] pointer-events-none" />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Stepper Timeline & Navigation Controls */}
          <div className="w-full glass rounded-xl p-2.5 flex items-center justify-between shrink-0 text-xs border border-white/10">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  handleResetToMainLine();
                  setSelectedPly(0);
                }}
                className="nx-btn nx-btn-secondary p-2 rounded-lg"
                title="First Move"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  if (isVariationMode) {
                    // Undo last move in variation
                    setVariationMoves((prev) => prev.slice(0, -1));
                  } else {
                    setSelectedPly((p) =>
                      Math.max(0, (p ?? match.moves.length) - 1)
                    );
                  }
                }}
                className="nx-btn nx-btn-secondary p-2 rounded-lg"
                title="Previous Move"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  if (isPlaying) {
                    setIsPlaying(false);
                  } else {
                    if (currentPly >= match.moves.length) setSelectedPly(0);
                    setIsPlaying(true);
                  }
                }}
                disabled={isVariationMode}
                className="nx-btn nx-btn-primary px-3.5 py-2 rounded-lg text-xs font-bold disabled:opacity-30"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4 fill-current" />
                )}
                <span>{isPlaying ? "PAUSE" : "AUTO-PLAY"}</span>
              </button>

              <button
                onClick={() => {
                  if (!isVariationMode) {
                    setSelectedPly((p) =>
                      Math.min(
                        match.moves.length,
                        (p ?? match.moves.length) + 1
                      )
                    );
                  }
                }}
                disabled={isVariationMode}
                className="nx-btn nx-btn-secondary p-2 rounded-lg disabled:opacity-30"
                title="Next Move"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  handleResetToMainLine();
                  setSelectedPly(match.moves.length);
                }}
                disabled={isVariationMode}
                className="nx-btn nx-btn-secondary p-2 rounded-lg disabled:opacity-30"
                title="Last Move"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-slate-300 text-xs font-medium">
                {isVariationMode
                  ? `Variation Branch: +${variationMoves.length}`
                  : `Ply ${currentPly} / ${match.moves.length}`}
              </span>
              {!isVariationMode && (
                <input
                  type="range"
                  min="0"
                  max={match.moves.length}
                  value={currentPly}
                  onChange={(e) => setSelectedPly(Number(e.target.value))}
                  className="w-36 cursor-pointer accent-cyan-400"
                />
              )}
            </div>
          </div>
        </section>

        {/* ── RIGHT COLUMN: ENGINE INTELLIGENCE & SANDBOX TOOLS ── */}
        <aside className="col-span-3 flex flex-col justify-between h-full min-h-0 gap-2.5">
          <div className="flex flex-col gap-2.5">
            {/* Live Stockfish 19 NNUE Evaluation Card */}
            <div className="glass rounded-xl p-3.5 flex flex-col gap-2.5 border border-white/10">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-cyan-400" />
                  Stockfish 19 Evaluation
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 font-bold border border-cyan-500/30">
                  NNUE NET
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#0F1420] p-3 rounded-xl border border-white/10 text-center">
                  <span className="text-xs text-slate-400 block mb-0.5">
                    Position Eval
                  </span>
                  <span
                    className={`text-xl font-bold ${
                      currentEvalCp >= 0 ? "text-cyan-400" : "text-purple-400"
                    }`}
                  >
                    {evalDisplay}
                  </span>
                </div>
                <div className="bg-[#0F1420] p-3 rounded-xl border border-white/10 text-center">
                  <span className="text-xs text-slate-400 block mb-0.5">
                    Game Accuracy
                  </span>
                  <span className="text-xl font-bold text-emerald-400">
                    {match.accuracy.split(" ")[0]}
                  </span>
                </div>
              </div>

              {/* Engine Suggestion & Play Move Action */}
              {engineSuggestedMove && (
                <div className="bg-cyan-950/30 border border-cyan-500/30 rounded-xl p-2.5 flex items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-cyan-300 uppercase font-semibold">
                      Best Engine Move
                    </span>
                    <span className="font-bold text-sm text-white">
                      {engineSuggestedMove}
                    </span>
                  </div>

                  <button
                    onClick={handlePlayEngineMove}
                    className="px-2.5 py-1.5 rounded-lg bg-cyan-400 text-black hover:bg-cyan-300 text-xs font-bold flex items-center gap-1 transition-all shadow-[0_0_10px_rgba(0,242,255,0.4)]"
                  >
                    <span>Play Move</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Sandbox Guidance Card */}
            <div className="glass rounded-xl p-3 flex flex-col gap-2 border border-white/10 text-xs">
              <span className="font-bold text-white uppercase flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                Interactive Sandbox
              </span>
              <p className="text-slate-300 text-xs leading-relaxed">
                Click or drag any piece on the board to test alternative moves.
                Stockfish 19 NNUE will evaluate your custom variation in real time.
              </p>
              {isVariationMode && (
                <button
                  onClick={handleResetToMainLine}
                  className="w-full py-2 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/50 text-purple-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Return to Main Line</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col gap-2 mt-auto">
            <Link
              href="/play"
              className="nx-btn nx-btn-primary w-full py-2.5 rounded-xl text-xs font-bold justify-center shadow-[0_0_15px_rgba(0,242,255,0.25)]"
            >
              <Swords className="w-4 h-4" />
              <span>DEPLOY ARENA REMATCH</span>
            </Link>
            <Link
              href="/profile"
              className="nx-btn nx-btn-secondary w-full py-2 rounded-xl text-xs font-semibold justify-center text-center hover:border-cyan-400"
            >
              View Career Profile
            </Link>
          </div>
        </aside>
      </main>
    </div>
  );
}

export default function PostMatchAnalysisPage() {
  return (
    <Suspense
      fallback={
        <div
          className="h-screen flex items-center justify-center"
          style={{ backgroundColor: "#070A0F" }}
        >
          <div className="flex flex-col items-center gap-3 animate-pulse-glow">
            <BarChart3 className="w-8 h-8 text-[var(--nx-cyan)]" />
            <span className="text-xs font-bold text-cyan-400">
              INITIALIZING STOCKFISH 19 ANALYSIS LAB...
            </span>
          </div>
        </div>
      }
    >
      <AnalysisContent />
    </Suspense>
  );
}