"use client";

import React, { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Zap, User, Crown, Shield, Cpu, Flame, Bot, LogIn } from "lucide-react";
import {
  getUserProfile,
  subscribeUser,
  getUserServerSnapshot,
} from "@/lib/authStorage";
import { AuthModal } from "@/components/AuthModal";

interface NavLinkItem {
  href: string;
  label: string;
}

const NAV_LINKS: NavLinkItem[] = [
  { href: "/", label: "LOBBY" },
  { href: "/play", label: "ARENA" },
  { href: "/analysis", label: "ANALYSIS" },
  { href: "/profile", label: "PROFILE" },
];

interface NexusHeaderProps {
  /** Optional text shown in the header chip */
  chipLabel?: string;
  /** Optional override ELO number to display next to profile avatar */
  elo?: number;
}

export function NexusHeader({ chipLabel, elo }: NexusHeaderProps) {
  const pathname = usePathname();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<"login" | "signup" | "edit">("login");

  const user = useSyncExternalStore(
    subscribeUser,
    getUserProfile,
    getUserServerSnapshot
  );

  const displayElo = elo ?? user.rating;

  const renderAvatarIcon = (iconId: string) => {
    switch (iconId) {
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
    <>
      <header className="h-14 shrink-0 glass-subtle px-4 sm:px-6 flex items-center justify-between z-40 relative select-none">
        {/* Subtle top border glow */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--nx-cyan)]/25 to-transparent" />

        {/* Logo */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="w-9 h-9 rounded-lg bg-[var(--nx-cyan)]/10 border border-[var(--nx-cyan)]/30 flex items-center justify-center text-[var(--nx-cyan)] hover:bg-[var(--nx-cyan)]/20 transition-all duration-200 hover:shadow-[0_0_12px_rgba(0,242,255,0.3)]"
          >
            <Zap className="w-5 h-5 fill-current" />
          </Link>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base tracking-wider text-white font-headline">
              NEXUS <span className="text-[var(--nx-cyan)]">{"//"}</span> CHESS
            </span>
            {chipLabel && (
              <span className="nx-chip bg-[var(--nx-purple)]/20 text-[var(--nx-violet)] border border-[var(--nx-purple)]/30 hidden xs:inline-flex">
                {chipLabel}
              </span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-0.5 bg-[var(--nx-bg-surface)]/80 p-1 rounded-lg border border-[var(--nx-border)] font-mono-data text-[11px]">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-1.5 rounded-md transition-all duration-200 font-bold tracking-wider ${
                  isActive
                    ? "bg-[var(--nx-bg-card)] text-[var(--nx-cyan)] border border-[var(--nx-cyan)]/30 shadow-[0_0_8px_rgba(0,242,255,0.15)]"
                    : "text-[var(--nx-text-muted)] hover:text-[var(--nx-text-primary)] hover:bg-[var(--nx-bg-elevated)]/50"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Profile / Auth Pill */}
        <div className="flex items-center gap-2">
          {user.isLoggedIn ? (
            <div className="flex items-center gap-2">
              <Link
                href="/profile"
                className="flex items-center gap-2.5 p-1.5 pr-2.5 rounded-xl bg-[var(--nx-bg-card)]/80 border border-[var(--nx-border)] hover:border-[var(--nx-cyan)]/40 transition-all group"
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-all group-hover:scale-105"
                  style={{
                    backgroundColor: `${user.avatarColor}20`,
                    color: user.avatarColor,
                    border: `1px solid ${user.avatarColor}40`,
                  }}
                >
                  {renderAvatarIcon(user.avatar)}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-white group-hover:text-[var(--nx-cyan)] transition-colors">
                      {user.username}
                    </span>
                    {user.title && user.title !== "NONE" && (
                      <span className="nx-chip text-[8px] py-0 px-1 bg-[var(--nx-purple)]/20 text-[var(--nx-violet)] border border-[var(--nx-purple)]/30">
                        {user.title}
                      </span>
                    )}
                  </div>
                  <span className="font-mono-data text-[9px] text-[var(--nx-cyan)] font-bold block">
                    {displayElo} ELO
                  </span>
                </div>
              </Link>
              <button
                onClick={() => {
                  setAuthModalTab("edit");
                  setAuthModalOpen(true);
                }}
                title="Edit Persona"
                className="w-8 h-8 rounded-lg bg-[var(--nx-bg-surface)] border border-[var(--nx-border)] hover:border-[var(--nx-cyan)]/40 text-[var(--nx-text-muted)] hover:text-[var(--nx-cyan)] flex items-center justify-center transition-all"
              >
                <User className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setAuthModalTab("login");
                setAuthModalOpen(true);
              }}
              className="nx-btn nx-btn-primary py-1.5 px-3 text-[10px] rounded-lg"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>SIGN IN</span>
            </button>
          )}
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialTab={authModalTab}
        user={user}
      />
    </>
  );
}
