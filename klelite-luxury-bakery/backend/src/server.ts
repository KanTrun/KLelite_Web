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
import routes from './routes';
import { errorHandler, notFound } from './middleware';

// Create Express app
const app: Application = express();

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

const server = app.listen(PORT, () => {
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
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error('UNHANDLED REJECTION! Shutting down...');
  console.error(err.name, err.message);
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
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
  });
});

export default app;
