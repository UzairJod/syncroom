import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import { createApp } from './app.js';
import { createSocketServer } from './socket/index.js';
import { roomManager } from './managers/RoomManager.js';
import { logger } from './utils/logger.js';

const PORT = parseInt(process.env.PORT ?? '3001', 10);

// ── Create servers ────────────────────────────────
const app = createApp();
const httpServer = http.createServer(app);
const io = createSocketServer(httpServer);

// ── Start listening ──────────────────────────────
httpServer.listen(PORT, () => {
  logger.info(`🚀 SyncRoom server running on port ${PORT}`);
  logger.info(`📡 Socket.IO attached`);
  logger.info(`🏥 Health check: http://localhost:${PORT}/health`);
  logger.info(`🌐 CORS origin: ${process.env.CLIENT_URL ?? 'http://localhost:3000'}`);
  logger.info(`💾 Storage type: ${process.env.STORAGE_TYPE ?? 'local'}`);
});

// ── Graceful shutdown ────────────────────────────
function shutdown(signal: string) {
  logger.info(`${signal} received. Shutting down gracefully...`);

  // Close Socket.IO connections
  io.close(() => {
    logger.info('Socket.IO connections closed');
  });

  // Stop room cleanup
  roomManager.destroy();

  // Close HTTP server
  httpServer.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });

  // Force exit after 10 seconds if graceful shutdown fails
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { message: err.message, stack: err.stack });
  shutdown('uncaughtException');
});

process.on('unhandledRejection', (reason) => {
  const message = reason instanceof Error ? reason.message : String(reason);
  logger.error('Unhandled rejection', { message });
});

export { app, httpServer, io };
