// Grid constants
export const GRID_SIZE = 40;
export const TOTAL_TILES = GRID_SIZE * GRID_SIZE;

// User colors - vibrant neon palette for dark theme (Gaming/Cyberpunk inspired)
export const USER_COLORS = [
  '#FF6B6B', // Coral Red
  '#4ECDC4', // Teal
  '#45B7D1', // Sky Blue
  '#96CEB4', // Sage Green
  '#FFEAA7', // Soft Yellow
  '#DDA0DD', // Plum
  '#98D8C8', // Mint
  '#F7DC6F', // Golden
  '#BB8FCE', // Lavender
  '#85C1E9', // Light Blue
  '#F8B500', // Amber
  '#00CED1', // Dark Cyan
  '#FF69B4', // Hot Pink
  '#7FFF00', // Chartreuse
  '#FF7F50', // Coral
  '#00FA9A', // Medium Spring Green
  '#E879F9', // Fuchsia
  '#38BDF8', // Light Sky
  '#A3E635', // Lime
  '#FB923C', // Orange
] as const;

// Fun adjectives and nouns for random nicknames
export const ADJECTIVES = [
  'Swift', 'Cosmic', 'Neon', 'Cyber', 'Pixel', 'Quantum', 'Turbo', 'Ultra',
  'Mega', 'Hyper', 'Super', 'Epic', 'Stellar', 'Astral', 'Mystic', 'Shadow',
  'Thunder', 'Crystal', 'Phantom', 'Nova', 'Blazing', 'Frozen', 'Electric',
  'Sonic', 'Golden', 'Silver', 'Crimson', 'Azure', 'Emerald', 'Amber',
] as const;

export const NOUNS = [
  'Pixel', 'Byte', 'Node', 'Grid', 'Cube', 'Star', 'Wolf', 'Fox', 'Bear',
  'Hawk', 'Tiger', 'Dragon', 'Phoenix', 'Ninja', 'Samurai', 'Knight',
  'Wizard', 'Mage', 'Rogue', 'Hunter', 'Spark', 'Bolt', 'Wave', 'Storm',
  'Blade', 'Arrow', 'Shield', 'Crown', 'Gem', 'Comet',
] as const;

// Generate a random nickname
export function generateNickname(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]!;
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)]!;
  const num = Math.floor(Math.random() * 100);
  return `${adj}${noun}${num}`;
}

// Tile interface
export interface Tile {
  id: string;
  x: number;
  y: number;
  ownerId: string | null;
  ownerName: string | null;
  color: string | null;
  updatedAt: string;
}

// User interface
export interface User {
  id: string;
  nickname: string;
  color: string;
  connectedAt: string;
}

// Leaderboard entry
export interface LeaderboardEntry {
  id: string;
  nickname: string;
  color: string;
  tileCount: number;
  rank: number;
}

// Grid state
export interface GridState {
  tiles: Map<string, Tile> | Record<string, Tile>;
  size: number;
}

// Socket event types - using const object instead of enum for better compatibility
export const SocketEvents = {
  // Client -> Server
  CLAIM_TILE: 'CLAIM_TILE',
  SET_NICKNAME: 'SET_NICKNAME',

  // Server -> Client
  INIT_GRID: 'INIT_GRID',
  TILE_UPDATED: 'TILE_UPDATED',
  USER_COUNT: 'USER_COUNT',
  USER_ASSIGNED: 'USER_ASSIGNED',
  CLAIM_REJECTED: 'CLAIM_REJECTED',
  LEADERBOARD_UPDATE: 'LEADERBOARD_UPDATE',
  NICKNAME_UPDATED: 'NICKNAME_UPDATED',
  CLAIM_SUCCESS: 'CLAIM_SUCCESS',
} as const;

export type SocketEventsType = typeof SocketEvents[keyof typeof SocketEvents];

// Event payloads
export interface ClaimTilePayload {
  tileId: string;
}

export interface SetNicknamePayload {
  nickname: string;
}

export interface InitGridPayload {
  tiles: Record<string, Tile>;
  gridSize: number;
  user: User;
  userCount: number;
  leaderboard: LeaderboardEntry[];
}

export interface TileUpdatedPayload {
  tile: Tile;
  claimerNickname: string;
}

export interface UserCountPayload {
  count: number;
}

export interface UserAssignedPayload {
  user: User;
}

export interface ClaimRejectedPayload {
  tileId: string;
  reason: 'already_claimed' | 'cooldown' | 'invalid_tile';
}

export interface LeaderboardUpdatePayload {
  leaderboard: LeaderboardEntry[];
}

export interface NicknameUpdatedPayload {
  userId: string;
  nickname: string;
}

export interface ClaimSuccessPayload {
  tile: Tile;
  totalOwned: number;
}

// Helper to generate tile ID from coordinates
export function getTileId(x: number, y: number): string {
  return `${x}-${y}`;
}

// Helper to parse tile ID to coordinates
export function parseTileId(id: string): { x: number; y: number } {
  const [x, y] = id.split('-').map(Number);
  return { x: x!, y: y! };
}

// Cooldown duration in milliseconds (2 seconds)
export const CLAIM_COOLDOWN_MS = 2000;

// Sound effect types
export type SoundEffect = 'claim' | 'reject' | 'connect' | 'disconnect' | 'leaderboard';

// Viewport for zoom/pan
export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

export const MIN_ZOOM = 0.5;
export const MAX_ZOOM = 3;
export const DEFAULT_ZOOM = 1;
