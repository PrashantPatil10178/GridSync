"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { LeaderboardEntry } from "@repo/types";
import { cn } from "./utils";

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  currentUserId: string | null;
  className?: string;
}

export function Leaderboard({
  entries,
  currentUserId,
  className,
}: LeaderboardProps) {
  if (entries.length === 0) {
    return (
      <div
        className={cn(
          "p-4 text-center text-muted-foreground text-sm",
          className,
        )}
      >
        No tiles claimed yet. Be the first!
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <AnimatePresence mode="popLayout">
        {entries.map((entry, index) => {
          const isCurrentUser = entry.id === currentUserId;
          const isTop3 = index < 3;

          return (
            <motion.div
              key={entry.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200",
                isCurrentUser && "bg-primary/10 ring-1 ring-primary/30",
                !isCurrentUser && "hover:bg-muted/50",
              )}
            >
              {/* Rank Badge */}
              <div
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                  index === 0 &&
                    "bg-gradient-to-br from-yellow-400 to-amber-600 text-black",
                  index === 1 &&
                    "bg-gradient-to-br from-gray-300 to-gray-500 text-black",
                  index === 2 &&
                    "bg-gradient-to-br from-amber-600 to-amber-800 text-white",
                  index > 2 && "bg-muted text-muted-foreground",
                )}
              >
                {isTop3 ? (
                  <span>{index === 0 ? "👑" : index === 1 ? "🥈" : "🥉"}</span>
                ) : (
                  entry.rank
                )}
              </div>

              {/* Color indicator */}
              <motion.div
                className="w-4 h-4 rounded-full shrink-0 ring-2 ring-white/20"
                style={{ backgroundColor: entry.color }}
                animate={{
                  boxShadow: isTop3
                    ? [
                        `0 0 8px ${entry.color}60`,
                        `0 0 16px ${entry.color}80`,
                        `0 0 8px ${entry.color}60`,
                      ]
                    : "none",
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />

              {/* Name */}
              <span
                className={cn(
                  "flex-1 truncate text-sm font-medium",
                  isCurrentUser && "text-primary",
                  !isCurrentUser && "text-foreground",
                )}
              >
                {entry.nickname}
                {isCurrentUser && (
                  <span className="ml-1 text-xs text-muted-foreground">
                    (you)
                  </span>
                )}
              </span>

              {/* Tile count */}
              <div className="flex items-center gap-1">
                <motion.span
                  key={entry.tileCount}
                  initial={{ scale: 1.2, color: entry.color }}
                  animate={{ scale: 1, color: "inherit" }}
                  className={cn(
                    "font-mono text-sm font-semibold tabular-nums",
                    isTop3 ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {entry.tileCount}
                </motion.span>
                <span className="text-xs text-muted-foreground">tiles</span>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
