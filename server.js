/**
 * GridSync Monolithic Server
 *
 * Runs both the API (Socket.io on internal port) and Next.js frontend
 * as a single deployable service. The API is proxied through Next.js
 * or runs on a separate internal port.
 */

import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const PORT = process.env.PORT || 3000;
const API_PORT = process.env.API_PORT || 3001;

console.log("🚀 Starting GridSync in monolithic mode...");
console.log(`📡 API will run on port ${API_PORT}`);
console.log(`🌐 Web will run on port ${PORT}`);

// Start the API server
const apiProcess = spawn("node", ["dist/index.js"], {
  cwd: join(__dirname, "apps/api"),
  env: {
    ...process.env,
    PORT: API_PORT.toString(),
    NODE_ENV: "production",
  },
  stdio: "pipe",
});

apiProcess.stdout.on("data", (data) => {
  console.log(`[API] ${data.toString().trim()}`);
});

apiProcess.stderr.on("data", (data) => {
  console.error(`[API] ${data.toString().trim()}`);
});

apiProcess.on("error", (error) => {
  console.error("Failed to start API server:", error);
  process.exit(1);
});

// Wait for API to be ready, then start Next.js
setTimeout(() => {
  console.log(" Starting Next.js server...");

  const webProcess = spawn(
    "node",
    ["node_modules/next/dist/bin/next", "start", "-p", PORT.toString()],
    {
      cwd: join(__dirname, "apps/web"),
      env: {
        ...process.env,
        PORT: PORT.toString(),
        NODE_ENV: "production",
        NEXT_PUBLIC_API_URL:
          process.env.NEXT_PUBLIC_API_URL || `http://localhost:${API_PORT}`,
      },
      stdio: "pipe",
    },
  );

  webProcess.stdout.on("data", (data) => {
    console.log(`[WEB] ${data.toString().trim()}`);
  });

  webProcess.stderr.on("data", (data) => {
    console.error(`[WEB] ${data.toString().trim()}`);
  });

  webProcess.on("error", (error) => {
    console.error("Failed to start Web server:", error);
    apiProcess.kill();
    process.exit(1);
  });

  // Handle graceful shutdown
  const shutdown = () => {
    console.log("\n🛑 Shutting down GridSync...");
    webProcess.kill("SIGTERM");
    apiProcess.kill("SIGTERM");

    setTimeout(() => {
      process.exit(0);
    }, 3000);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);

  webProcess.on("close", (code) => {
    console.log(`[WEB] Process exited with code ${code}`);
    apiProcess.kill();
    process.exit(code || 0);
  });
}, 2000);

apiProcess.on("close", (code) => {
  console.log(`[API] Process exited with code ${code}`);
  process.exit(code || 0);
});
