import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'ScriptBlox API',
    version: '1.0.0',
    status: 'Online',
    endpoints: {
      health: '/api/health'
    }
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Auth routes (placeholder)
app.get('/api/auth', (req, res) => {
  res.json({ message: 'Auth endpoints' });
});

// Scripts routes (placeholder)
app.get('/api/scripts', (req, res) => {
  res.json({ message: 'Scripts endpoints' });
});

// Payments routes (placeholder)
app.get('/api/payments', (req, res) => {
  res.json({ message: 'Payments endpoints' });
});

// Admin routes (placeholder)
app.get('/api/admin', (req, res) => {
  res.json({ message: 'Admin endpoints' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    message: 'Endpoint not found',
    path: req.path
  });
});

export default app;
