import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { state } from './state/store.js';
import { createApiRouter } from './routes/api.js';
import { startRealSportsEngine } from './engines/realSportsEngine.js';
import { startCrashEngine } from './engines/crashEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// API Routes
app.use('/api', createApiRouter(io));

// Serve static client files if built
const clientDist = path.join(__dirname, '../client/dist');
app.use(express.static(clientDist));

// SPA fallback
app.use((req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  // Send initial state
  socket.emit('init_state', {
    user: state.getUser(),
    matches: state.getMatches(),
    bets: state.getBets(state.getUser().id),
    crashState: state.crashState
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

// Start background engines
startRealSportsEngine(io);
startCrashEngine(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`⚡ 1xBet Real-time Backend running on http://localhost:${PORT}`);
});
