import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { app } from './app';
import Database from './config/database';
import SocketServer from './websocket/socket-server';

// Load environment variables
dotenv.config();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io server
const socketServer = new SocketServer(server);

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, async () => {
  // Connect to MongoDB using the Database class
  await Database.getInstance().connect();
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server initialized`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  // Disconnect from MongoDB before closing the server
  Database.getInstance().disconnect().then(() => {
    server.close(() => process.exit(1));
  });
});

export { app, server, socketServer };