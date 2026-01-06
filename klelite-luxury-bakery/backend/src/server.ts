import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';

import { config } from './config';
import connectDB from './config/database';
import { initRedis } from './config/redis';
import routes from './routes';
import { errorHandler, notFound } from './middleware';
import flashSaleCronJobs from './services/flashSaleCronJobs';
import scheduleRecommendations from './jobs/computeRecommendations';
import { initSseRedis, cleanup as sseCleanup } from './services/sseService';
import { initQueues, cleanupQueues } from './queues';
import { startEmailWorker, stopEmailWorker } from './workers/emailWorker';

// Create Express app 
const app: Application = express();

// Trust proxy for Render/Vercel deployment
app.set('trust proxy', 1);

// Connect to database
connectDB();

// Security middleware - configure helmet to allow cross-origin images
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginEmbedderPolicy: false,
}));
app.use(mongoSanitize()); // Sanitize data against NoSQL injection
app.use(hpp()); // Prevent HTTP parameter pollution

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    success: false,
    message: 'Quá nhiều yêu cầu, vui lòng thử lại sau',
  },
});
app.use('/api', limiter);

// CORS
app.use(
  cors({
    origin: [
      config.frontendUrl,
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:5173',
      'https://k-lelite-web-a5fc.vercel.app',
      /\.vercel\.app$/
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser
app.use(cookieParser());

// Compression
app.use(compression());

// Logging
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Static files - with CORS headers for images
app.use('/uploads', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static('uploads'));

// API routes
app.use('/api', routes);

// Root route
app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: "Welcome to KL'élite Luxury Bakery API",
    version: '1.0.0',
    documentation: '/api/docs',
  });
});

// Handle 404
app.use(notFound);

// Error handler
app.use(errorHandler);

// Start server
const PORT = config.port;

const server = app.listen(PORT, async () => {
  try {
    console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║   🍰 KL'élite Luxury Bakery API                          ║
║                                                          ║
║   Server running in ${config.nodeEnv} mode                    ║
║   Port: ${PORT}                                            ║
║   API: http://localhost:${PORT}/api                        ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
    `);

    // Initialize Redis connection
    await initRedis();

    // Initialize SSE Redis Pub/Sub for notifications
    await initSseRedis();

    // Initialize BullMQ queues
    initQueues();

    // Start workers
    startEmailWorker();

    // Start flash sale cron jobs
    flashSaleCronJobs.start();

    // Start recommendation cron jobs
    scheduleRecommendations();
  } catch (error) {
    console.error('Error during server initialization:', error);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error('UNHANDLED REJECTION! Shutting down...');
  console.error('Error name:', err.name);
  console.error('Error message:', err.message);
  console.error('Stack trace:', err.stack);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  console.error('UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`${signal} received. Shutting down gracefully...`);
  await sseCleanup();
  await cleanupQueues();
  await stopEmailWorker();
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
