const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Initialize Express app FIRST
const app = express();

// CORS Configuration - Must be BEFORE routes
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import ONLY the routes you actually have
const monumentRoutes = require('./monumentRoutes');
const userRoutes = require('./userRoutes');

// Simple health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'E-Heritage API is running',
        timestamp: new Date().toISOString()
    });
});

// API information endpoint
app.get('/api', (req, res) => {
    res.json({
        message: 'E-Heritage Vault API - Odisha Edition',
        version: '1.0.0',
        state: {
            name: 'Odisha',
            code: 'OR'
        },
        endpoints: {
            monuments: '/api/monuments',
            monument_stats: '/api/monuments/stats',
            monument_nearby: '/api/monuments/nearby',
            monument_detail: '/api/monuments/:id',
            users: '/api/users',
            health: '/health'
        },
        documentation: 'Visit endpoints for more information'
    });
});

// Attach routers
app.use('/api/monuments', monumentRoutes);
app.use('/api/users', userRoutes);

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.path
    });
});

// Error Handler
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('================================');
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log('================================');
    console.log('📍 Available Endpoints:');
    console.log(`   Health Check:  http://localhost:${PORT}/health`);
    console.log(`   API Info:      http://localhost:${PORT}/api`);
    console.log(`   Monuments:     http://localhost:${PORT}/api/monuments`);
    console.log(`   Nearby:        http://localhost:${PORT}/api/monuments/nearby?latitude=20.2961&longitude=85.8245&radius=100`);
    console.log(`   Users:         http://localhost:${PORT}/api/users`);
    console.log('================================');
});
