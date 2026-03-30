"use client";

import React, { useMemo, memo } from "react";
import { motion } from "framer-motion";
import type { Tile } from "@repo/types";
import { cn } from "./utils";

interface MiniMapProps {
  tiles: Record<string, Tile>;
  gridSize: number;
  viewport: { x: number; y: number; zoom: number };
  containerSize: { width: number; height: number };
  onNavigate: (x: number, y: number) => void;
  className?: string;
  tileSize?: number;
}

export const MiniMap = memo(function MiniMap({
  tiles,
  gridSize,
  viewport,
  containerSize,
  onNavigate,
  className,
  tileSize = 28,
}: MiniMapProps) {
  const MINIMAP_SIZE = 180;
  const PIXEL_SIZE = MINIMAP_SIZE / gridSize;

  // Generate minimap pixels
  const miniMapTiles = useMemo(() => {
    const tileElements: React.ReactNode[] = [];

    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const tileId = `${x}-${y}`;
        const tile = tiles[tileId];

        if (tile?.color) {
          tileElements.push(
            <rect
              key={tileId}
              x={x * PIXEL_SIZE}
              y={y * PIXEL_SIZE}
              width={PIXEL_SIZE + 0.5}
              height={PIXEL_SIZE + 0.5}
              fill={tile.color}
              opacity={0.95}
            />,
          );
        }
      }
    }

    return tileElements;
  }, [tiles, gridSize, PIXEL_SIZE]);

  // Calculate viewport indicator
  const viewportIndicator = useMemo(() => {
    const visibleTilesX = Math.min(
      gridSize,
      containerSize.width / (tileSize * viewport.zoom),
    );
    const visibleTilesY = Math.min(
      gridSize,
      containerSize.height / (tileSize * viewport.zoom),
    );

    const indicatorWidth = (visibleTilesX / gridSize) * MINIMAP_SIZE;
    const indicatorHeight = (visibleTilesY / gridSize) * MINIMAP_SIZE;

    const indicatorX = (viewport.x / gridSize) * MINIMAP_SIZE;
    const indicatorY = (viewport.y / gridSize) * MINIMAP_SIZE;

    return {
      x: Math.max(0, Math.min(indicatorX, MINIMAP_SIZE - indicatorWidth)),
      y: Math.max(0, Math.min(indicatorY, MINIMAP_SIZE - indicatorHeight)),
      width: Math.min(indicatorWidth, MINIMAP_SIZE),
      height: Math.min(indicatorHeight, MINIMAP_SIZE),
    };
  }, [viewport, gridSize, containerSize, MINIMAP_SIZE, tileSize]);

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / MINIMAP_SIZE) * gridSize;
    const y = ((e.clientY - rect.top) / MINIMAP_SIZE) * gridSize;
    onNavigate(Math.floor(x), Math.floor(y));
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "relative rounded-xl overflow-hidden",
        "bg-gradient-to-br from-[#0c0c10] to-[#080809]",
        "border border-white/[0.08]",
        "shadow-xl shadow-black/40 cursor-crosshair",
        className,
      )}
      style={{ width: MINIMAP_SIZE, height: MINIMAP_SIZE }}
    >
      <svg
        width={MINIMAP_SIZE}
        height={MINIMAP_SIZE}
        onClick={handleClick}
        className="block"
      >
        {/* Background grid pattern */}
        <defs>
          <pattern
            id="minimap-grid"
            width={PIXEL_SIZE * 5}
            height={PIXEL_SIZE * 5}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${PIXEL_SIZE * 5} 0 L 0 0 0 ${PIXEL_SIZE * 5}`}
              fill="none"
              stroke="currentColor"
              strokeWidth={0.3}
              opacity={0.15}
            />
          </pattern>
        </defs>

        <rect
          width={MINIMAP_SIZE}
          height={MINIMAP_SIZE}
          fill="url(#minimap-grid)"
        />

        {/* Claimed tiles */}
        {miniMapTiles}

        {/* Viewport indicator */}
        <motion.rect
          x={viewportIndicator.x}
          y={viewportIndicator.y}
          width={viewportIndicator.width}
          height={viewportIndicator.height}
          fill="rgba(255, 255, 255, 0.08)"
          stroke="rgba(255, 255, 255, 0.9)"
          strokeWidth={2}
          rx={3}
          animate={{
            strokeOpacity: [0.7, 1, 0.7],
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </svg>

      {/* Corner decorations */}
      <div className="absolute top-1 left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-white/20 rounded-tl-sm" />
      <div className="absolute top-1 right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-white/20 rounded-tr-sm" />
      <div className="absolute bottom-1 left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-white/20 rounded-bl-sm" />
      <div className="absolute bottom-1 right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-white/20 rounded-br-sm" />
    </motion.div>
  );
});

MiniMap.displayName = "MiniMap";
