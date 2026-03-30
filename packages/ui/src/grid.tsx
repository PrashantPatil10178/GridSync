"use client";

import React, { memo, useCallback, useMemo } from "react";
import type { Tile as TileType } from "@repo/types";
import { Tile } from "./tile";
import { cn } from "./utils";

interface GridProps {
  tiles: Record<string, TileType>;
  gridSize: number;
  userId: string | null;
  onClaimTile: (tileId: string) => void;
  disabled?: boolean;
  className?: string;
  lastClaimedTileId?: string | null;
}

export const Grid = memo(function Grid({
  tiles,
  gridSize,
  userId,
  onClaimTile,
  disabled,
  className,
  lastClaimedTileId,
}: GridProps) {
  const handleClaim = useCallback(
    (tileId: string) => {
      onClaimTile(tileId);
    },
    [onClaimTile],
  );

  // Generate grid cells in order
  const gridCells = useMemo(() => {
    const cells = [];
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const tileId = `${x}-${y}`;
        const tile = tiles[tileId];
        if (tile) {
          cells.push(tile);
        }
      }
    }
    return cells;
  }, [tiles, gridSize]);

  return (
    <div
      className={cn(
        "grid gap-1 p-4 rounded-2xl",
        "bg-gradient-to-br from-[#0c0c10] to-[#080809]",
        "border border-white/[0.06]",
        "shadow-2xl shadow-black/50",
        className,
      )}
      style={{
        gridTemplateColumns: `repeat(${gridSize}, 24px)`,
        gridTemplateRows: `repeat(${gridSize}, 24px)`,
      }}
      role="grid"
      aria-label={`${gridSize} by ${gridSize} interactive grid`}
    >
      {gridCells.map((tile) => (
        <Tile
          key={tile.id}
          tile={tile}
          isOwned={tile.ownerId === userId}
          onClaim={handleClaim}
          disabled={disabled}
          isJustClaimed={lastClaimedTileId === tile.id}
        />
      ))}
    </div>
  );
});

Grid.displayName = "Grid";
