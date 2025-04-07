import express from 'express';
import http from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import dotenv from 'dotenv';
import Database from './config/database';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.io server
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Connect to MongoDB
const db = Database.getInstance();
db.connect().then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.error('Failed to connect to MongoDB:', err);
  process.exit(1);
});

// Socket.io connection
io.on('connection', (socket: Socket) => {
  console.log('New client connected:', socket.id);

  // Echo event for testing
  socket.on('echo', (data: any) => {
    console.log('Received echo event:', data);
    socket.emit('echo:response', { received: data, timestamp: new Date() });
  });

  // Disconnect event
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start server
const PORT = 3002; // Changed port to 3002
server.listen(PORT, () => {
  console.log(`WebSocket test server running on port ${PORT}`);
  console.log(`Connect to ws://localhost:${PORT}`);
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  await db.disconnect();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});