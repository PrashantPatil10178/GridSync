"use client";

import React, { memo, useCallback, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Tile as TileType } from "@repo/types";
import { cn } from "./utils";

interface TileProps {
  tile: TileType;
  isOwned: boolean;
  onClaim: (tileId: string) => void;
  disabled?: boolean;
  isJustClaimed?: boolean;
}

export const Tile = memo(function Tile({
  tile,
  isOwned,
  onClaim,
  disabled,
  isJustClaimed,
}: TileProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const handleClick = useCallback(() => {
    if (!tile.ownerId && !disabled) {
      onClaim(tile.id);
    }
  }, [tile.id, tile.ownerId, onClaim, disabled]);

  const isClaimed = tile.ownerId !== null;

  const tileStyle = useMemo(() => {
    if (tile.color) {
      return {
        backgroundColor: tile.color,
        boxShadow: isOwned 
          ? `0 0 24px ${tile.color}70, 0 0 40px ${tile.color}30, inset 0 1px 1px rgba(255,255,255,0.3)`
          : `0 0 12px ${tile.color}50, inset 0 1px 1px rgba(255,255,255,0.15)`,
      };
    }
    return {};
  }, [tile.color, isOwned]);

  // Format the claim time
  const claimTime = useMemo(() => {
    if (!tile.updatedAt) return '';
    const date = new Date(tile.updatedAt);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  }, [tile.updatedAt]);

  return (
    <div className="relative">
      <motion.button
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        disabled={isClaimed || disabled}
        className={cn(
          "relative w-6 h-6 rounded-md transition-all duration-200",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-1 focus-visible:ring-offset-[#0a0a0c]",
          !isClaimed && [
            "bg-gradient-to-br from-[#1a1a20] to-[#141418]",
            "border border-white/[0.08]",
            "hover:from-[#24242b] hover:to-[#1a1a20]",
            "hover:border-white/[0.15]",
            "cursor-pointer",
            "shadow-sm shadow-black/30",
          ],
          isClaimed && [
            "cursor-default",
            "border border-white/[0.12]",
          ],
          isOwned && "ring-2 ring-white/60 ring-offset-1 ring-offset-[#0a0a0c]",
          disabled && !isClaimed && "opacity-30 cursor-not-allowed"
        )}
        style={tileStyle}
        whileHover={!isClaimed && !disabled ? { 
          scale: 1.25, 
          zIndex: 30,
          transition: { type: "spring", stiffness: 400, damping: 17 }
        } : {}}
        whileTap={!isClaimed && !disabled ? { scale: 0.9 } : {}}
        initial={false}
        animate={
          isJustClaimed
            ? {
                scale: [1, 1.4, 1],
                transition: { duration: 0.5, ease: "easeOut" },
              }
            : {}
        }
        aria-label={
          isClaimed
            ? `Tile at ${tile.x}, ${tile.y} - claimed by ${tile.ownerName || "unknown"}${isOwned ? " (you)" : ""}`
            : `Tile at ${tile.x}, ${tile.y} - click to claim`
        }
      >
        {/* Inner gradient highlight for unclaimed */}
        {!isClaimed && (
          <div className="absolute inset-0 rounded-md bg-gradient-to-br from-white/[0.06] via-transparent to-transparent pointer-events-none" />
        )}

        {/* Glow pulse effect for claimed tiles */}
        {isClaimed && (
          <motion.div
            className="absolute inset-0 rounded-md"
            style={{ backgroundColor: tile.color || undefined }}
            animate={{
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}
        
        {/* Inner highlight for claimed tiles */}
        {isClaimed && (
          <div className="absolute inset-0 rounded-md bg-gradient-to-br from-white/20 via-white/5 to-transparent pointer-events-none" />
        )}
        
        {/* Shine effect for owned tiles */}
        {isOwned && (
          <motion.div
            className="absolute inset-0 rounded-md overflow-hidden"
            initial={false}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12"
              animate={{
                x: ["-150%", "250%"],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 4,
                ease: "easeInOut",
              }}
            />
          </motion.div>
        )}

        {/* Claim ripple effect */}
        {isJustClaimed && (
          <motion.div
            className="absolute inset-0 rounded-md"
            style={{ backgroundColor: tile.color || "#fff" }}
            initial={{ scale: 0.5, opacity: 0.9 }}
            animate={{ scale: 2.5, opacity: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          />
        )}
      </motion.button>

      {/* Enhanced Tooltip */}
      <AnimatePresence>
        {isHovered && isClaimed && tile.ownerName && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.9 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={cn(
              "absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-3",
              "px-3.5 py-2.5 rounded-xl",
              "bg-gradient-to-br from-[#1c1c22] to-[#141418]",
              "border border-white/[0.1]",
              "shadow-2xl shadow-black/60",
              "pointer-events-none whitespace-nowrap"
            )}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-3.5 h-3.5 rounded-full ring-2 ring-white/20 shadow-lg"
                style={{ 
                  backgroundColor: tile.color || undefined,
                  boxShadow: tile.color ? `0 0 10px ${tile.color}60` : undefined
                }}
              />
              <span className="text-sm font-semibold text-white">
                {tile.ownerName}
                {isOwned && <span className="text-emerald-400 ml-1.5 text-xs font-medium">(you)</span>}
              </span>
            </div>
            <div className="text-xs text-white/40 mt-1.5 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Claimed {claimTime}
            </div>
            {/* Tooltip arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-[#1c1c22]" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

Tile.displayName = "Tile";
