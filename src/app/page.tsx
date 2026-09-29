"use client";

import React, { useState, useMemo, useSyncExternalStore, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Play,
  Bot,
  Brain,
  Clock,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Shield,
  Award,
  Zap,
  Swords,
  BarChart3,
  Cpu,
} from "lucide-react";
import { subscribeMatches, getStoredMatches, getMatchesServerSnapshot } from "@/lib/matchStorage";
import {
  getUserProfile,
  subscribeUser,
  getUserServerSnapshot,
} from "@/lib/authStorage";
import { ALL_TIME_CONTROLS, ENGINE_BOTS, getBotById } from "@/lib/chessConstants";
import { NexusHeader } from "@/components/NexusHeader";

/* ── Animated background particles ────────────────────────── */
function BackgroundParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    const particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number }[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Create particles
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.2 + 0.04,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 242, 255, ${p.alpha})`;
        ctx.fill();
      });

      particles.forEach((p1, i) => {
        particles.slice(i + 1).forEach((p2) => {
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(0, 242, 255, ${0.03 * (1 - dist / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.4 }}
    />
  );
}

export default function ArenaLobby() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<
    "ALL" | "BULLET" | "BLITZ" | "RAPID" | "CLASSICAL"
  >("BLITZ");
  const [selectedTimeId, setSelectedTimeId] = useState<string>("3+2");
  const [selectedBotId, setSelectedBotId] = useState<string>("lvl-15");

  // Dynamic state from persistent stores
  const matches = useSyncExternalStore(
    subscribeMatches,
    getStoredMatches,
    getMatchesServerSnapshot
  );

  const user = useSyncExternalStore(
    subscribeUser,
    getUserProfile,
    getUserServerSnapshot
  );

  // Compute live career statistics
  const stats = useMemo(() => {
    const total = matches.length;
    if (total === 0) {
      return { total: 0, winRate: 100, elo: user.rating, wins: 0, losses: 0 };
    }
    const wins = matches.filter((m) => m.result === "VICTORY").length;
    const losses = matches.filter((m) => m.result === "DEFEAT").length;
    const winRate = Math.round((wins / total) * 100);
    return { total, winRate, elo: user.rating, wins, losses };
  }, [matches, user]);

  const filteredTimeControls = useMemo(() => {
    if (selectedCategory === "ALL") return ALL_TIME_CONTROLS;
    return ALL_TIME_CONTROLS.filter((tc) => tc.category === selectedCategory);
  }, [selectedCategory]);

  const selectedBot = useMemo(() => {
    return getBotById(selectedBotId);
  }, [selectedBotId]);

  const selectedTime = useMemo(() => {
    return (
      ALL_TIME_CONTROLS.find((tc) => tc.id === selectedTimeId) ||
      ALL_TIME_CONTROLS[4] // 3+2
    );
  }, [selectedTimeId]);

  const handleLaunchGame = () => {
    router.push(
      `/play?time=${encodeURIComponent(selectedTimeId)}&bot=${encodeURIComponent(selectedBotId)}`
    );
  };

  const handleLevelChange = (newLevel: number) => {
    const clamped = Math.max(1, Math.min(20, newLevel));
    const targetBot = ENGINE_BOTS.find((b) => b.level === clamped);
    if (targetBot) {
      setSelectedBotId(targetBot.id);
    }
  };

  // Tier jump helper
  const handleTierJump = (tier: "NOVICE" | "TACTICAL" | "EXPERT" | "GRANDMASTER") => {
    switch (tier) {
      case "NOVICE":
        handleLevelChange(1);
        break;
      case "TACTICAL":
        handleLevelChange(6);
        break;
      case "EXPERT":
        handleLevelChange(11);
        break;
      case "GRANDMASTER":
        handleLevelChange(16);
        break;
    }
  };

  return (
    <div
      className="text-[var(--nx-text-primary)] h-screen max-h-screen overflow-hidden flex flex-col selection:bg-[var(--nx-cyan)] selection:text-black relative"
      style={{ backgroundColor: "#070A0F" }}
    >
      <BackgroundParticles />
      <div className="fixed inset-0 bg-mesh-gradient pointer-events-none z-0" />
      <div className="fixed inset-0 bg-grid-pattern opacity-10 pointer-events-none z-0" />

      <NexusHeader chipLabel="COMMAND CENTER" elo={stats.elo} />

      {/* ═══ COMMAND CENTER WORKSPACE (STRICT ZERO-SCROLL 100vh) ═══ */}
      <main className="flex-1 min-h-0 px-4 md:px-6 py-2.5 flex flex-col gap-2.5 max-w-[1560px] mx-auto w-full relative z-10 overflow-hidden">
        {/* Compact Header Status Bar */}
        <section className="glass rounded-xl px-4 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-[var(--nx-border)] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--nx-cyan)]/15 border border-[var(--nx-cyan)]/30 flex items-center justify-center text-[var(--nx-cyan)]">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold tracking-wider text-white font-headline">
                  TACTICAL DEPLOYMENT CENTER
                </h1>
                <span className="nx-chip font-mono-data text-[9px] py-0.5 px-1.5 bg-[var(--nx-cyan)]/10 text-[var(--nx-cyan)] border border-[var(--nx-cyan)]/30">
                  STOCKFISH 10 NNUE
                </span>
              </div>
              <p className="text-[10px] text-[var(--nx-text-muted)] font-mono-data">
                20 CALIBRATED TIERS • GENUINE UCI WORKER ENGINE • ZERO-SCROLL COMMAND
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 font-mono-data text-xs">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--nx-bg-surface)] border border-[var(--nx-border)]">
              <Shield className="w-3.5 h-3.5 text-[var(--nx-green)]" />
              <span className="text-[var(--nx-text-secondary)] text-[10px]">OPERATOR:</span>
              <span className="text-white font-bold text-[11px]">{user.username}</span>
              <span className="text-[var(--nx-cyan)] text-[10px] font-bold">({user.rating})</span>
            </div>

            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--nx-bg-surface)] border border-[var(--nx-border)]">
              <Award className="w-3.5 h-3.5 text-[var(--nx-violet)]" />
              <span className="text-[var(--nx-text-secondary)] text-[10px]">RECORD:</span>
              <span className="text-[var(--nx-green)] font-bold text-[11px]">{stats.wins}W</span>
              <span className="text-[var(--nx-red)] font-bold text-[11px]">{stats.losses}L</span>
              <span className="text-[var(--nx-text-muted)] text-[10px]">({stats.winRate}%)</span>
            </div>
          </div>
        </section>

        {/* ═══ TWO-COLUMN COMMAND GRID ═══ */}
        <div className="flex-1 min-h-0 grid grid-cols-12 gap-3 overflow-hidden">
          {/* ── LEFT COLUMN: 20-LEVEL ENGINE TARGET MATRIX ── */}
          <div className="col-span-12 lg:col-span-7 flex flex-col gap-2.5 min-h-0 h-full">
            {/* Target Bot Tactical Card */}
            <div
              className="glass rounded-2xl p-4 flex flex-col justify-between gap-3 border transition-all flex-1 min-h-0 relative overflow-hidden"
              style={{
                borderColor: `${selectedBot.avatarColor}40`,
                boxShadow: `0 0 24px ${selectedBot.avatarColor}15`,
              }}
            >
              {/* Background ambient glow */}
              <div
                className="absolute top-0 right-0 w-64 h-64 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none"
                style={{ backgroundColor: `${selectedBot.avatarColor}15` }}
              />

              {/* Bot Identity Header */}
              <div className="flex items-start justify-between relative z-10 shrink-0">
                <div className="flex items-center gap-3.5">
                  <div
                    className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl border-2 flex items-center justify-center shadow-lg transition-transform group-hover:scale-105 shrink-0"
                    style={{
                      backgroundColor: `${selectedBot.avatarColor}20`,
                      color: selectedBot.avatarColor,
                      borderColor: `${selectedBot.avatarColor}70`,
                      boxShadow: `0 0 20px ${selectedBot.avatarColor}35`,
                    }}
                  >
                    <Bot className="w-7 h-7 sm:w-8 sm:h-8" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base sm:text-lg font-bold text-white font-headline tracking-wide">
                        {selectedBot.name}
                      </span>
                      <span
                        className="nx-chip font-mono-data text-[9px] py-0.5 px-2 font-bold"
                        style={{
                          color: selectedBot.avatarColor,
                          backgroundColor: `${selectedBot.avatarColor}18`,
                          border: `1px solid ${selectedBot.avatarColor}40`,
                        }}
                      >
                        LVL {selectedBot.level} • {selectedBot.title}
                      </span>
                      <span className="nx-chip font-mono-data text-[9px] py-0.5 px-2 bg-white/5 text-[var(--nx-text-secondary)] border border-white/10">
                        {selectedBot.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono-data text-xs font-bold text-[var(--nx-cyan)]">
                        {selectedBot.elo} ELO
                      </span>
                      <span className="text-[var(--nx-text-muted)] text-[11px]">•</span>
                      <span className="text-[11px] text-[var(--nx-text-secondary)] font-mono-data">
                        Stockfish UCI Calibrated
                      </span>
                    </div>
                  </div>
                </div>

                {/* Rating Badge */}
                <div
                  className="hidden sm:flex flex-col items-end px-3 py-1.5 rounded-xl border font-mono-data text-right"
                  style={{
                    backgroundColor: `${selectedBot.avatarColor}10`,
                    borderColor: `${selectedBot.avatarColor}30`,
                  }}
                >
                  <span className="text-[8px] text-[var(--nx-text-muted)] uppercase tracking-wider">
                    TARGET POWER
                  </span>
                  <span
                    className="text-base font-bold"
                    style={{ color: selectedBot.avatarColor }}
                  >
                    {selectedBot.elo}
                  </span>
                </div>
              </div>

              {/* Bot Playstyle Description */}
              <div className="bg-[var(--nx-bg-surface)]/60 p-2.5 rounded-xl border border-[var(--nx-border)] relative z-10 shrink-0">
                <p className="text-[11px] sm:text-xs text-[var(--nx-text-secondary)] leading-relaxed italic">
                  &ldquo;{selectedBot.desc}&rdquo;
                </p>
              </div>

              {/* Technical Telemetry 4-Cell Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono-data relative z-10 shrink-0">
                <div className="bg-[var(--nx-bg-card)]/90 p-2 rounded-xl border border-[var(--nx-border)]">
                  <span className="text-[8px] text-[var(--nx-text-muted)] block mb-0.5">
                    SEARCH DEPTH
                  </span>
                  <span className="text-xs font-bold text-[var(--nx-cyan)] flex items-center gap-1">
                    <Brain className="w-3 h-3 text-[var(--nx-cyan)]" />
                    {selectedBot.depth} Plies
                  </span>
                </div>

                <div className="bg-[var(--nx-bg-card)]/90 p-2 rounded-xl border border-[var(--nx-border)]">
                  <span className="text-[8px] text-[var(--nx-text-muted)] block mb-0.5">
                    UCI SKILL
                  </span>
                  <span className="text-xs font-bold text-[var(--nx-green)] flex items-center gap-1">
                    <Cpu className="w-3 h-3 text-[var(--nx-green)]" />
                    Skill {selectedBot.skillLevel} / 20
                  </span>
                </div>

                <div className="bg-[var(--nx-bg-card)]/90 p-2 rounded-xl border border-[var(--nx-border)]">
                  <span className="text-[8px] text-[var(--nx-text-muted)] block mb-0.5">
                    LATENCY
                  </span>
                  <span className="text-xs font-bold text-[var(--nx-violet)] flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[var(--nx-violet)]" />
                    ~{selectedBot.moveTimeMs}ms
                  </span>
                </div>

                <div className="bg-[var(--nx-bg-card)]/90 p-2 rounded-xl border border-[var(--nx-border)]">
                  <span className="text-[8px] text-[var(--nx-text-muted)] block mb-0.5">
                    EVALUATION
                  </span>
                  <span className="text-xs font-bold text-[var(--nx-amber)] flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[var(--nx-amber)]" />
                    NNUE Net
                  </span>
                </div>
              </div>

              {/* ═══ INTERACTIVE 20-LEVEL SLIDER & CONTROLS ═══ */}
              <div className="pt-2 border-t border-[var(--nx-border)] flex flex-col gap-2 relative z-10 shrink-0">
                {/* Tier Quick Jumps */}
                <div className="flex items-center justify-between gap-1 text-[10px] font-mono-data">
                  <span className="text-[var(--nx-text-muted)] text-[9px] uppercase tracking-wider hidden sm:inline">
                    TIERS:
                  </span>
                  <div className="flex items-center gap-1 flex-1 sm:flex-initial">
                    {(
                      [
                        { tier: "NOVICE", label: "NOVICE (1-5)", color: "#6FFBBE" },
                        { tier: "TACTICAL", label: "TACTICAL (6-10)", color: "#00F2FF" },
                        { tier: "EXPERT", label: "EXPERT (11-15)", color: "#C084FC" },
                        { tier: "GRANDMASTER", label: "GM (16-20)", color: "#FB7185" },
                      ] as const
                    ).map((t) => {
                      const isActive = selectedBot.category === t.tier;
                      return (
                        <button
                          key={t.tier}
                          onClick={() => handleTierJump(t.tier)}
                          className={`px-2 py-1 rounded-md text-[9px] font-bold transition-all flex-1 sm:flex-initial ${
                            isActive
                              ? "bg-white/15 text-white shadow-sm border"
                              : "text-[var(--nx-text-muted)] hover:text-white bg-[var(--nx-bg-surface)] border border-[var(--nx-border)]"
                          }`}
                          style={{
                            borderColor: isActive ? t.color : undefined,
                            color: isActive ? t.color : undefined,
                          }}
                        >
                          {t.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Range Slider with Steppers */}
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => handleLevelChange(selectedBot.level - 1)}
                    disabled={selectedBot.level <= 1}
                    className="w-7 h-7 rounded-lg bg-[var(--nx-bg-card)] border border-[var(--nx-border)] hover:border-[var(--nx-cyan)] text-[var(--nx-text-secondary)] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all shrink-0"
                    title="Previous Level"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex-1 flex flex-col gap-1">
                    <input
                      type="range"
                      min={1}
                      max={20}
                      value={selectedBot.level}
                      onChange={(e) => handleLevelChange(Number(e.target.value))}
                      className="w-full h-2 cursor-pointer"
                    />
                  </div>

                  <button
                    onClick={() => handleLevelChange(selectedBot.level + 1)}
                    disabled={selectedBot.level >= 20}
                    className="w-7 h-7 rounded-lg bg-[var(--nx-bg-card)] border border-[var(--nx-border)] hover:border-[var(--nx-cyan)] text-[var(--nx-text-secondary)] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all shrink-0"
                    title="Next Level"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <div
                    className="px-2.5 py-1 rounded-lg border font-mono-data text-xs font-bold shrink-0 min-w-[64px] text-center"
                    style={{
                      borderColor: `${selectedBot.avatarColor}60`,
                      backgroundColor: `${selectedBot.avatarColor}15`,
                      color: selectedBot.avatarColor,
                    }}
                  >
                    LVL {selectedBot.level}
                  </div>
                </div>

                {/* 20-Button Micro Carousel Pill Strip */}
                <div className="grid grid-cols-10 sm:grid-cols-20 gap-1 pt-1">
                  {ENGINE_BOTS.map((bot) => {
                    const isCurrent = bot.id === selectedBot.id;
                    return (
                      <button
                        key={bot.id}
                        onClick={() => setSelectedBotId(bot.id)}
                        title={`${bot.name} (LVL ${bot.level} • ${bot.elo} ELO)`}
                        className={`py-1 text-[9px] font-mono-data font-bold rounded transition-all text-center ${
                          isCurrent
                            ? "bg-white text-black shadow-md scale-105"
                            : "bg-[var(--nx-bg-surface)] text-[var(--nx-text-muted)] hover:text-white border border-[var(--nx-border)] hover:border-white/20"
                        }`}
                        style={{
                          backgroundColor: isCurrent ? bot.avatarColor : undefined,
                          color: isCurrent ? "#000" : undefined,
                        }}
                      >
                        {bot.level}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN: TIME CONTROLS & DEPLOYMENT CONSOLE ── */}
          <div className="col-span-12 lg:col-span-5 flex flex-col gap-2.5 min-h-0 h-full">
            {/* Time Controls Matrix */}
            <div className="glass rounded-2xl p-4 flex flex-col gap-2 border border-[var(--nx-border)] shrink-0">
              <div className="flex items-center justify-between border-b border-[var(--nx-border)] pb-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[var(--nx-cyan)]" />
                  <span className="text-xs font-bold text-white uppercase font-mono-data tracking-wide">
                    MATCH TIME CONTROL
                  </span>
                </div>

                {/* Category tabs */}
                <div className="flex items-center gap-1 font-mono-data">
                  {(["ALL", "BULLET", "BLITZ", "RAPID", "CLASSICAL"] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all ${
                        selectedCategory === cat
                          ? "bg-[var(--nx-cyan)] text-black font-extrabold"
                          : "text-[var(--nx-text-muted)] hover:text-white bg-[var(--nx-bg-surface)] border border-[var(--nx-border)]"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Compact Grid of Time Controls */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-[140px] overflow-y-auto pr-0.5">
                {filteredTimeControls.map((tc) => {
                  const isSelected = selectedTimeId === tc.id;
                  return (
                    <button
                      key={tc.id}
                      onClick={() => setSelectedTimeId(tc.id)}
                      className={`p-2 rounded-xl text-left flex flex-col justify-between gap-1 transition-all border ${
                        isSelected
                          ? "border-[var(--nx-cyan)] bg-[var(--nx-cyan)]/15 shadow-[0_0_12px_rgba(0,242,255,0.2)]"
                          : "border-[var(--nx-border)] bg-[var(--nx-bg-card)]/70 hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono-data text-xs font-bold text-white">
                          {tc.timeLabel}
                        </span>
                        <span className="text-[7px] font-mono-data text-[var(--nx-text-muted)] px-1 rounded bg-black/30">
                          {tc.category.slice(0, 3)}
                        </span>
                      </div>
                      <span className="text-[9px] text-[var(--nx-text-secondary)] truncate">
                        {tc.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mission Deployment & Launch Console */}
            <div className="glass rounded-2xl p-4 flex flex-col justify-between gap-3 border border-[var(--nx-border)] flex-1 min-h-0 relative overflow-hidden">
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between border-b border-[var(--nx-border)] pb-2 font-mono-data text-xs">
                  <span className="font-bold text-white uppercase flex items-center gap-1.5">
                    <Swords className="w-3.5 h-3.5 text-[var(--nx-cyan)]" />
                    TACTICAL SUMMARY
                  </span>
                  <span className="text-[var(--nx-green)] text-[10px] flex items-center gap-1 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--nx-green)] animate-ping" />
                    READY TO DEPLOY
                  </span>
                </div>

                {/* Match Summary Breakdown */}
                <div className="flex flex-col gap-1.5 font-mono-data text-[11px]">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--nx-bg-card)]/80 border border-[var(--nx-border)]">
                    <span className="text-[var(--nx-text-secondary)]">OPPONENT:</span>
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: selectedBot.avatarColor }}
                      />
                      {selectedBot.name} ({selectedBot.elo} ELO)
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--nx-bg-card)]/80 border border-[var(--nx-border)]">
                    <span className="text-[var(--nx-text-secondary)]">CLOCK FORMAT:</span>
                    <span className="font-bold text-[var(--nx-cyan)]">
                      {selectedTime.name} ({selectedTime.timeLabel})
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--nx-bg-card)]/80 border border-[var(--nx-border)]">
                    <span className="text-[var(--nx-text-secondary)]">ARENA RULES:</span>
                    <span className="text-[var(--nx-violet)] font-bold">
                      FIDE Touch-Move • Clean Arena
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons Container */}
              <div className="flex flex-col gap-2 shrink-0">
                {/* ═══ HIGH-IMPACT "DEPLOY ARENA" BUTTON ═══ */}
                <button
                  onClick={handleLaunchGame}
                  className="nx-btn nx-btn-primary w-full py-3.5 px-6 rounded-xl text-xs sm:text-sm font-bold tracking-wider group shadow-[0_0_20px_rgba(0,242,255,0.3)] flex items-center justify-center gap-2.5 transition-all"
                >
                  <Play className="w-4 h-4 fill-current transition-transform group-hover:scale-110" />
                  <span>DEPLOY ARENA</span>
                  <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>

                {/* Sub links */}
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono-data">
                  <Link
                    href="/profile"
                    className="p-2 rounded-lg bg-[var(--nx-bg-surface)] hover:bg-[var(--nx-bg-elevated)] border border-[var(--nx-border)] hover:border-[var(--nx-cyan)]/40 text-[var(--nx-text-secondary)] hover:text-white flex items-center justify-center gap-1.5 transition-all"
                  >
                    <BarChart3 className="w-3 h-3 text-[var(--nx-cyan)]" />
                    <span>CAREER ARCHIVES</span>
                  </Link>

                  <Link
                    href="/analysis"
                    className="p-2 rounded-lg bg-[var(--nx-bg-surface)] hover:bg-[var(--nx-bg-elevated)] border border-[var(--nx-border)] hover:border-[var(--nx-violet)]/40 text-[var(--nx-text-secondary)] hover:text-white flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Brain className="w-3 h-3 text-[var(--nx-violet)]" />
                    <span>ENGINE LAB</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}