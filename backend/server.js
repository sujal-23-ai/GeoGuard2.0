require('dotenv').config();
const http = require('http');
const { Server: SocketServer } = require('socket.io');
const { createApp } = require('./src/app');
const { connectDatabase } = require('./src/config/database');
const { createRedisClient } = require('./src/config/redis');
const { setupSockets } = require('./src/sockets');

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDatabase();
    await createRedisClient();

    const app = createApp();
    const server = http.createServer(app);

    const io = new SocketServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    app.set('io', io);
    setupSockets(io);

    server.listen(PORT, () => {
      console.log(`\n🚀 GeoGuard backend running on http://localhost:${PORT}`);
      console.log(`📡 WebSocket server ready`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}\n`);
    });

    const shutdown = async (signal) => {
      console.log(`\n${signal} received, shutting down...`);
      server.close(() => process.exit(0));
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

start();
