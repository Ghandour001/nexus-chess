"use client";

import React, { useState } from "react";
import {
  X,
  Shield,
  Crown,
  Zap,
  Flame,
  Bot,
  Cpu,
  Check,
  LogIn,
  UserPlus,
  Sparkles,
  Eye,
  EyeOff,
  AlertTriangle,
  LogOut,
} from "lucide-react";
import {
  AVATAR_PRESETS,
  TITLE_OPTIONS,
  loginUser,
  registerUser,
  updateUserProfile,
  logoutUser,
  UserProfile,
} from "@/lib/authStorage";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "login" | "signup" | "edit";
  user: UserProfile;
}

export function AuthModal({ isOpen, onClose, initialTab = "login", user }: AuthModalProps) {
  const [tab, setTab] = useState<"login" | "signup" | "edit">(initialTab);
  const [username, setUsername] = useState(user.username === "GUEST_OPERATOR" ? "" : user.username);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [title, setTitle] = useState(user.title || "FM");
  const [selectedAvatar, setSelectedAvatar] = useState(user.avatar || "cyber-kasparov");
  const [startingElo, setStartingElo] = useState(user.rating || 2400);
  const [bio, setBio] = useState(user.bio || "");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const showSuccess = (msg: string) => {
    setErrorMsg(null);
    setSuccessMsg(msg);
    setTimeout(() => {
      setSuccessMsg(null);
      onClose();
    }, 1000);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const res = loginUser(username, password);
    if (!res.success) {
      setErrorMsg(res.error || "Login failed.");
      return;
    }
    showSuccess(`VERIFIED // WELCOME OPERATOR ${username.toUpperCase()}`);
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const res = registerUser(username, password, title, selectedAvatar, startingElo);
    if (!res.success) {
      setErrorMsg(res.error || "Registration failed.");
      return;
    }
    showSuccess(`ACCOUNT REGISTERED // WELCOME ${username.toUpperCase()}`);
  };

  const handleEditProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const preset = AVATAR_PRESETS.find((a) => a.id === selectedAvatar);
    updateUserProfile({
      username: username.toUpperCase().trim() || user.username,
      title,
      avatar: selectedAvatar,
      avatarColor: preset?.color || user.avatarColor,
      bio,
    });
    showSuccess("PROFILE UPDATED SUCCESSFULLY");
  };

  const handleLogout = () => {
    logoutUser();
    showSuccess("LOGGED OUT OF ARENA");
  };

  const getAvatarIcon = (iconName: string) => {
    switch (iconName) {
      case "Crown":
        return <Crown className="w-4 h-4" />;
      case "Shield":
        return <Shield className="w-4 h-4" />;
      case "Zap":
        return <Zap className="w-4 h-4" />;
      case "Flame":
        return <Flame className="w-4 h-4" />;
      case "Bot":
        return <Bot className="w-4 h-4" />;
      default:
        return <Cpu className="w-4 h-4" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div
        className="w-full max-w-md glass rounded-2xl border border-[var(--nx-cyan)]/35 p-6 shadow-2xl relative flex flex-col gap-4 overflow-hidden"
        style={{
          boxShadow: "0 0 50px rgba(0, 242, 255, 0.15), 0 25px 60px rgba(0,0,0,0.9)",
          backgroundColor: "#070A0Ff5",
        }}
      >
        {/* Subtle top glow bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--nx-cyan)] via-[var(--nx-purple)] to-[var(--nx-cyan)]" />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--nx-cyan)]/15 border border-[var(--nx-cyan)]/40 flex items-center justify-center text-[var(--nx-cyan)]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm text-white font-headline tracking-wider block">
                NEXUS // IDENTITY PORTAL
              </span>
              <span className="font-mono-data text-[10px] text-[var(--nx-cyan-dim)]">
                AUTHENTIC LOCAL CREDENTIALS
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-[var(--nx-bg-card)] border border-[var(--nx-border)] flex items-center justify-center text-[var(--nx-text-muted)] hover:text-white hover:border-[var(--nx-cyan)]/40 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-[var(--nx-bg-surface)] p-1 rounded-xl border border-[var(--nx-border)] font-mono-data text-xs">
          <button
            type="button"
            onClick={() => {
              setTab("login");
              setErrorMsg(null);
            }}
            className={`py-1.5 rounded-lg font-bold transition-all ${
              tab === "login"
                ? "bg-[var(--nx-cyan)] text-black shadow-[0_0_12px_rgba(0,242,255,0.3)]"
                : "text-[var(--nx-text-muted)] hover:text-white"
            }`}
          >
            SIGN IN
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("signup");
              setErrorMsg(null);
            }}
            className={`py-1.5 rounded-lg font-bold transition-all ${
              tab === "signup"
                ? "bg-[var(--nx-cyan)] text-black shadow-[0_0_12px_rgba(0,242,255,0.3)]"
                : "text-[var(--nx-text-muted)] hover:text-white"
            }`}
          >
            REGISTER
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("edit");
              setErrorMsg(null);
            }}
            className={`py-1.5 rounded-lg font-bold transition-all ${
              tab === "edit"
                ? "bg-[var(--nx-cyan)] text-black shadow-[0_0_12px_rgba(0,242,255,0.3)]"
                : "text-[var(--nx-text-muted)] hover:text-white"
            }`}
          >
            EDIT
          </button>
        </div>

        {/* Error banner */}
        {errorMsg && (
          <div className="p-2.5 rounded-lg bg-[var(--nx-red)]/15 border border-[var(--nx-red)]/40 text-[var(--nx-red)] text-xs font-mono-data flex items-center gap-2 animate-scale-in">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success banner */}
        {successMsg && (
          <div className="p-2.5 rounded-lg bg-[var(--nx-green)]/15 border border-[var(--nx-green)]/40 text-[var(--nx-green)] text-xs font-mono-data text-center font-bold flex items-center justify-center gap-2 animate-scale-in">
            <Check className="w-4 h-4" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={tab === "login" ? handleLogin : tab === "signup" ? handleSignup : handleEditProfile}
          className="flex flex-col gap-3 font-mono-data text-xs"
        >
          {/* Callsign / Username */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-[var(--nx-text-muted)] uppercase tracking-wider">
              Operator Callsign (Username)
            </label>
            <input
              type="text"
              required
              maxLength={18}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. CYBER_KASPAROV"
              className="w-full bg-[var(--nx-bg-card)] border border-[var(--nx-border)] focus:border-[var(--nx-cyan)] rounded-xl px-3 py-2 text-white placeholder-white/20 outline-none text-xs font-bold uppercase tracking-wider"
            />
          </div>

          {/* Password (for login and signup) */}
          {tab !== "edit" && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-[var(--nx-text-muted)] uppercase tracking-wider flex items-center justify-between">
                <span>Security Password</span>
                {tab === "login" && (
                  <span className="text-[9px] text-[var(--nx-cyan-dim)]">Demo: password123</span>
                )}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter security key..."
                  className="w-full bg-[var(--nx-bg-card)] border border-[var(--nx-border)] focus:border-[var(--nx-cyan)] rounded-xl pl-3 pr-9 py-2 text-white placeholder-white/20 outline-none text-xs font-bold"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--nx-text-muted)] hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          )}

          {/* Title Selector (for signup and edit) */}
          {tab !== "login" && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-[var(--nx-text-muted)] uppercase tracking-wider">
                Title Rank
              </label>
              <div className="flex gap-1.5 overflow-x-auto pb-0.5">
                {TITLE_OPTIONS.map((t) => (
                  <button
                    type="button"
                    key={t}
                    onClick={() => setTitle(t)}
                    className={`px-2.5 py-1 rounded-lg border font-bold text-[9px] transition-all ${
                      title === t
                        ? "bg-[var(--nx-purple)]/25 border-[var(--nx-purple)] text-[var(--nx-violet)] shadow-[0_0_8px_rgba(168,85,247,0.3)]"
                        : "bg-[var(--nx-bg-card)] border-[var(--nx-border)] text-[var(--nx-text-muted)] hover:text-white"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Avatar Persona (for signup and edit) */}
          {tab !== "login" && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-[var(--nx-text-muted)] uppercase tracking-wider">
                Neural Persona
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {AVATAR_PRESETS.map((av) => {
                  const isSelected = selectedAvatar === av.id;
                  return (
                    <button
                      type="button"
                      key={av.id}
                      onClick={() => setSelectedAvatar(av.id)}
                      className={`p-2 rounded-xl border flex items-center gap-1.5 transition-all ${
                        isSelected
                          ? "border-[var(--nx-cyan)] bg-[var(--nx-cyan)]/15 text-white"
                          : "border-[var(--nx-border)] bg-[var(--nx-bg-card)] text-[var(--nx-text-muted)] hover:border-white/20 hover:text-white"
                      }`}
                    >
                      <div
                        className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                        style={{ color: av.color, backgroundColor: `${av.color}20` }}
                      >
                        {getAvatarIcon(av.icon)}
                      </div>
                      <span className="text-[9px] font-bold truncate text-left">{av.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Initial ELO (for signup) */}
          {tab === "signup" && (
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-[var(--nx-text-muted)] uppercase">Calibrated Starting ELO</span>
                <span className="font-bold text-[var(--nx-cyan)]">{startingElo} ELO</span>
              </div>
              <input
                type="range"
                min="800"
                max="3000"
                step="50"
                value={startingElo}
                onChange={(e) => setStartingElo(parseInt(e.target.value, 10))}
                className="w-full accent-[var(--nx-cyan)] cursor-pointer"
              />
            </div>
          )}

          {/* Bio (for edit) */}
          {tab === "edit" && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-[var(--nx-text-muted)] uppercase tracking-wider">
                Bio / Directive
              </label>
              <textarea
                value={bio}
                rows={2}
                maxLength={100}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tactical bio..."
                className="w-full bg-[var(--nx-bg-card)] border border-[var(--nx-border)] focus:border-[var(--nx-cyan)] rounded-xl p-2 text-white placeholder-white/20 outline-none text-xs"
              />
            </div>
          )}

          {/* Submit Action */}
          <button
            type="submit"
            className="nx-btn nx-btn-primary py-2.5 rounded-xl text-xs tracking-wider justify-center mt-1"
          >
            {tab === "login" && (
              <>
                <LogIn className="w-3.5 h-3.5" />
                <span>AUTHENTICATE OPERATOR</span>
              </>
            )}
            {tab === "signup" && (
              <>
                <UserPlus className="w-3.5 h-3.5" />
                <span>CREATE REGISTERED PROFILE</span>
              </>
            )}
            {tab === "edit" && (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>SAVE CHANGES</span>
              </>
            )}
          </button>

          {/* Logout / Switch button if logged in */}
          {user.isLoggedIn && (
            <button
              type="button"
              onClick={handleLogout}
              className="text-[10px] text-[var(--nx-red)] hover:underline flex items-center justify-center gap-1 mt-1 opacity-80 hover:opacity-100"
            >
              <LogOut className="w-3 h-3" />
              <span>Switch / Sign Out Operator</span>
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
