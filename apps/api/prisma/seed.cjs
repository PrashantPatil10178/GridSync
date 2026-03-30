const { PrismaClient } = require("@prisma/client");

const GRID_SIZE = 40;

function getTileId(x, y) {
  return `${x}-${y}`;
}

const prisma = new PrismaClient();

async function seed() {
  console.log("🌱 Seeding database...");

  // Check if tiles already exist
  const existingCount = await prisma.tile.count();
  if (existingCount > 0) {
    console.log(`Database already has ${existingCount} tiles. Skipping seed.`);
    return;
  }

  // Create all tiles
  const tiles = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      tiles.push({
        id: getTileId(x, y),
        x,
        y,
        ownerId: null,
        ownerName: null,
        color: null,
      });
    }
  }

  // Batch insert
  await prisma.tile.createMany({
    data: tiles,
  });

  console.log(`✅ Created ${tiles.length} tiles`);
}

seed()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
