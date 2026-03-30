import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import {
  SocketEvents,
  USER_COLORS,
  GRID_SIZE,
  CLAIM_COOLDOWN_MS,
  generateNickname,
  type Tile,
  type User,
  type LeaderboardEntry,
  type ClaimTilePayload,
  type SetNicknamePayload,
  type InitGridPayload,
  type TileUpdatedPayload,
  type UserCountPayload,
  type ClaimRejectedPayload,
  type LeaderboardUpdatePayload,
  type NicknameUpdatedPayload,
  type ClaimSuccessPayload,
} from '@repo/types';

const prisma = new PrismaClient();
const app = express();
const httpServer = createServer(app);

// CORS configuration
const corsOptions = {
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// Socket.io server
const io = new Server(httpServer, {
  cors: corsOptions,
});

// User management
const connectedUsers = new Map<string, User>();
const socketToUser = new Map<string, string>(); // socketId -> odleta // socketId -> odleta // socket.id -> userId
const userCooldowns = new Map<string, number>();
let colorIndex = 0;

function assignUserColor(): string {
  const color = USER_COLORS[colorIndex % USER_COLORS.length]!;
  colorIndex++;
  return color;
}

function generateUserId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Initialize grid in database if empty
async function initializeGrid() {
  const count = await prisma.tile.count();
  if (count === 0) {
    console.log('🌱 Initializing grid...');
    const tiles = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        tiles.push({
          id: `${x}-${y}`,
          x,
          y,
          ownerId: null,
          ownerName: null,
          color: null,
        });
      }
    }
    await prisma.tile.createMany({ data: tiles });
    console.log(`✅ Created ${tiles.length} tiles`);
  }
}

// Get all tiles as a record
async function getAllTiles(): Promise<Record<string, Tile>> {
  const tiles = await prisma.tile.findMany();
  const record: Record<string, Tile> = {};
  for (const tile of tiles) {
    record[tile.id] = {
      id: tile.id,
      x: tile.x,
      y: tile.y,
      ownerId: tile.ownerId,
      ownerName: tile.ownerName,
      color: tile.color,
      updatedAt: tile.updatedAt.toISOString(),
    };
  }
  return record;
}

// Calculate leaderboard
async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const tiles = await prisma.tile.findMany({
    where: { ownerId: { not: null } },
  });

  // Group by owner
  const ownerCounts = new Map<string, { color: string; name: string; count: number }>();
  for (const tile of tiles) {
    if (tile.ownerId && tile.color) {
      const existing = ownerCounts.get(tile.ownerId);
      if (existing) {
        existing.count++;
      } else {
        ownerCounts.set(tile.ownerId, {
          color: tile.color,
          name: tile.ownerName || 'Unknown',
          count: 1,
        });
      }
    }
  }

  // Convert to array and sort
  const entries: LeaderboardEntry[] = [];
  ownerCounts.forEach((data, id) => {
    entries.push({
      id,
      nickname: data.name,
      color: data.color,
      tileCount: data.count,
      rank: 0,
    });
  });

  // Sort by tile count (descending) and assign ranks
  entries.sort((a, b) => b.tileCount - a.tileCount);
  entries.forEach((entry, index) => {
    entry.rank = index + 1;
  });

  // Return top 10
  return entries.slice(0, 10);
}

// Count tiles for a specific user
async function getUserTileCount(userId: string): Promise<number> {
  return prisma.tile.count({ where: { ownerId: userId } });
}

// Claim a tile
async function claimTile(
  tileId: string,
  userId: string,
  userColor: string,
  userName: string
): Promise<{
  success: boolean;
  tile?: Tile;
  reason?: ClaimRejectedPayload['reason'];
}> {
  try {
    // Check if tile exists and is unclaimed (atomic operation)
    const tile = await prisma.tile.findUnique({ where: { id: tileId } });

    if (!tile) {
      return { success: false, reason: 'invalid_tile' };
    }

    if (tile.ownerId !== null) {
      return { success: false, reason: 'already_claimed' };
    }

    // Claim the tile
    const updatedTile = await prisma.tile.update({
      where: {
        id: tileId,
        ownerId: null, // Ensure still unclaimed (race condition protection)
      },
      data: {
        ownerId: userId,
        ownerName: userName,
        color: userColor,
      },
    });

    return {
      success: true,
      tile: {
        id: updatedTile.id,
        x: updatedTile.x,
        y: updatedTile.y,
        ownerId: updatedTile.ownerId,
        ownerName: updatedTile.ownerName,
        color: updatedTile.color,
        updatedAt: updatedTile.updatedAt.toISOString(),
      },
    };
  } catch {
    // Prisma will throw if the where condition fails (tile was claimed by someone else)
    return { success: false, reason: 'already_claimed' };
  }
}

// Update user nickname in all their tiles
async function updateUserNicknameInTiles(userId: string, newNickname: string) {
  await prisma.tile.updateMany({
    where: { ownerId: userId },
    data: { ownerName: newNickname },
  });
}

// Socket.io connection handling
io.on('connection', async (socket) => {
  // Assign user identity
  const userId = generateUserId();
  const userColor = assignUserColor();
  const nickname = generateNickname();
  const user: User = {
    id: userId,
    nickname,
    color: userColor,
    connectedAt: new Date().toISOString(),
  };

  connectedUsers.set(userId, user);
  socketToUser.set(socket.id, userId);
  console.log(`👤 User connected: ${nickname} (${userColor})`);

  // Send initial grid state
  const tiles = await getAllTiles();
  const leaderboard = await getLeaderboard();
  const initPayload: InitGridPayload = {
    tiles,
    gridSize: GRID_SIZE,
    user,
    userCount: connectedUsers.size,
    leaderboard,
  };
  socket.emit(SocketEvents.INIT_GRID, initPayload);

  // Broadcast updated user count to all clients
  const userCountPayload: UserCountPayload = { count: connectedUsers.size };
  io.emit(SocketEvents.USER_COUNT, userCountPayload);

  // Handle nickname change
  socket.on(SocketEvents.SET_NICKNAME, async (payload: SetNicknamePayload) => {
    const currentUserId = socketToUser.get(socket.id);
    if (!currentUserId) return;

    const currentUser = connectedUsers.get(currentUserId);
    if (!currentUser) return;

    // Sanitize nickname (max 20 chars, alphanumeric + basic chars)
    const sanitized = payload.nickname.slice(0, 20).replace(/[^a-zA-Z0-9_-]/g, '');
    if (sanitized.length < 2) return;

    // Update user
    currentUser.nickname = sanitized;
    connectedUsers.set(currentUserId, currentUser);

    // Update all tiles owned by this user
    await updateUserNicknameInTiles(currentUserId, sanitized);

    // Broadcast nickname update
    const nicknamePayload: NicknameUpdatedPayload = {
      userId: currentUserId,
      nickname: sanitized,
    };
    io.emit(SocketEvents.NICKNAME_UPDATED, nicknamePayload);

    // Update leaderboard
    const leaderboard = await getLeaderboard();
    const leaderboardPayload: LeaderboardUpdatePayload = { leaderboard };
    io.emit(SocketEvents.LEADERBOARD_UPDATE, leaderboardPayload);

    console.log(`📝 ${currentUserId} changed nickname to: ${sanitized}`);
  });

  // Handle tile claim
  socket.on(SocketEvents.CLAIM_TILE, async (payload: ClaimTilePayload) => {
    const currentUserId = socketToUser.get(socket.id);
    if (!currentUserId) return;

    const currentUser = connectedUsers.get(currentUserId);
    if (!currentUser) return;

    // Check cooldown
    const lastClaim = userCooldowns.get(currentUserId);
    const now = Date.now();
    if (lastClaim && now - lastClaim < CLAIM_COOLDOWN_MS) {
      const rejectPayload: ClaimRejectedPayload = {
        tileId: payload.tileId,
        reason: 'cooldown',
      };
      socket.emit(SocketEvents.CLAIM_REJECTED, rejectPayload);
      return;
    }

    // Attempt to claim
    const result = await claimTile(
      payload.tileId,
      currentUserId,
      currentUser.color,
      currentUser.nickname
    );

    if (result.success && result.tile) {
      // Update cooldown
      userCooldowns.set(currentUserId, now);

      // Get total tiles owned by this user
      const totalOwned = await getUserTileCount(currentUserId);

      // Send success to claiming user
      const successPayload: ClaimSuccessPayload = {
        tile: result.tile,
        totalOwned,
      };
      socket.emit(SocketEvents.CLAIM_SUCCESS, successPayload);

      // Broadcast tile update to ALL clients
      const updatePayload: TileUpdatedPayload = {
        tile: result.tile,
        claimerNickname: currentUser.nickname,
      };
      io.emit(SocketEvents.TILE_UPDATED, updatePayload);

      // Update and broadcast leaderboard
      const leaderboard = await getLeaderboard();
      const leaderboardPayload: LeaderboardUpdatePayload = { leaderboard };
      io.emit(SocketEvents.LEADERBOARD_UPDATE, leaderboardPayload);

      console.log(`🎯 Tile ${payload.tileId} claimed by ${currentUser.nickname}`);
    } else {
      // Notify the user their claim was rejected
      const rejectPayload: ClaimRejectedPayload = {
        tileId: payload.tileId,
        reason: result.reason || 'already_claimed',
      };
      socket.emit(SocketEvents.CLAIM_REJECTED, rejectPayload);
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    const userId = socketToUser.get(socket.id);
    if (userId) {
      const user = connectedUsers.get(userId);
      if (user) {
        console.log(`👋 User disconnected: ${user.nickname}`);
      }
      connectedUsers.delete(userId);
      socketToUser.delete(socket.id);
      userCooldowns.delete(userId);

      // Broadcast updated user count
      const userCountPayload: UserCountPayload = { count: connectedUsers.size };
      io.emit(SocketEvents.USER_COUNT, userCountPayload);
    }
  });
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', users: connectedUsers.size });
});

// Stats endpoint
app.get('/stats', async (_req, res) => {
  const totalTiles = await prisma.tile.count();
  const claimedTiles = await prisma.tile.count({
    where: { ownerId: { not: null } },
  });
  const leaderboard = await getLeaderboard();
  res.json({
    totalTiles,
    claimedTiles,
    unclaimedTiles: totalTiles - claimedTiles,
    activeUsers: connectedUsers.size,
    leaderboard,
  });
});

// Leaderboard endpoint
app.get('/leaderboard', async (_req, res) => {
  const leaderboard = await getLeaderboard();
  res.json({ leaderboard });
});

const PORT = process.env.PORT || 3001;

// Start server
async function start() {
  await initializeGrid();
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Grid size: ${GRID_SIZE}x${GRID_SIZE} (${GRID_SIZE * GRID_SIZE} tiles)`);
  });
}

start().catch(console.error);
