import dotenv from 'dotenv';
// Load environment variables FIRST before any other imports
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/database.js';
import { emailSocketHandler } from './config/socket.js';
import { startAllWatchers } from './services/imapWatcher.js';

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Parse allowed origins for CORS
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['http://localhost:5173'];

// Initialize Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Make io accessible globally for helper functions
global.io = io;
app.set('io', io);

// Socket.IO handler
emailSocketHandler(io);

// Trust proxy (for accurate IP addresses behind nginx)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS middleware - support multiple origins
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API Routes
import emailRoutes from './routes/email.routes.js';
import authRoutes from './routes/auth.routes.js';
import chatRoutes from './routes/chat.routes.js';
import leadRoutes from './routes/lead.routes.js';
import interactionRoutes from './routes/interaction.routes.js';
import contentRoutes from './routes/content.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import employeeRoutes from './routes/employee.routes.js';
import marketingRoutes from './routes/marketing.routes.js';
import templateRoutes from './routes/template.routes.js';
import sequenceRoutes from './routes/sequence.routes.js';
import abTestRoutes from './routes/abTest.routes.js';
import socialRoutes from './routes/social.routes.js';
import analyticsDashboardRoutes from './routes/analyticsDashboard.routes.js';
import emailDiagnosticsRoutes from './routes/emailDiagnostics.routes.js';

// Rate limiting middleware
import { apiLimiter, leadCreationLimiter, chatLimiter, downloadLimiter } from './middleware/rateLimiter.js';

app.use('/api/email', emailRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatLimiter, chatRoutes);
app.use('/api/leads', leadCreationLimiter, leadRoutes);
app.use('/api/interactions', apiLimiter, interactionRoutes);
app.use('/api/content', apiLimiter, contentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/employees', apiLimiter, employeeRoutes);
app.use('/api/marketing', apiLimiter, marketingRoutes);
app.use('/api/templates', apiLimiter, templateRoutes);
app.use('/api/sequences', apiLimiter, sequenceRoutes);
app.use('/api/abtests', apiLimiter, abTestRoutes);
app.use('/api/social', apiLimiter, socialRoutes);
app.use('/api/analytics-dashboard', apiLimiter, analyticsDashboardRoutes);
app.use('/api/email-diagnostics', apiLimiter, emailDiagnosticsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Start server
const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    // Start listening
    httpServer.listen(PORT, async () => {
      console.log(`
╔═══════════════════════════════════════╗
║   🚀 EmenTech Backend Server         ║
╠═══════════════════════════════════════╣
║  Environment: ${process.env.NODE_ENV || 'development'}${' '.repeat(22)}║
║  Port: ${PORT}${' '.repeat(30)}║
║  URL: http://localhost:${PORT}${' '.repeat(15)}║
╚═══════════════════════════════════════╝
      `);
      console.log('✅ Socket.IO initialized');
      console.log('📧 Email system ready');

      // Start IMAP watchers for real-time email monitoring
      console.log('🔄 Starting IMAP watchers...');
      await startAllWatchers();
      console.log('✅ Real-time email monitoring active');

      console.log('🤖 AI Chatbot ready');
      console.log('👥 Employee management ready');
      console.log('📊 Lead capture & analytics ready');
      console.log('📦 Content management ready');
      console.log('📬 Email sequences & drip campaigns ready');
      console.log('🔗 Social media integration ready');
      console.log('📊 Analytics dashboard ready');
      console.log('🔐 Email security & diagnostics ready');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log(`❌ Unhandled Rejection: ${err.message}`);
  httpServer.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log(`❌ Uncaught Exception: ${err.message}`);
  httpServer.close(() => process.exit(1));
});

// Start the server
startServer();

export { app, io };
