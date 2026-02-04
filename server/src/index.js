import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth.js';
import listingsRoutes from './routes/listings.js';
import transactionsRoutes from './routes/transactions.js';
import messagesRoutes from './routes/messages.js';
import reviewsRoutes from './routes/reviews.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'NYU Mealswipe Marketplace API is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingsRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/reviews', reviewsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   NYU Mealswipe Marketplace API                              ║
║   Running on http://localhost:${PORT}                          ║
║                                                              ║
║   Endpoints:                                                 ║
║   - POST /api/auth/register     - Register new user          ║
║   - POST /api/auth/login        - Login                      ║
║   - GET  /api/auth/me           - Get current user           ║
║   - GET  /api/listings          - Browse listings            ║
║   - POST /api/listings          - Create listing             ║
║   - GET  /api/transactions      - View transactions          ║
║   - POST /api/transactions      - Create transaction         ║
║   - GET  /api/messages          - View messages              ║
║   - POST /api/messages          - Send message               ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

export default app;
