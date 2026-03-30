'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  SocketEvents,
  CLAIM_COOLDOWN_MS,
  type Tile,
  type User,
  type LeaderboardEntry,
  type InitGridPayload,
  type TileUpdatedPayload,
  type UserCountPayload,
  type ClaimRejectedPayload,
  type LeaderboardUpdatePayload,
  type NicknameUpdatedPayload,
  type ClaimSuccessPayload,
} from '@repo/types';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

interface UseGridSocketReturn {
  tiles: Record<string, Tile>;
  user: User | null;
  userCount: number;
  isConnected: boolean;
  isLoading: boolean;
  cooldownActive: boolean;
  cooldownRemaining: number;
  error: string | null;
  leaderboard: LeaderboardEntry[];
  lastClaimedTile: Tile | null;
  totalOwned: number;
  claimTile: (tileId: string) => void;
  setNickname: (nickname: string) => void;
}

export function useGridSocket(): UseGridSocketReturn {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [tiles, setTiles] = useState<Record<string, Tile>>({});
  const [user, setUser] = useState<User | null>(null);
  const [userCount, setUserCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [cooldownActive, setCooldownActive] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [lastClaimedTile, setLastClaimedTile] = useState<Tile | null>(null);
  const [totalOwned, setTotalOwned] = useState(0);
  
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const cooldownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    setSocket(newSocket);

    // Connection handlers
    newSocket.on('connect', () => {
      console.log('🔌 Connected to server');
      setIsConnected(true);
      setError(null);
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 Disconnected from server');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (err) => {
      console.error('🔌 Connection error:', err.message);
      setError(`Connection failed: ${err.message}`);
      setIsLoading(false);
    });

    // Grid initialization
    newSocket.on(SocketEvents.INIT_GRID, (payload: InitGridPayload) => {
      console.log('📊 Received initial grid state');
      setTiles(payload.tiles);
      setUser(payload.user);
      setUserCount(payload.userCount);
      setLeaderboard(payload.leaderboard);
      setIsLoading(false);
      
      // Calculate initial owned tiles
      const owned = Object.values(payload.tiles).filter(
        t => t.ownerId === payload.user.id
      ).length;
      setTotalOwned(owned);
    });

    // Tile updates
    newSocket.on(SocketEvents.TILE_UPDATED, (payload: TileUpdatedPayload) => {
      setTiles((prev) => ({
        ...prev,
        [payload.tile.id]: payload.tile,
      }));
    });

    // User count updates
    newSocket.on(SocketEvents.USER_COUNT, (payload: UserCountPayload) => {
      setUserCount(payload.count);
    });

    // Leaderboard updates
    newSocket.on(SocketEvents.LEADERBOARD_UPDATE, (payload: LeaderboardUpdatePayload) => {
      setLeaderboard(payload.leaderboard);
    });

    // Nickname updates
    newSocket.on(SocketEvents.NICKNAME_UPDATED, (payload: NicknameUpdatedPayload) => {
      // Update tiles with new nickname
      setTiles((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((key) => {
          if (updated[key]?.ownerId === payload.userId) {
            updated[key] = { ...updated[key]!, ownerName: payload.nickname };
          }
        });
        return updated;
      });
      
      // Update user if it's the current user
      setUser((prev) => {
        if (prev && prev.id === payload.userId) {
          return { ...prev, nickname: payload.nickname };
        }
        return prev;
      });
    });

    // Claim success
    newSocket.on(SocketEvents.CLAIM_SUCCESS, (payload: ClaimSuccessPayload) => {
      setLastClaimedTile(payload.tile);
      setTotalOwned(payload.totalOwned);
      
      // Clear last claimed after animation
      setTimeout(() => setLastClaimedTile(null), 2000);
    });

    // Claim rejected
    newSocket.on(SocketEvents.CLAIM_REJECTED, (payload: ClaimRejectedPayload) => {
      console.log(`❌ Claim rejected for tile ${payload.tileId}: ${payload.reason}`);
      if (payload.reason === 'cooldown') {
        setCooldownActive(true);
      }
    });

    // Cleanup
    return () => {
      newSocket.close();
    };
  }, []);

  // Claim tile function with cooldown
  const claimTile = useCallback(
    (tileId: string) => {
      if (!socket || !isConnected || cooldownActive) return;

      // Emit claim event
      socket.emit(SocketEvents.CLAIM_TILE, { tileId });

      // Activate local cooldown with countdown
      setCooldownActive(true);
      setCooldownRemaining(CLAIM_COOLDOWN_MS);

      // Clear existing timers
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
      if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);

      // Update countdown every 100ms
      cooldownIntervalRef.current = setInterval(() => {
        setCooldownRemaining((prev) => Math.max(0, prev - 100));
      }, 100);

      // Reset cooldown after duration
      cooldownTimerRef.current = setTimeout(() => {
        setCooldownActive(false);
        setCooldownRemaining(0);
        if (cooldownIntervalRef.current) {
          clearInterval(cooldownIntervalRef.current);
        }
      }, CLAIM_COOLDOWN_MS);
    },
    [socket, isConnected, cooldownActive]
  );

  // Set nickname
  const setNickname = useCallback(
    (nickname: string) => {
      if (!socket || !isConnected) return;
      socket.emit(SocketEvents.SET_NICKNAME, { nickname });
    },
    [socket, isConnected]
  );

  // Cleanup cooldown timers
  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
      if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
    };
  }, []);

  return {
    tiles,
    user,
    userCount,
    isConnected,
    isLoading,
    cooldownActive,
    cooldownRemaining,
    error,
    leaderboard,
    lastClaimedTile,
    totalOwned,
    claimTile,
    setNickname,
  };
}
