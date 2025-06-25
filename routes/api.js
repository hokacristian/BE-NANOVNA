const express = require('express');
const router = express.Router();

// Import controllers
const MeasurementController = require('../controllers/measurementController');
const WaterContentController = require('../controllers/waterContentController');
const StatisticsController = require('../controllers/statisticsController');

// =============================================
// 📁 DEBUG ENDPOINTS - Add to your routes/api.js
// =============================================

// TEST 1: Basic database connection
router.get('/debug/connection', async (req, res) => {
    try {
        console.log('🔍 Testing database connection...');
        
        const { supabase } = require('../config/database');
        
        // Test connection with simple query
        const { data, error } = await supabase
            .from('nanovna_measurements')
            .select('count(*)')
            .limit(1);
            
        if (error) {
            throw error;
        }
        
        res.json({
            success: true,
            message: 'Database connection working',
            test_result: data
        });
        
    } catch (error) {
        console.error('❌ Database connection test failed:', error);
        res.status(500).json({
            success: false,
            error: 'Database connection failed',
            details: error.message
        });
    }
});

// TEST 2: Check table structure
router.get('/debug/table-structure', async (req, res) => {
    try {
        console.log('🔍 Checking table structures...');
        
        const { supabase } = require('../config/database');
        
        // Check nanovna_measurements table
        const { data: measurementData, error: measurementError } = await supabase
            .from('nanovna_measurements')
            .select('*')
            .limit(1);
            
        // Check water_content table 
        const { data: waterContentData, error: waterContentError } = await supabase
            .from('water_content')
            .select('*')
            .limit(1);
            
        res.json({
            success: true,
            tables: {
                nanovna_measurements: {
                    accessible: !measurementError,
                    error: measurementError?.message,
                    sample_data: measurementData?.[0] || null,
                    total_records: measurementData?.length || 0
                },
                water_content: {
                    accessible: !waterContentError,
                    error: waterContentError?.message,
                    sample_data: waterContentData?.[0] || null,
                    total_records: waterContentData?.length || 0
                }
            }
        });
        
    } catch (error) {
        console.error('❌ Table structure check failed:', error);
        res.status(500).json({
            success: false,
            error: 'Table structure check failed',
            details: error.message
        });
    }
});

// TEST 3: Manual insert test
router.post('/debug/manual-insert', async (req, res) => {
    try {
        console.log('🔍 Testing manual insert to water_content...');
        
        const { supabase } = require('../config/database');
        
        // Get latest measurement first
        const { data: measurementData, error: measurementError } = await supabase
            .from('nanovna_measurements')
            .select('*')
            .order('id', { ascending: false })
            .limit(1);
            
        if (measurementError || !measurementData || measurementData.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'No measurement data found for testing'
            });
        }
        
        const latestMeasurement = measurementData[0];
        
        // Calculate water content
        const returnLoss = latestMeasurement.return_loss_db;
        const waterContent = 0.0054 * Math.pow(returnLoss, 2) - 0.0238 * returnLoss - 12.081;
        
        // Manual insert
        const testRecord = {
            measurement_id: latestMeasurement.id,
            return_loss_db: returnLoss,
            water_content_percent: Math.round(waterContent * 100) / 100,
            frequency: latestMeasurement.frequency,
            session_id: latestMeasurement.session_id,
            notes: 'DEBUG: Manual insert test'
        };
        
        console.log('💾 Inserting test record:', testRecord);
        
        const { data: insertData, error: insertError } = await supabase
            .from('water_content')
            .insert([testRecord])
            .select();
            
        if (insertError) {
            throw insertError;
        }
        
        res.json({
            success: true,
            message: 'Manual insert successful',
            source_measurement: latestMeasurement,
            inserted_record: insertData[0],
            calculation: {
                formula: '0.0054 * return_loss^2 - 0.0238 * return_loss - 12.081',
                input: returnLoss,
                output: waterContent
            }
        });
        
    } catch (error) {
        console.error('❌ Manual insert test failed:', error);
        res.status(500).json({
            success: false,
            error: 'Manual insert failed',
            details: error.message,
            full_error: error
        });
    }
});

// TEST 4: Check latest measurement details
router.get('/debug/latest-measurement', async (req, res) => {
    try {
        console.log('🔍 Checking latest measurement details...');
        
        const { supabase } = require('../config/database');
        
        const { data, error } = await supabase
            .from('nanovna_measurements')
            .select('*')
            .order('id', { ascending: false })
            .limit(5); // Get last 5 records
            
        if (error) {
            throw error;
        }
        
        res.json({
            success: true,
            latest_measurements: data,
            count: data?.length || 0,
            latest_id: data?.[0]?.id || null
        });
        
    } catch (error) {
        console.error('❌ Latest measurement check failed:', error);
        res.status(500).json({
            success: false,
            error: 'Latest measurement check failed',
            details: error.message
        });
    }
});

// TEST 5: Check water content records
router.get('/debug/water-content-records', async (req, res) => {
    try {
        console.log('🔍 Checking water content records...');
        
        const { supabase } = require('../config/database');
        
        const { data, error, count } = await supabase
            .from('water_content')
            .select('*', { count: 'exact' })
            .order('id', { ascending: false });
            
        if (error) {
            throw error;
        }
        
        res.json({
            success: true,
            water_content_records: data,
            total_count: count,
            latest_record: data?.[0] || null
        });
        
    } catch (error) {
        console.error('❌ Water content records check failed:', error);
        res.status(500).json({
            success: false,
            error: 'Water content records check failed',
            details: error.message
        });
    }
});

// =============================================
// SIMPLIFIED REALTIME ENDPOINT FOR TESTING
// =============================================
router.get('/debug/simple-realtime', async (req, res) => {
    try {
        console.log('⚡ SIMPLE REALTIME TEST...');
        
        const { supabase } = require('../config/database');
        
        // Step 1: Get latest measurement
        console.log('1️⃣ Getting latest measurement...');
        const { data: measurementData, error: measurementError } = await supabase
            .from('nanovna_measurements')
            .select('*')
            .order('id', { ascending: false })
            .limit(1);
            
        if (measurementError) {
            throw new Error(`Measurement query failed: ${measurementError.message}`);
        }
        
        if (!measurementData || measurementData.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'No measurement data found'
            });
        }
        
        const latestMeasurement = measurementData[0];
        console.log(`✅ Got measurement ID: ${latestMeasurement.id}`);
        
        // Step 2: Check if already processed
        console.log('2️⃣ Checking if already processed...');
        const { data: existingData, error: existingError } = await supabase
            .from('water_content')
            .select('*')
            .eq('measurement_id', latestMeasurement.id);
            
        if (existingError) {
            console.warn(`⚠️ Warning checking existing: ${existingError.message}`);
        }
        
        const alreadyExists = existingData && existingData.length > 0;
        console.log(`📋 Already exists: ${alreadyExists} (${existingData?.length || 0} records)`);
        
        // Step 3: Calculate water content
        console.log('3️⃣ Calculating water content...');
        const returnLoss = latestMeasurement.return_loss_db;
        const waterContent = 0.0054 * Math.pow(returnLoss, 2) - 0.0238 * returnLoss - 12.081;
        const roundedWaterContent = Math.round(waterContent * 100) / 100;
        
        let result = {
            measurement_id: latestMeasurement.id,
            frequency: latestMeasurement.frequency,
            frequency_ghz: (latestMeasurement.frequency / 1e9).toFixed(3),
            return_loss_db: returnLoss,
            water_content_percent: roundedWaterContent,
            session_id: latestMeasurement.session_id,
            already_processed: alreadyExists,
            timestamp: new Date().toISOString()
        };
        
        // Step 4: Save if new
        if (!alreadyExists) {
            console.log('4️⃣ Saving new water content record...');
            
            const newRecord = {
                measurement_id: latestMeasurement.id,
                return_loss_db: returnLoss,
                water_content_percent: roundedWaterContent,
                frequency: latestMeasurement.frequency,
                session_id: latestMeasurement.session_id,
                notes: 'Simple realtime test'
            };
            
            const { data: savedData, error: saveError } = await supabase
                .from('water_content')
                .insert([newRecord])
                .select();
                
            if (saveError) {
                console.error(`❌ Save failed: ${saveError.message}`);
                result.save_error = saveError.message;
                result.auto_saved = false;
            } else {
                console.log(`✅ Saved with ID: ${savedData[0].id}`);
                result.water_content_id = savedData[0].id;
                result.auto_saved = true;
            }
        } else {
            console.log('ℹ️ Skipping save - already exists');
            result.auto_saved = false;
            result.existing_record = existingData[0];
        }
        
        res.json({
            success: true,
            debug: true,
            data: result
        });
        
    } catch (error) {
        console.error('❌ Simple realtime test failed:', error);
        res.status(500).json({
            success: false,
            error: 'Simple realtime test failed',
            details: error.message,
            stack: error.stack
        });
    }
});

// Measurement routes
router.get('/latest-return-loss', MeasurementController.getLatestReturnLoss);

// Water content routes
router.get('/calculate-water-content', WaterContentController.calculateWaterContent);
router.post('/save-water-content', WaterContentController.saveWaterContent);
router.get('/water-content-history', WaterContentController.getWaterContentHistory);
router.get('/realtime-water-content', WaterContentController.getRealtimeWaterContent);

// Statistics routes
router.get('/statistics', StatisticsController.getStatistics);



module.exports = router;