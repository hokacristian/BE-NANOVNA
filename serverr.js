const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:5500"

];

// Middleware
app.use(
  cors({
    origin: function (origin, callback) {
      console.log("Request Origin:", origin);
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.use(express.json());

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://bxqetstclndccppyalom.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4cWV0c3RjbG5kY2NwcHlhbG9tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTQ4MjM1MCwiZXhwIjoyMDY1MDU4MzUwfQ.3ZbX9aiIpHqpSKmOyyvAEhd9FuJ_jmPB_xdIOBrI3SQ';

const supabase = createClient(supabaseUrl, supabaseKey);

// =============================================
// UTILITY FUNCTIONS
// =============================================

/**
 * Calculate water content from return loss
 * Formula: kadar_air = 0.0054 * return_loss^2 - 0.0238 * return_loss - 12.081
 * 
 * MEMAKAI POLYNOMIAL 3
 */
function calculateWaterContent(returnLossDb) {
    const kadarAir = 0.0054 * Math.pow(returnLossDb, 2) - 0.0238 * returnLossDb - 12.081;
    return Math.round(kadarAir * 100) / -100; 
}

/**
 * Create water content table if it doesn't exist
 */
async function createWaterContentTable() {
    try {
        // Note: In production, you should create this table via Supabase dashboard
        // This is just for documentation purposes
        console.log('📋 Water content table should have the following structure:');
        console.log(`
        CREATE TABLE water_content (
            id SERIAL PRIMARY KEY,
            measurement_id INTEGER REFERENCES nanovna_measurements(id),
            return_loss_db DECIMAL,
            water_content_percent DECIMAL,
            frequency BIGINT,
            timestamp TIMESTAMP DEFAULT NOW(),
            session_id VARCHAR(50),
            notes TEXT
        );
        `);
        return true;
    } catch (error) {
        console.error('Error creating table:', error);
        return false;
    }
}

// =============================================
// API ENDPOINTS
// =============================================

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'NanoVNA Water Content Backend is running',
        timestamp: new Date().toISOString()
    });
});

/**
 * Get latest return loss from NanoVNA measurements
 */
app.get('/api/latest-return-loss', async (req, res) => {
    try {
        console.log('🔍 Fetching latest return loss data...');
        
        const { data, error } = await supabase
            .from('nanovna_measurements')
            .select('*')
            .order('id', { ascending: false })
            .limit(1);

        if (error) {
            throw error;
        }

        if (!data || data.length === 0) {
            return res.status(404).json({
                error: 'No measurement data found',
                message: 'Database appears to be empty'
            });
        }

        const latestMeasurement = data[0];
        
        res.json({
            success: true,
            data: {
                id: latestMeasurement.id,
                frequency: latestMeasurement.frequency,
                return_loss_db: latestMeasurement.return_loss_db,
                vswr: latestMeasurement.vswr,
                session_id: latestMeasurement.session_id,
                timestamp: latestMeasurement.created_at || new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('❌ Error fetching latest return loss:', error);
        res.status(500).json({
            error: 'Failed to fetch latest return loss',
            message: error.message
        });
    }
});

/**
 * Calculate water content from latest measurement
 */
app.get('/api/calculate-water-content', async (req, res) => {
    try {
        console.log('🧮 Calculating water content from latest measurement...');
        
        // Get latest measurement
        const { data, error } = await supabase
            .from('nanovna_measurements')
            .select('*')
            .order('id', { ascending: false })
            .limit(1);

        if (error) {
            throw error;
        }

        if (!data || data.length === 0) {
            return res.status(404).json({
                error: 'No measurement data found',
                message: 'Database appears to be empty'
            });
        }

        const latestMeasurement = data[0];
        const returnLossDb = latestMeasurement.return_loss_db;
        const waterContent = calculateWaterContent(returnLossDb);

        res.json({
            success: true,
            data: {
                measurement_id: latestMeasurement.id,
                frequency: latestMeasurement.frequency,
                return_loss_db: returnLossDb,
                water_content_percent: waterContent,
                calculation_formula: 'kadar_air = 0.0054 * return_loss^2 - 0.0238 * return_loss - 12.081',
                session_id: latestMeasurement.session_id,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('❌ Error calculating water content:', error);
        res.status(500).json({
            error: 'Failed to calculate water content',
            message: error.message
        });
    }
});

/**
 * Save water content to database
 */
app.post('/api/save-water-content', async (req, res) => {
    try {
        console.log('💾 Saving water content to database...');
        
        // Get latest measurement first
        const { data: measurementData, error: measurementError } = await supabase
            .from('nanovna_measurements')
            .select('*')
            .order('id', { ascending: false })
            .limit(1);

        if (measurementError) {
            throw measurementError;
        }

        if (!measurementData || measurementData.length === 0) {
            return res.status(404).json({
                error: 'No measurement data found',
                message: 'Cannot save water content without measurement data'
            });
        }

        const latestMeasurement = measurementData[0];
        const returnLossDb = latestMeasurement.return_loss_db;
        const waterContent = calculateWaterContent(returnLossDb);

        // Prepare water content record
        const waterContentRecord = {
            measurement_id: latestMeasurement.id,
            return_loss_db: returnLossDb,
            water_content_percent: waterContent,
            frequency: latestMeasurement.frequency,
            session_id: latestMeasurement.session_id,
            notes: req.body.notes || `Calculated from measurement at ${latestMeasurement.frequency/1e9} GHz`
        };

        // Insert to water content table
        const { data: savedData, error: saveError } = await supabase
            .from('water_content')
            .insert([waterContentRecord])
            .select();

        if (saveError) {
            throw saveError;
        }

        res.json({
            success: true,
            message: 'Water content saved successfully',
            data: savedData[0]
        });

    } catch (error) {
        console.error('❌ Error saving water content:', error);
        res.status(500).json({
            error: 'Failed to save water content',
            message: error.message
        });
    }
});

/**
 * Get water content history
 */
app.get('/api/water-content-history', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        
        console.log(`📊 Fetching water content history (limit: ${limit})...`);
        
        const { data, error } = await supabase
            .from('water_content')
            .select(`
                *,
                nanovna_measurements (
                    frequency,
                    s11_magnitude,
                    vswr
                )
            `)
            .order('timestamp', { ascending: false })
            .limit(limit);

        if (error) {
            throw error;
        }

        res.json({
            success: true,
            count: data.length,
            data: data
        });

    } catch (error) {
        console.error('❌ Error fetching water content history:', error);
        res.status(500).json({
            error: 'Failed to fetch water content history',
            message: error.message
        });
    }
});

/**
 * Real-time endpoint - gets latest measurement and calculates water content
 */
app.get('/api/realtime-water-content', async (req, res) => {
    try {
        console.log('⚡ Real-time water content calculation...');
        
        // Get latest measurement
        const { data, error } = await supabase
            .from('nanovna_measurements')
            .select('*')
            .order('id', { ascending: false })
            .limit(1);

        if (error) {
            throw error;
        }

        if (!data || data.length === 0) {
            return res.status(404).json({
                error: 'No measurement data found'
            });
        }

        const latestMeasurement = data[0];
        const returnLossDb = latestMeasurement.return_loss_db;
        const waterContent = calculateWaterContent(returnLossDb);

        // Auto-save to water content table
        const waterContentRecord = {
            measurement_id: latestMeasurement.id,
            return_loss_db: returnLossDb,
            water_content_percent: waterContent,
            frequency: latestMeasurement.frequency,
            session_id: latestMeasurement.session_id,
            notes: 'Real-time calculation'
        };

        const { data: savedData, error: saveError } = await supabase
            .from('water_content')
            .insert([waterContentRecord])
            .select();

        if (saveError) {
            console.warn('⚠️ Warning: Could not save to water_content table:', saveError.message);
        }

        res.json({
            success: true,
            realtime: true,
            data: {
                measurement_id: latestMeasurement.id,
                frequency: latestMeasurement.frequency,
                frequency_ghz: (latestMeasurement.frequency / 1e9).toFixed(3),
                return_loss_db: returnLossDb,
                water_content_percent: waterContent,
                vswr: latestMeasurement.vswr,
                calculation_details: {
                    formula: 'kadar_air = 0.0054 * return_loss^2 - 0.0238 * return_loss - 12.081',
                    raw_calculation: `0.0054 * ${returnLossDb}^2 - 0.0238 * ${returnLossDb} - 12.081 = ${waterContent}%`
                },
                session_id: latestMeasurement.session_id,
                timestamp: new Date().toISOString(),
                auto_saved: !saveError
            }
        });

    } catch (error) {
        console.error('❌ Error in real-time water content:', error);
        res.status(500).json({
            error: 'Failed to get real-time water content',
            message: error.message
        });
    }
});

/**
 * Get statistics
 */
app.get('/api/statistics', async (req, res) => {
    try {
        console.log('📈 Calculating statistics...');
        
        // Get measurement count
        const { count: measurementCount, error: countError } = await supabase
            .from('nanovna_measurements')
            .select('*', { count: 'exact', head: true });

        if (countError) throw countError;

        // Get latest measurement
        const { data: latestData, error: latestError } = await supabase
            .from('nanovna_measurements')
            .select('*')
            .order('id', { ascending: false })
            .limit(1);

        if (latestError) throw latestError;

        // Get water content count
        const { count: waterContentCount, error: waterError } = await supabase
            .from('water_content')
            .select('*', { count: 'exact', head: true });

        let stats = {
            total_measurements: measurementCount || 0,
            total_water_content_records: waterContentCount || 0,
            latest_measurement: latestData?.[0] || null,
            backend_status: 'Running',
            timestamp: new Date().toISOString()
        };

        if (latestData?.[0]) {
            const waterContent = calculateWaterContent(latestData[0].return_loss_db);
            stats.latest_water_content = waterContent;
        }

        res.json({
            success: true,
            statistics: stats
        });

    } catch (error) {
        console.error('❌ Error calculating statistics:', error);
        res.status(500).json({
            error: 'Failed to calculate statistics',
            message: error.message
        });
    }
});

// =============================================
// START SERVER
// =============================================

app.listen(PORT, async () => {
    console.log('🚀 NANOVNA WATER CONTENT BACKEND');
    console.log('='.repeat(50)); // Fixed: Using repeat() instead of Python-style multiplication
    console.log(`🌐 Server running on port ${PORT}`);
    console.log(`📡 Supabase URL: ${supabaseUrl}`);
    console.log(`🧮 Water content formula: kadar_air = 0.0054 * return_loss^2 - 0.0238 * return_loss - 12.081`);
    
    // Create table info
    await createWaterContentTable();
    
    console.log('\n📋 Available API endpoints:');
    console.log(`   GET  /health - Health check`);
    console.log(`   GET  /api/latest-return-loss - Get latest return loss`);
    console.log(`   GET  /api/calculate-water-content - Calculate water content`);
    console.log(`   POST /api/save-water-content - Save water content`);
    console.log(`   GET  /api/water-content-history - Get history`);
    console.log(`   GET  /api/realtime-water-content - Real-time calculation`);
    console.log(`   GET  /api/statistics - Get statistics`);
    
    console.log('\n✅ Backend ready for real-time water content monitoring!');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    process.exit(0);
});

module.exports = app;