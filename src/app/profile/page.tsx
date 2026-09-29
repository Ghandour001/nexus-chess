"use client";

import React, { useState, useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Trophy,
  Flame,
  TrendingUp,
  Target,
  Swords,
  Crown,
  Zap,
  Star,
  Edit3,
  Bot,
  Cpu,
} from "lucide-react";
import {
  getStoredMatches,
  subscribeMatches,
  getMatchesServerSnapshot,
} from "@/lib/matchStorage";
import {
  getUserProfile,
  subscribeUser,
  getUserServerSnapshot,
} from "@/lib/authStorage";
import { NexusHeader } from "@/components/NexusHeader";
import { AuthModal } from "@/components/AuthModal";

export default function CareerProfilePage() {
  const [authModalOpen, setAuthModalOpen] = useState(false);

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

  const stats = useMemo(() => {
    const total = matches.length;
    const wins = matches.filter((m) => m.result === "VICTORY").length;
    const losses = matches.filter((m) => m.result === "DEFEAT").length;
    const draws = total - wins - losses;
    const winRate = total > 0 ? Math.round((wins / total) * 100) : 100;
    return { total, wins, losses, draws, winRate };
  }, [matches]);

  const renderAvatarIcon = () => {
    switch (user.avatar) {
      case "neural-queen":
        return <Crown className="w-8 h-8" />;
      case "synth-knight":
        return <ShieldCheck className="w-8 h-8" />;
      case "matrix-rook":
        return <Zap className="w-8 h-8" />;
      case "quantum-titan":
        return <Flame className="w-8 h-8" />;
      case "zero-ghost":
        return <Bot className="w-8 h-8" />;
      default:
        return <Cpu className="w-8 h-8" />;
    }
  };

  return (
    <div
      className="text-[var(--nx-text-primary)] h-screen max-h-screen overflow-hidden flex flex-col select-none relative"
      style={{ backgroundColor: "#070A0F" }}
    >
      <div className="absolute inset-0 bg-mesh-gradient pointer-events-none" />
      <div className="absolute inset-0 bg-grid-pattern opacity-15 pointer-events-none" />

      <NexusHeader chipLabel="CAREER TELEMETRY" />

      {/* ═══ MAIN WORKSPACE (STRICT ZERO-SCROLL 100vh) ═══ */}
      <main className="flex-1 min-h-0 px-4 md:px-6 py-3 grid grid-cols-12 gap-4 overflow-hidden max-w-[1600px] mx-auto w-full relative z-10">
        {/* LEFT: IDENTITY & VECTORS */}
        <aside className="col-span-4 flex flex-col gap-3 min-h-0 h-full animate-fade-in">
          {/* Identity card */}
          <div className="glass rounded-2xl p-5 flex flex-col gap-4 relative overflow-hidden shrink-0 border border-[var(--nx-border)]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--nx-cyan)]/5 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/3" />

            <div className="flex items-center justify-between relative">
              <div className="flex items-center gap-3.5">
                <div
                  className="w-14 h-14 rounded-2xl border-2 flex items-center justify-center shadow-lg transition-all"
                  style={{
                    backgroundColor: `${user.avatarColor}20`,
                    color: user.avatarColor,
                    borderColor: `${user.avatarColor}60`,
                    boxShadow: `0 0 20px ${user.avatarColor}30`,
                  }}
                >
                  {renderAvatarIcon()}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-white font-headline">
                      {user.username}
                    </span>
                    {user.title && user.title !== "NONE" && (
                      <span className="nx-chip bg-[var(--nx-purple)]/20 text-[var(--nx-violet)] border border-[var(--nx-purple)]/30 text-[9px] py-0.5 px-1.5">
                        {user.title}
                      </span>
                    )}
                  </div>
                  <span className="font-mono-data text-[10px] text-[var(--nx-text-muted)]">
                    {user.bio || "NEXUS QUANTUM // TOKYO DIVISION"}
                  </span>
                  <span className="font-mono-data text-[9px] text-[var(--nx-green)] mt-0.5 flex items-center gap-1">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--nx-green)] opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--nx-green)]" />
                    </span>
                    AUTHENTIC OPERATOR • {user.joinedDate}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setAuthModalOpen(true)}
                className="w-8 h-8 rounded-lg bg-[var(--nx-bg-card)] border border-[var(--nx-border)] hover:border-[var(--nx-cyan)] text-[var(--nx-text-muted)] hover:text-[var(--nx-cyan)] flex items-center justify-center transition-all"
                title="Edit Persona"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Rating categories */}
            <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-[var(--nx-border)] font-mono-data">
              {[
                { label: "BULLET", rating: user.bulletRating, color: "var(--nx-cyan)" },
                { label: "BLITZ", rating: user.blitzRating, color: "var(--nx-cyan)", active: true },
                { label: "RAPID", rating: user.rapidRating, color: "var(--nx-violet)" },
                { label: "CLASSICAL", rating: user.classicalRating, color: "var(--nx-green)" },
              ].map((r) => (
                <div
                  key={r.label}
                  className={`bg-[var(--nx-bg-card)] p-2 rounded-xl border text-center transition-all ${
                    r.active
                      ? "border-[var(--nx-cyan)]/40 shadow-[0_0_8px_rgba(0,242,255,0.15)]"
                      : "border-[var(--nx-border)]"
                  }`}
                >
                  <span className="text-[8px] text-[var(--nx-text-muted)] block mb-0.5">
                    {r.label}
                  </span>
                  <span
                    className="text-xs font-bold"
                    style={{ color: r.color }}
                  >
                    {r.rating}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Combat style vectors */}
          <div className="glass rounded-2xl p-5 flex flex-col gap-3 flex-1 min-h-0 border border-[var(--nx-border)]">
            <span className="font-bold text-xs text-white uppercase tracking-wide font-mono-data flex items-center gap-2 shrink-0">
              <Target className="w-4 h-4 text-[var(--nx-cyan)]" />
              Combat Style Vectors (Dynamic)
            </span>

            <div className="flex flex-col gap-3 font-mono-data text-xs overflow-y-auto">
              {[
                { label: "AGGRESSION INDEX", value: user.aggressionIndex, color: "var(--nx-cyan)" },
                { label: "ENDGAME CONVERSION", value: user.endgameConversion, color: "var(--nx-green)" },
                { label: "TACTICAL ACCURACY", value: user.tacticalAccuracy, color: "var(--nx-violet)" },
                { label: "OPENING DEPTH", value: user.openingDepth, color: "var(--nx-amber)" },
              ].map((vec) => (
                <div key={vec.label}>
                  <div className="flex justify-between text-[var(--nx-text-secondary)] mb-1 text-[10px]">
                    <span>{vec.label}</span>
                    <span style={{ color: vec.color }} className="font-bold">
                      {vec.value}%
                    </span>
                  </div>
                  <div className="nx-progress">
                    <div
                      className="nx-progress-bar"
                      style={{
                        width: `${vec.value}%`,
                        background: `linear-gradient(90deg, ${vec.color}80, ${vec.color})`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* RIGHT: METRICS & RECENT MATCHES */}
        <section className="col-span-8 flex flex-col gap-3 min-h-0 h-full animate-slide-up">
          {/* Top stats row */}
          <div className="grid grid-cols-2 gap-3 shrink-0">
            {/* Career record */}
            <div className="glass rounded-2xl p-4 flex items-center justify-between relative overflow-hidden border border-[var(--nx-border)]">
              <div className="flex flex-col gap-1 relative font-mono-data">
                <span className="text-[10px] text-[var(--nx-text-muted)] uppercase tracking-wider">
                  CAREER RECORD
                </span>
                <span className="text-2xl font-bold text-white font-headline">
                  {stats.total}
                  <span className="text-xs text-[var(--nx-text-muted)] ml-1 font-normal">
                    MATCHES
                  </span>
                </span>
                <div className="flex items-center gap-2.5 text-xs mt-0.5">
                  <span className="flex items-center gap-1 text-[var(--nx-green)] font-bold">
                    <TrendingUp className="w-3 h-3" />
                    <span>{stats.wins}W</span>
                  </span>
                  <span className="text-[var(--nx-red)] font-bold">{stats.losses}L</span>
                  <span className="text-[var(--nx-text-muted)] font-bold">{stats.draws}D</span>
                </div>
              </div>

              {/* Win rate ring */}
              <div className="relative w-20 h-20 shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="var(--nx-bg-active)"
                    strokeWidth="6"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="url(#winRateGrad)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${(stats.winRate / 100) * 251} 251`}
                    className="transition-all duration-700 ease-out"
                  />
                  <defs>
                    <linearGradient id="winRateGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="var(--nx-cyan)" />
                      <stop offset="100%" stopColor="var(--nx-green)" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-mono-data text-base font-bold text-[var(--nx-cyan)]">
                    {stats.winRate}%
                  </span>
                </div>
              </div>
            </div>

            {/* Achievements */}
            <div className="glass rounded-2xl p-4 flex flex-col justify-between border border-[var(--nx-border)]">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-xs text-white uppercase font-mono-data flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-[var(--nx-amber)]" />
                  ACHIEVEMENTS
                </span>
                <span className="nx-chip bg-[var(--nx-amber)]/15 text-[var(--nx-amber)] border border-[var(--nx-amber)]/30 text-[8px]">
                  6 UNLOCKED
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 font-mono-data">
                {[
                  { icon: Trophy, label: "GP CHAMPION", color: "var(--nx-cyan)" },
                  { icon: ShieldCheck, label: "NNUE SLAYER", color: "var(--nx-violet)" },
                  { icon: Flame, label: "HOT STREAK", color: "var(--nx-green)" },
                  { icon: Crown, label: "UNBEATABLE", color: "var(--nx-amber)" },
                  { icon: Zap, label: "SPEED DEMON", color: "var(--nx-cyan)" },
                  { icon: Swords, label: "TACTICIAN", color: "var(--nx-violet)" },
                ].map((ach) => (
                  <div
                    key={ach.label}
                    className="p-1.5 bg-[var(--nx-bg-card)] rounded-lg border border-[var(--nx-border)] text-center flex flex-col items-center gap-1 hover:border-[var(--nx-cyan)]/30 transition-all"
                  >
                    <ach.icon className="w-4 h-4" style={{ color: ach.color }} />
                    <span className="text-[7px] text-[var(--nx-text-secondary)] font-bold truncate w-full">
                      {ach.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent matches table (Internal Scroll Only - No Window Scroll) */}
          <div className="glass rounded-2xl p-4 flex-1 flex flex-col gap-2 min-h-0 overflow-hidden border border-[var(--nx-border)]">
            <div className="flex items-center justify-between font-mono-data text-xs shrink-0 border-b border-[var(--nx-border)] pb-2">
              <span className="font-bold text-white uppercase flex items-center gap-1.5">
                <Swords className="w-3.5 h-3.5 text-[var(--nx-cyan)]" />
                RECENT COMBAT SESSIONS
              </span>
              <span className="text-[var(--nx-cyan-dim)] text-[10px]">
                {matches.length} RECORDED
              </span>
            </div>

            <div className="overflow-y-auto flex-1 pr-1 font-mono-data text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[var(--nx-text-muted)] border-b border-[var(--nx-border)] text-[10px]">
                    <th className="pb-1.5 font-medium">FORMAT</th>
                    <th className="pb-1.5 font-medium">OPPONENT</th>
                    <th className="pb-1.5 font-medium">RESULT</th>
                    <th className="pb-1.5 font-medium">ACCURACY</th>
                    <th className="pb-1.5 font-medium">TIME</th>
                    <th className="pb-1.5 text-right font-medium">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--nx-border-subtle)] text-[11px]">
                  {matches.map((m) => (
                    <tr
                      key={m.id}
                      className="hover:bg-[var(--nx-bg-elevated)]/50 transition-colors group"
                    >
                      <td className="py-2 text-[var(--nx-text-secondary)]">{m.format}</td>
                      <td className="py-2 text-white font-semibold">{m.opponent}</td>
                      <td
                        className={`py-2 font-bold ${
                          m.result === "VICTORY"
                            ? "text-[var(--nx-green)]"
                            : m.result === "DEFEAT"
                            ? "text-[var(--nx-red)]"
                            : "text-[var(--nx-violet)]"
                        }`}
                      >
                        {m.result}{" "}
                        <span className="text-[var(--nx-text-muted)] font-normal text-[10px]">
                          ({m.eloChange})
                        </span>
                      </td>
                      <td className="py-2 text-[var(--nx-text-secondary)]">{m.accuracy}</td>
                      <td className="py-2 text-[var(--nx-text-muted)] text-[10px]">
                        {m.timestamp}
                      </td>
                      <td className="py-2 text-right">
                        <Link
                          href={`/analysis?id=${m.id}`}
                          className="nx-btn nx-btn-secondary py-1 px-2.5 rounded-md text-[9px] group-hover:border-[var(--nx-cyan)]/40 transition-all"
                        >
                          REVIEW
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {matches.length === 0 && (
                <div className="py-10 text-center text-[var(--nx-text-muted)] text-xs flex flex-col items-center gap-2">
                  <Target className="w-5 h-5 text-[var(--nx-cyan)]/40" />
                  No matches recorded yet. Deploy to the Arena to start your career!
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Auth Modal for profile edits */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialTab="edit"
        user={user}
      />
    </div>
  );
}
