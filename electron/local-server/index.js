/**
 * index.js — Local Express + Socket.IO Server
 * Runs inside the Electron main process on port 3001.
 * All routes mirror the cloud backend API structure.
 * Mobiles connect via Socket.IO on the same port.
 */

const express    = require('express');
const cors       = require('cors');
const http       = require('http');
const { Server } = require('socket.io');

const { authMiddleware } = require('./auth-helper');

// Route modules
const authRoutes          = require('./routes/auth');
const branchRoutes        = require('./routes/branches');
const staffRoutes         = require('./routes/staff');
const sectionRoutes       = require('./routes/sections');
const tableRoutes         = require('./routes/tables');
const menuRoutes          = require('./routes/menu');
const orderRoutes         = require('./routes/orders');
const printerRoutes       = require('./routes/printers');
const dashboardRoutes     = require('./routes/dashboard');
const notificationRoutes  = require('./routes/notifications');
const syncRoutes          = require('./routes/sync-routes');

let io = null;

/** Returns the Socket.IO instance so routes can broadcast events */
function getIO() { return io; }

async function createLocalServer(port) {
  const app        = express();
  const httpServer = http.createServer(app);

  // ── Socket.IO (for mobile waiter clients on LAN) ──────────────────────────
  io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
  });

  io.on('connection', (socket) => {
    console.log('[Socket.IO] Mobile connected:', socket.id);

    socket.on('join_branch', ({ branchId }) => {
      socket.join(`branch_${branchId}`);
      console.log(`[Socket.IO] Client ${socket.id} joined branch_${branchId}`);
    });

    socket.on('disconnect', () => {
      console.log('[Socket.IO] Mobile disconnected:', socket.id);
    });
  });

  // ── Middleware ─────────────────────────────────────────────────────────────
  app.use(cors({ origin: '*' }));
  app.use(express.json({ limit: '10mb' }));

  // Inject io into requests for route-level broadcasting
  app.use((req, _res, next) => {
    req.io = io;
    next();
  });

  // ── Routes (all under /api/v1 to mirror cloud backend) ────────────────────
  app.use('/api/v1/auth',          authRoutes);
  app.use('/api/v1/branches',      authMiddleware, branchRoutes);
  app.use('/api/v1/staff',         authMiddleware, staffRoutes);
  app.use('/api/v1/sections',      authMiddleware, sectionRoutes);
  app.use('/api/v1/tables',        authMiddleware, tableRoutes);
  app.use('/api/v1/menu',          authMiddleware, menuRoutes);
  app.use('/api/v1/orders',        authMiddleware, orderRoutes);
  app.use('/api/v1/printers',      authMiddleware, printerRoutes);
  app.use('/api/v1/dashboard',     authMiddleware, dashboardRoutes);
  app.use('/api/v1/notifications', authMiddleware, notificationRoutes);
  app.use('/api/v1/sync',          syncRoutes);

  // ── Health check ──────────────────────────────────────────────────────────
  app.get('/health', (_req, res) => res.json({ ok: true, mode: 'electron-local' }));

  // ── 404 ───────────────────────────────────────────────────────────────────
  app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

  // ── Start listening ───────────────────────────────────────────────────────
  await new Promise((resolve, reject) => {
    httpServer.listen(port, '0.0.0.0', (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  return httpServer;
}

module.exports = { createLocalServer, getIO };
