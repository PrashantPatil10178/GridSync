"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "./utils";

interface StatusBarProps {
  userColor: string | null;
  userCount: number;
  isConnected: boolean;
  cooldownActive?: boolean;
  tilesOwned?: number;
  className?: string;
}

export function StatusBar({
  userColor,
  userCount,
  isConnected,
  cooldownActive,
  tilesOwned = 0,
  className,
}: StatusBarProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-6 px-6 py-4",
        "bg-muted/50 backdrop-blur-md border border-border/50 rounded-xl",
        className,
      )}
    >
      {/* Left side - User info */}
      <div className="flex items-center gap-4">
        {/* Connection status */}
        <div className="flex items-center gap-2">
          <motion.div
            className={cn(
              "w-2.5 h-2.5 rounded-full",
              isConnected ? "bg-success" : "bg-error",
            )}
            animate={
              isConnected
                ? { scale: [1, 1.2, 1], opacity: [1, 0.8, 1] }
                : { opacity: [1, 0.5, 1] }
            }
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span className="text-sm text-muted-foreground">
            {isConnected ? "Connected" : "Disconnected"}
          </span>
        </div>

        {/* User color indicator */}
        {userColor && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Your color:</span>
            <motion.div
              className="w-5 h-5 rounded-md border border-white/20"
              style={{ backgroundColor: userColor }}
              animate={{
                boxShadow: [
                  `0 0 8px ${userColor}60`,
                  `0 0 16px ${userColor}80`,
                  `0 0 8px ${userColor}60`,
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        )}

        {/* Tiles owned */}
        {tilesOwned > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Tiles owned:</span>
            <span className="text-sm font-mono font-semibold text-foreground">
              {tilesOwned}
            </span>
          </div>
        )}
      </div>

      {/* Right side - Stats */}
      <div className="flex items-center gap-4">
        {/* Cooldown indicator */}
        {cooldownActive && (
          <motion.div
            className="flex items-center gap-2 text-warning"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <motion.div
              className="w-2 h-2 rounded-full bg-warning"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            />
            <span className="text-sm font-medium">Cooldown</span>
          </motion.div>
        )}

        {/* Active users */}
        <div className="flex items-center gap-2">
          <div className="flex -space-x-1">
            {Array.from({ length: Math.min(userCount, 5) }).map((_, i) => (
              <motion.div
                key={i}
                className="w-6 h-6 rounded-full bg-muted border-2 border-background flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.05 }}
              >
                <span className="text-[10px] text-muted-foreground">
                  {String.fromCharCode(65 + i)}
                </span>
              </motion.div>
            ))}
            {userCount > 5 && (
              <motion.div
                className="w-6 h-6 rounded-full bg-secondary border-2 border-background flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.25 }}
              >
                <span className="text-[10px] text-muted-foreground">
                  +{userCount - 5}
                </span>
              </motion.div>
            )}
          </div>
          <span className="text-sm text-muted-foreground">
            {userCount} {userCount === 1 ? "user" : "users"} online
          </span>
        </div>
      </div>
    </div>
  );
}
