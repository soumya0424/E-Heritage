const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const config = require('./config');

// Import database (will auto-test connection)
require('./database');

// Import routes
const monumentRoutes = require('./monumentRoutes');
const userRoutes = require('./userRoutes');
const reviewRoutes = require('./reviewRoutes');
const travelRoutes = require('./travelRoutes');

// Import error handler
const errorHandler = require('./errorHandler');

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
    origin: config.cors.allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware (development only)
if (config.server.env === 'development') {
    app.use((req, res, next) => {
        console.log(`📨 ${req.method} ${req.path}`);
        next();
    });
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'E-Heritage Vault API is running',
        state: config.state.name,
        timestamp: new Date().toISOString(),
        environment: config.server.env
    });
});

// API information endpoint
app.get('/api', (req, res) => {
    res.json({
        message: `E-Heritage Vault API - ${config.state.name} Edition`,
        version: '1.0.0',
        state: {
            name: config.state.name,
            code: config.state.code
        },
        endpoints: {
            monuments: '/api/monuments',
            users: '/api/users',
            reviews: '/api/reviews',
            travel: '/api/travel',
            health: '/health'
        },
        documentation: 'Coming soon'
    });
});

// API Routes
app.use('/api/monuments', monumentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/travel', travelRoutes);

// 404 handler - must be after all routes
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.path
    });
});

// Error handling middleware - must be last
app.use(errorHandler);

// Start server
const PORT = config.server.port;
app.listen(PORT, () => {
    console.log('🚀 ================================');
    console.log(`🚀 Server: http://localhost:${PORT}`);
    console.log(`🚀 Environment: ${config.server.env}`);
    console.log(`🏛️  State: ${config.state.name} (${config.state.code})`);
    console.log('🚀 ================================');
});

module.exports = app;
