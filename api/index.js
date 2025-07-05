const express = require('express');
require('dotenv').config();

// Import configurations and middleware
const corsConfig = require('../config/cors');
const logger = require('../middleware/logger');
const errorHandler = require('../middleware/errorHandler');

// Import routes
const apiRoutes = require('../routes/api');

const app = express();

// =============================================
// MIDDLEWARE SETUP
// =============================================

// CORS configuration
app.use(corsConfig);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use(logger);

// =============================================
// ROUTES
// =============================================

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'NanoVNA Water Content Backend is running on Vercel',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        structure: 'Vercel Serverless'
    });
});

// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: 'API is working on Vercel!',
        timestamp: new Date().toISOString()
    });
});

// API routes
app.use('/api', apiRoutes);

// =============================================
// ERROR HANDLING
// =============================================

// Error handler middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        message: `${req.method} ${req.originalUrl} is not a valid endpoint`,
        available_endpoints: [
            'GET /health',
            'GET /api/test',
            'GET /api/latest-return-loss',
            'GET /api/calculate-water-content',
            'GET /api/realtime-water-content',
            'GET /api/water-content-history',
            'GET /api/statistics',
            'POST /api/save-water-content'
        ]
    });
});

module.exports = app;