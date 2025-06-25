// =============================================
// 📁 server.js (PRODUCTION READY WITH BE STRUCTURE)
// =============================================
const express = require('express');
require('dotenv').config();

// Import configurations and middleware
const corsConfig = require('./config/cors');
const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

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
        message: 'NanoVNA Water Content Backend is running',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        structure: 'BE Organized'
    });
});

// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: 'API is working with BE structure!',
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

// =============================================
// START SERVER
// =============================================

app.listen(PORT, async () => {
    console.log('🚀 NANOVNA WATER CONTENT BACKEND (BE STRUCTURE)');
    console.log('='.repeat(50));
    console.log(`🌐 Server running on port ${PORT}`);
    console.log(`📡 Database: Connected to Supabase`);
    console.log(`🧮 Water content formula: kadar_air = 0.0054 * return_loss^2 - 0.0238 * return_loss - 12.081`);
    
    console.log('\n📋 Available API endpoints:');
    console.log(`   GET  /health - Health check`);
    console.log(`   GET  /api/test - Test endpoint`);
    console.log(`   GET  /api/latest-return-loss - Get latest return loss`);
    console.log(`   GET  /api/calculate-water-content - Calculate water content`);
    console.log(`   POST /api/save-water-content - Save water content`);
    console.log(`   GET  /api/water-content-history - Get history`);
    console.log(`   GET  /api/realtime-water-content - Real-time calculation`);
    console.log(`   GET  /api/statistics - Get statistics`);
    
    console.log('\n🛠️  Debug endpoints:');
    console.log(`   GET  /api/debug/connection - Test database connection`);
    console.log(`   GET  /api/debug/table-structure - Check table structure`);
    console.log(`   GET  /api/debug/latest-measurement - Check latest measurement`);
    console.log(`   GET  /api/debug/simple-realtime - Simple realtime test`);
    
    console.log('\n✅ Backend ready for real-time water content monitoring!');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    process.exit(0);
});

module.exports = app;