const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import routes
const monumentRoutes = require('./monumentRoutes');
const userRoutes = require('./userRoutes');
const travelRoutes = require('./travelRoutes');

const app = express();

// ===== FIXED: Allow all origins for development =====
app.use(cors({
    origin: '*',  // Allow all origins
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
// ====================================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== ADDED: Serve static images from /images folder =====
app.use('/images', express.static('images'));
// ===========================================================

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'E-Heritage API is running',
        timestamp: new Date().toISOString(),
        googleApiKey: process.env.GOOGLE_PLACES_API_KEY ? 'Configured ✅' : 'Missing ❌'
    });
});

// API information
app.get('/api', (req, res) => {
    res.json({
        message: 'E-Heritage Vault API - Odisha Edition',
        version: '2.0.0',
        state: {
            name: 'Odisha',
            code: 'OR'
        },
        endpoints: {
            health: '/health',
            monuments: '/api/monuments',
            monument_stats: '/api/monuments/stats',
            monument_detail: '/api/monuments/:id',
            users_signup: '/api/users/signup',
            users_login: '/api/users/login',
            travel_hotels: '/api/travel/hotels/:monumentId',
            travel_restaurants: '/api/travel/restaurants/:monumentId',
            travel_nearby: '/api/travel/nearby/:monumentId'
        },
        documentation: 'Visit endpoints for more information'
    });
});

// Register routes
app.use('/api/monuments', monumentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/travel', travelRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.path
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: err.message
    });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('================================');
    console.log(`✅ E-Heritage API Running`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`📍 State: Odisha`);
    console.log('================================');
    console.log('📋 Available Endpoints:');
    console.log(`  GET  /health`);
    console.log(`  GET  /api`);
    console.log(`  GET  /api/monuments`);
    console.log(`  GET  /api/monuments/stats`);
    console.log(`  POST /api/users/signup`);
    console.log(`  POST /api/users/login`);
    console.log(`  GET  /api/travel/hotels/:monumentId`);
    console.log(`  GET  /api/travel/restaurants/:monumentId`);
    console.log(`  GET  /api/travel/nearby/:monumentId`);
    console.log('================================');
    console.log('🔑 Google Places API:', process.env.GOOGLE_PLACES_API_KEY ? 'Configured ✅' : 'Missing ❌');
    console.log('🖼️  Static Images: http://localhost:' + PORT + '/images/');
    console.log('🌐 CORS: Enabled for all origins (Development Mode)');
    console.log('================================');
});