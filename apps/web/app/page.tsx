"use client";

import { useMemo, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Grid } from "@repo/ui/grid";
import { Loader } from "@repo/ui/loader";
import { Leaderboard } from "@repo/ui/leaderboard";
import { MiniMap } from "@repo/ui/minimap";
import { useGridSocket } from "../hooks/use-grid-socket";
import { useSoundEffects } from "../hooks/use-sound-effects";
import { useViewport } from "../hooks/use-viewport";
import { GRID_SIZE, CLAIM_COOLDOWN_MS } from "@repo/types";

function GlassCard({
  children,
  className = "",
  glow = false,
  glowColor = "violet",
}: {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  glowColor?: "violet" | "emerald" | "amber" | "rose";
}) {
  const glowColors = {
    violet: "shadow-violet-500/10 hover:shadow-violet-500/20",
    emerald: "shadow-emerald-500/10 hover:shadow-emerald-500/20",
    amber: "shadow-amber-500/10 hover:shadow-amber-500/20",
    rose: "shadow-rose-500/10 hover:shadow-rose-500/20",
  };

  return (
    <div
      className={`
      relative overflow-hidden rounded-2xl
      bg-gradient-to-br from-white/[0.08] to-white/[0.02]
      backdrop-blur-xl
      border border-white/[0.08]
      shadow-xl ${glow ? glowColors[glowColor] : "shadow-black/20"}
      transition-all duration-300 ease-out
      ${className}
    `}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent pointer-events-none" />
      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

// Stat card with icon
function StatCard({
  label,
  value,
  icon,
  color = "violet",
  subtitle,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  color?: "violet" | "emerald" | "amber" | "rose";
  subtitle?: string;
}) {
  const colorClasses = {
    violet: "from-violet-500/20 to-violet-600/10 text-violet-400",
    emerald: "from-emerald-500/20 to-emerald-600/10 text-emerald-400",
    amber: "from-amber-500/20 to-amber-600/10 text-amber-400",
    rose: "from-rose-500/20 to-rose-600/10 text-rose-400",
  };

  return (
    <div className="group p-4 rounded-xl bg-gradient-to-br from-white/[0.04] to-transparent border border-white/[0.06] hover:border-white/[0.12] transition-all duration-200">
      <div className="flex items-start justify-between mb-2">
        <span className="text-[11px] font-medium text-white/40 uppercase tracking-wider">
          {label}
        </span>
        <div
          className={`p-1.5 rounded-lg bg-gradient-to-br ${colorClasses[color]}`}
        >
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold text-white tracking-tight">
        {value}
      </div>
      {subtitle && <div className="text-xs text-white/30 mt-1">{subtitle}</div>}
    </div>
  );
}

export default function Home() {
  const {
    tiles,
    user,
    userCount,
    isConnected,
    isLoading,
    cooldownActive,
    cooldownRemaining,
    error,
    claimTile,
    leaderboard,
    lastClaimedTile,
    totalOwned,
    setNickname,
  } = useGridSocket();

  const { playClaimSound, toggleMute, isMuted } = useSoundEffects();

  const gridContainerRef = useRef<HTMLDivElement>(null);
  const {
    viewport,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    isPanning,
    zoomIn,
    zoomOut,
    resetView,
    navigateTo,
    containerSize,
  } = useViewport({ containerRef: gridContainerRef, tileSize: 28 });

  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [nicknameInput, setNicknameInput] = useState("");
  const [showLeaderboard, setShowLeaderboard] = useState(true);

  // Handle tile claim with sound
  const handleClaimTile = useCallback(
    (tileId: string) => {
      claimTile(tileId);
      playClaimSound();
    },
    [claimTile, playClaimSound],
  );

  // Handle nickname submission
  const handleNicknameSubmit = useCallback(() => {
    if (nicknameInput.trim()) {
      setNickname(nicknameInput.trim());
      setIsEditingNickname(false);
      setNicknameInput("");
    }
  }, [nicknameInput, setNickname]);

  // Start editing nickname
  const startEditingNickname = useCallback(() => {
    setNicknameInput(user?.nickname || "");
    setIsEditingNickname(true);
  }, [user?.nickname]);

  // Calculate cooldown progress
  const cooldownProgress = useMemo(() => {
    if (!cooldownActive) return 100;
    return ((CLAIM_COOLDOWN_MS - cooldownRemaining) / CLAIM_COOLDOWN_MS) * 100;
  }, [cooldownActive, cooldownRemaining]);

  // Calculate rank
  const userRank = useMemo(() => {
    if (!user?.id) return null;
    const entry = leaderboard.find((e) => e.id === user.id);
    return entry?.rank || null;
  }, [leaderboard, user?.id]);

  return (
    <div className="min-h-screen flex flex-col bg-[#060608]">
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-fuchsia-500/5 rounded-full blur-[128px]" />
      </div>

      {/* Header */}
      <header className="relative z-50 border-b border-white/[0.06] bg-[#0a0a0c]/80 backdrop-blur-2xl">
        <div className="max-w-[1920px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              {/* Logo */}
              <motion.div
                className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-violet-500/30"
                whileHover={{ scale: 1.05, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent" />
                <div className="grid grid-cols-2 gap-1">
                  <div className="w-3 h-3 rounded-md bg-white/95 shadow-sm" />
                  <div className="w-3 h-3 rounded-md bg-white/60" />
                  <div className="w-3 h-3 rounded-md bg-white/60" />
                  <div className="w-3 h-3 rounded-md bg-white/95 shadow-sm" />
                </div>
              </motion.div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white">
                  GridSync
                </h1>
                <p className="text-xs text-white/40">
                  Real-time collaborative grid • {GRID_SIZE}×{GRID_SIZE}
                </p>
              </div>
            </div>

            {/* User info and controls */}
            <div className="flex items-center gap-4">
              {/* Sound toggle */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleMute}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? (
                  <svg
                    className="w-5 h-5 text-white/50"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5 text-white/70"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                    />
                  </svg>
                )}
              </motion.button>

              {/* User count */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5">
                <div className="relative">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <div className="absolute inset-0 w-2 h-2 rounded-full bg-green-500 animate-ping opacity-75" />
                </div>
                <span className="text-sm font-medium text-white/70">
                  {userCount} online
                </span>
              </div>

              {/* Connection status */}
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${isConnected ? "bg-green-500/10" : "bg-red-500/10"}`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}
                />
                <span
                  className={`text-xs font-medium ${isConnected ? "text-green-400" : "text-red-400"}`}
                >
                  {isConnected ? "Connected" : "Disconnected"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center gap-6"
            >
              <Loader text="Connecting to server..." />
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center gap-4 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-red-400">
                  Connection Error
                </h2>
                <p className="text-sm text-white/50 mt-1">{error}</p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors text-white"
              >
                Try Again
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex"
            >
              {/* Left sidebar - Enhanced Cards */}
              <div className="w-80 border-r border-white/[0.06] bg-gradient-to-b from-[#0c0c0e] to-[#080809] p-5 flex flex-col gap-5">
                {/* Profile Card - Premium glassmorphism */}
                <GlassCard glow glowColor="violet" className="p-5">
                  {/* Profile header with avatar */}
                  <div className="flex items-start gap-4 mb-5">
                    <div className="relative">
                      <motion.div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                        style={{
                          backgroundColor: user?.color || "#666",
                          boxShadow: `0 8px 32px ${user?.color || "#666"}40`,
                        }}
                        animate={{
                          boxShadow: [
                            `0 8px 32px ${user?.color || "#666"}30`,
                            `0 8px 40px ${user?.color || "#666"}50`,
                            `0 8px 32px ${user?.color || "#666"}30`,
                          ],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      >
                        <span className="text-2xl font-bold text-white/90">
                          {(user?.nickname ?? "Anonymous")[0]?.toUpperCase() ??
                            "A"}
                        </span>
                      </motion.div>
                      {/* Online indicator */}
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#0c0c0e] flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      {isEditingNickname ? (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleNicknameSubmit();
                          }}
                          className="space-y-2"
                        >
                          <input
                            type="text"
                            value={nicknameInput}
                            onChange={(e) => setNicknameInput(e.target.value)}
                            placeholder="Enter nickname..."
                            className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
                            maxLength={20}
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <button
                              type="submit"
                              className="flex-1 px-3 py-1.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 rounded-lg text-xs font-semibold transition-all shadow-lg shadow-violet-500/25"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsEditingNickname(false)}
                              className="px-3 py-1.5 bg-white/[0.06] hover:bg-white/[0.1] rounded-lg text-xs font-medium text-white/60 transition-all"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <button
                          onClick={startEditingNickname}
                          className="text-left group w-full"
                        >
                          <div className="text-lg font-bold text-white truncate group-hover:text-violet-400 transition-colors">
                            {user?.nickname || "Anonymous"}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-white/40 group-hover:text-white/60 transition-colors mt-0.5">
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                              />
                            </svg>
                            Click to edit nickname
                          </div>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Stats grid with icons */}
                  <div className="grid grid-cols-2 gap-3">
                    <StatCard
                      label="Tiles Owned"
                      value={totalOwned}
                      color="violet"
                      subtitle={userRank ? `Rank #${userRank}` : undefined}
                      icon={
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
                          />
                        </svg>
                      }
                    />
                    <StatCard
                      label="Your Color"
                      value={
                        <div
                          className="w-8 h-8 rounded-xl shadow-lg"
                          style={{
                            backgroundColor: user?.color || "#666",
                            boxShadow: `0 4px 16px ${user?.color || "#666"}50`,
                          }}
                        />
                      }
                      color="rose"
                      icon={
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                          />
                        </svg>
                      }
                    />
                  </div>
                </GlassCard>

                {/* Cooldown Card - Enhanced with circular progress */}
                <GlassCard className="p-5">
                  <div className="flex items-center gap-4">
                    {/* Circular progress indicator */}
                    <div className="relative w-16 h-16 flex-shrink-0">
                      <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                        {/* Background circle */}
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="4"
                          className="text-white/[0.06]"
                        />
                        {/* Progress circle */}
                        <motion.circle
                          cx="32"
                          cy="32"
                          r="28"
                          fill="none"
                          stroke="url(#cooldown-gradient)"
                          strokeWidth="4"
                          strokeLinecap="round"
                          strokeDasharray={2 * Math.PI * 28}
                          initial={false}
                          animate={{
                            strokeDashoffset:
                              2 * Math.PI * 28 * (1 - cooldownProgress / 100),
                          }}
                          transition={{ duration: 0.1 }}
                        />
                        <defs>
                          <linearGradient
                            id="cooldown-gradient"
                            x1="0%"
                            y1="0%"
                            x2="100%"
                            y2="100%"
                          >
                            <stop offset="0%" stopColor="#8B5CF6" />
                            <stop offset="100%" stopColor="#EC4899" />
                          </linearGradient>
                        </defs>
                      </svg>
                      {/* Center content */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        {cooldownActive ? (
                          <span className="text-sm font-bold text-white tabular-nums">
                            {(cooldownRemaining / 1000).toFixed(1)}
                          </span>
                        ) : (
                          <svg
                            className="w-6 h-6 text-emerald-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2.5}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-1">
                        Claim Status
                      </div>
                      <div
                        className={`text-lg font-bold ${cooldownActive ? "text-amber-400" : "text-emerald-400"}`}
                      >
                        {cooldownActive ? "On Cooldown" : "Ready!"}
                      </div>
                      <div className="text-xs text-white/30 mt-0.5">
                        {cooldownActive
                          ? "Please wait..."
                          : "Click any tile to claim"}
                      </div>
                    </div>
                  </div>
                </GlassCard>

                {/* Leaderboard Card */}
                <GlassCard className="flex-1 flex flex-col min-h-0">
                  {/* Header */}
                  <button
                    onClick={() => setShowLeaderboard(!showLeaderboard)}
                    className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors rounded-t-2xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10">
                        <svg
                          className="w-5 h-5 text-amber-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-semibold text-white">
                          Leaderboard
                        </div>
                        <div className="text-[11px] text-white/40">
                          Top players
                        </div>
                      </div>
                    </div>
                    <motion.div
                      animate={{ rotate: showLeaderboard ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="p-1.5 rounded-lg bg-white/[0.04]"
                    >
                      <svg
                        className="w-4 h-4 text-white/50"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </motion.div>
                  </button>

                  {/* Leaderboard content */}
                  <AnimatePresence>
                    {showLeaderboard && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden border-t border-white/[0.04]"
                      >
                        <div className="p-3 max-h-56 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                          <Leaderboard
                            entries={leaderboard}
                            currentUserId={user?.id || null}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </GlassCard>

                {/* Mini map Card */}
                <GlassCard className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-cyan-500/20 to-cyan-600/10">
                      <svg
                        className="w-4 h-4 text-cyan-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                        />
                      </svg>
                    </div>
                    <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                      Navigator
                    </span>
                  </div>
                  <MiniMap
                    tiles={tiles}
                    gridSize={GRID_SIZE}
                    viewport={viewport}
                    containerSize={containerSize}
                    onNavigate={navigateTo}
                    tileSize={28}
                    className="mx-auto"
                  />
                </GlassCard>
              </div>

              {/* Center - Grid */}
              <div className="flex-1 flex flex-col">
                {/* Enhanced Zoom controls */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] bg-[#0a0a0c]/80 backdrop-blur-xl">
                  <div className="flex items-center gap-3">
                    <div className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                      <span className="text-xs font-mono text-white/60">
                        <span className="text-white font-semibold">
                          {Math.round(viewport.zoom * 100)}
                        </span>
                        %
                      </span>
                    </div>
                    <div className="h-4 w-px bg-white/10" />
                    <span className="text-xs text-white/30">
                      Scroll to zoom • Ctrl+drag to pan
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={zoomOut}
                      className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-all text-white/70 hover:text-white"
                      aria-label="Zoom out"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20 12H4"
                        />
                      </svg>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={resetView}
                      className="px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-all text-xs font-semibold text-white/70 hover:text-white"
                    >
                      Reset
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={zoomIn}
                      className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-all text-white/70 hover:text-white"
                      aria-label="Zoom in"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    </motion.button>
                  </div>
                </div>

                {/* Grid container with enhanced visuals */}
                <div
                  ref={gridContainerRef}
                  className="flex-1 overflow-hidden relative bg-[#050507]"
                  onWheel={handleWheel}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  style={{ cursor: isPanning ? "grabbing" : "default" }}
                >
                  {/* Subtle grid background pattern */}
                  <div
                    className="absolute inset-0 opacity-[0.02]"
                    style={{
                      backgroundImage: `
                        linear-gradient(to right, white 1px, transparent 1px),
                        linear-gradient(to bottom, white 1px, transparent 1px)
                      `,
                      backgroundSize: "40px 40px",
                    }}
                  />

                  <div
                    className="absolute origin-top-left transition-transform duration-100 ease-out"
                    style={{
                      transform: `scale(${viewport.zoom}) translate(${-viewport.x * 28}px, ${-viewport.y * 28}px)`,
                    }}
                  >
                    <Grid
                      tiles={tiles}
                      gridSize={GRID_SIZE}
                      userId={user?.id || null}
                      onClaimTile={handleClaimTile}
                      disabled={cooldownActive || !isConnected}
                      lastClaimedTileId={lastClaimedTile?.id}
                    />
                  </div>

                  {/* Enhanced Cooldown overlay */}
                  <AnimatePresence>
                    {cooldownActive && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-4 left-1/2 -translate-x-1/2"
                      >
                        <div className="px-5 py-2.5 bg-gradient-to-r from-amber-500/10 via-amber-500/15 to-amber-500/10 border border-amber-500/20 rounded-2xl backdrop-blur-xl shadow-lg shadow-amber-500/5">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                            <span className="text-sm font-semibold text-amber-400">
                              Cooldown:{" "}
                              <span className="font-mono">
                                {(cooldownRemaining / 1000).toFixed(1)}s
                              </span>
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
