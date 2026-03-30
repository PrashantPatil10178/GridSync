# GridSync 🟦

A **real-time collaborative grid application** where multiple users can claim tiles and see updates instantly. Built with modern technologies and a focus on clean architecture, smooth UI/UX, and correct real-time behavior.

![GridSync Preview](https://via.placeholder.com/800x400?text=GridSync+Real-Time+Grid)

## ✨ Features

- **Real-time synchronization** - All connected users see tile claims instantly
- **Smooth animations** - Framer Motion powered micro-interactions
- **Dark theme** - Linear/Vercel inspired minimal design
- **Race condition handling** - Server is the source of truth
- **Claim cooldown** - 2 second cooldown between claims to prevent spam
- **User colors** - Each user gets a unique vibrant color
- **Connection status** - Visual indicator of WebSocket connection
- **Active users count** - See how many users are online

## 🏗️ Architecture

```
GridSync/
├── apps/
│   ├── web/          # Next.js 16 frontend
│   │   ├── app/      # App router pages
│   │   ├── hooks/    # Custom React hooks (useGridSocket)
│   │   └── lib/      # Utilities
│   └── api/          # Node.js + Express + Socket.io backend
│       ├── src/      # Server source code
│       └── prisma/   # Database schema & migrations
├── packages/
│   ├── ui/           # Shared React components (Grid, Tile, StatusBar)
│   ├── types/        # Shared TypeScript types & constants
│   ├── typescript-config/
│   └── eslint-config/
└── turbo.json        # Turborepo configuration
```

## 🔌 Real-Time Flow

```
Client                          Server
   |                               |
   |-------- connect ------------->|
   |<------- INIT_GRID ------------|  (full grid state + userId + userColor)
   |                               |
   |-------- CLAIM_TILE ---------->|  (tileId)
   |                               |  [validate, check ownership, save to DB]
   |<------- TILE_UPDATED ---------|  (broadcast to ALL clients)
   |                               |
   |<------- USER_COUNT -----------|  (on connect/disconnect)
```

### Socket Events

| Event            | Direction       | Payload                                | Description                      |
| ---------------- | --------------- | -------------------------------------- | -------------------------------- |
| `INIT_GRID`      | Server → Client | `{ tiles, gridSize, user, userCount }` | Initial grid state on connection |
| `CLAIM_TILE`     | Client → Server | `{ tileId }`                           | Request to claim a tile          |
| `TILE_UPDATED`   | Server → All    | `{ tile }`                             | Broadcast when a tile is claimed |
| `USER_COUNT`     | Server → All    | `{ count }`                            | Active users count update        |
| `CLAIM_REJECTED` | Server → Client | `{ tileId, reason }`                   | Claim was rejected               |

## 🛠️ Tech Stack

### Frontend

- **Next.js 16** - React framework with App Router
- **TailwindCSS 4** - Utility-first CSS
- **Framer Motion** - Animation library
- **Socket.io Client** - WebSocket client

### Backend

- **Express 5** - Web framework
- **Socket.io** - Real-time bidirectional communication
- **Prisma** - Type-safe ORM
- **SQLite** - Local database

### Monorepo

- **Turborepo** - Build system
- **pnpm** - Package manager
- **TypeScript** - Type safety throughout

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm 9+

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd GridSync

# Install dependencies
pnpm install

# Setup the database
cd apps/api
pnpm db:push      # Push schema to SQLite
```

### Development

```bash
# From the root directory, start all apps
pnpm dev

# Or start individually:
# Terminal 1 - API server (port 3001)
cd apps/api && pnpm dev

# Terminal 2 - Web app (port 3000)
cd apps/web && pnpm dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

### Building

```bash
# Build all apps
pnpm build
```

## 🚢 Deployment (Coolify)

GridSync deploys as a **monolithic service** with both API and Web running together.

### Coolify Setup

1. **Create New Resource** → Application → Choose your Git provider
2. **Select Repository** → GridSync
3. **Build Pack** → Choose **Nixpacks** (recommended) or **Dockerfile**

### Using Nixpacks (Recommended)

Coolify auto-detects `nixpacks.toml`. Just set environment variables:

```
PORT=3000
API_PORT=3001
NEXT_PUBLIC_SOCKET_URL=https://your-domain.com:3001
```

### Using Dockerfile

If using Dockerfile, ensure:
- **Ports Exposed**: `3000` (Web)
- **Health Check Path**: `/`

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Next.js web server port |
| `API_PORT` | `3001` | Socket.io API server (internal) |
| `NEXT_PUBLIC_SOCKET_URL` | `http://localhost:3001` | WebSocket URL for frontend |
| `DATABASE_URL` | `file:./dev.db` | SQLite database path |

### Important: WebSocket Configuration

For Socket.io to work with Coolify's reverse proxy, set `NEXT_PUBLIC_SOCKET_URL` to your domain with the API port:

```
# If your domain is gridsync.example.com
NEXT_PUBLIC_SOCKET_URL=https://gridsync.example.com:3001
```

Or use a path-based approach by exposing both ports through Coolify.

### Local Testing

```bash
# Build everything
pnpm build

# Run production server locally
pnpm start
```

## 📊 Database Schema

```prisma
model Tile {
  id        String   @id          // Format: "x-y" (e.g., "15-20")
  x         Int                   // X coordinate (0-39)
  y         Int                   // Y coordinate (0-39)
  ownerId   String?               // User ID who owns this tile
  color     String?               // Hex color of the owner
  updatedAt DateTime @updatedAt   // Last update timestamp

  @@unique([x, y])
  @@index([ownerId])
}
```

## 🎨 UI/UX Design

### Color Palette

- **Background**: Deep slate (`#09090b`)
- **Unclaimed tiles**: Subtle gray (`#18181b`)
- **Borders**: Zinc (`#27272a`)
- **User colors**: 16 vibrant neon colors (coral, teal, cyan, etc.)

### Animations

- **Tile hover**: Scale up 8% + border highlight
- **Tile click**: Scale down 5% (press effect)
- **Tile claim**: Scale pulse + glow animation
- **Status indicators**: Pulsing dots
- **Transitions**: 150-300ms with ease-out

### Accessibility

- Keyboard navigation support
- ARIA labels on tiles
- Focus indicators
- High contrast colors

## ⚡ Performance Optimizations

1. **React.memo** - Tile components only re-render when their data changes
2. **Efficient state updates** - Only update changed tile in state
3. **Small WebSocket payloads** - Send only the changed tile, not full grid
4. **CSS Grid** - Native grid layout for 1600 tiles
5. **Framer Motion** - Hardware-accelerated animations

## 📁 Key Files

| File                                | Description                         |
| ----------------------------------- | ----------------------------------- |
| `apps/api/src/index.ts`             | Main server with Socket.io handlers |
| `apps/web/app/page.tsx`             | Main grid page component            |
| `apps/web/hooks/use-grid-socket.ts` | Socket.io client hook               |
| `packages/ui/src/tile.tsx`          | Individual tile component           |
| `packages/ui/src/grid.tsx`          | Grid container component            |
| `packages/types/src/index.ts`       | Shared types & constants            |

## 🔧 Configuration

### Environment Variables

```bash
# apps/web/.env.local
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001

# apps/api/.env
PORT=3001
DATABASE_URL="file:./dev.db"
```

### Grid Size

The grid size can be configured in `packages/types/src/index.ts`:

```typescript
export const GRID_SIZE = 40; // 40x40 = 1600 tiles
```

## 🧪 API Endpoints

| Endpoint  | Method | Description                                       |
| --------- | ------ | ------------------------------------------------- |
| `/health` | GET    | Health check, returns `{ status, users }`         |
| `/stats`  | GET    | Grid statistics (total, claimed, unclaimed tiles) |

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing`)
5. Open a Pull Request

## 📝 License

MIT License - feel free to use this project for learning or as a starting point for your own real-time applications.

---

Built with ❤️ using Next.js, Socket.io, Prisma, and Turborepo
