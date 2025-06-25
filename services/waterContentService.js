const MeasurementModel = require('../models/measurementModel');
const WaterContentModel = require('../models/waterContentModel');
const { calculateWaterContent, validateReturnLoss } = require('../utils/calculations');

class WaterContentService {
    /**
     * Calculate water content from latest measurement
     * Only if it hasn't been processed yet
     */
    static async calculateFromLatest() {
        try {
            const latestMeasurement = await MeasurementModel.getLatest();
            
            if (!latestMeasurement) {
                throw new Error('No measurement data found');
            }

            console.log(`🔍 Checking measurement ID: ${latestMeasurement.id}`);

            // Check if already processed - FIXED LOGIC
            const alreadyProcessed = await WaterContentModel.isAlreadyProcessed(latestMeasurement.id);
            
            console.log(`📋 Already processed: ${alreadyProcessed}`);
            
            if (alreadyProcessed) {
                console.log('ℹ️ Measurement already processed, returning existing calculation');
                
                // Get existing calculation from database
                const existingRecords = await WaterContentModel.getByMeasurementId(latestMeasurement.id);
                const existingRecord = existingRecords[0]; // Get first record
                
                return {
                    measurement_id: latestMeasurement.id,
                    frequency: latestMeasurement.frequency,
                    frequency_ghz: (latestMeasurement.frequency / 1e9).toFixed(3),
                    return_loss_db: latestMeasurement.return_loss_db,
                    water_content_percent: existingRecord?.water_content_percent || calculateWaterContent(latestMeasurement.return_loss_db),
                    vswr: latestMeasurement.vswr,
                    session_id: latestMeasurement.session_id,
                    timestamp: existingRecord?.timestamp || new Date().toISOString(),
                    is_new_calculation: false,
                    already_processed: true,
                    should_save: false // IMPORTANT: Don't save this
                };
            }

            // NEW CALCULATION - only for unprocessed measurements
            console.log('🆕 Processing new measurement...');
            
            // Validate return loss
            validateReturnLoss(latestMeasurement.return_loss_db);
            
            const waterContent = calculateWaterContent(latestMeasurement.return_loss_db);

            return {
                measurement_id: latestMeasurement.id,
                frequency: latestMeasurement.frequency,
                frequency_ghz: (latestMeasurement.frequency / 1e9).toFixed(3),
                return_loss_db: latestMeasurement.return_loss_db,
                water_content_percent: waterContent,
                vswr: latestMeasurement.vswr,
                session_id: latestMeasurement.session_id,
                timestamp: new Date().toISOString(),
                is_new_calculation: true,
                already_processed: false,
                should_save: true // IMPORTANT: Save this
            };

        } catch (error) {
            console.error('❌ Error calculating water content:', error);
            throw error;
        }
    }

    /**
     * Save water content calculation to database
     * Only if should_save is true
     */
    static async saveCalculation(calculationResult, notes = null) {
        try {
            // FIXED: Check should_save flag
            if (!calculationResult.should_save) {
                console.log('ℹ️ Skipping save - already processed or should not save');
                return {
                    ...calculationResult,
                    auto_saved: false,
                    save_skipped: true,
                    save_reason: 'Already processed'
                };
            }

            console.log(`💾 Saving new water content calculation for measurement ID: ${calculationResult.measurement_id}`);

            const waterContentRecord = {
                measurement_id: calculationResult.measurement_id,
                return_loss_db: calculationResult.return_loss_db,
                water_content_percent: calculationResult.water_content_percent,
                frequency: calculationResult.frequency,
                session_id: calculationResult.session_id,
                notes: notes || `Calculated from measurement at ${calculationResult.frequency_ghz} GHz`
            };

            const savedRecord = await WaterContentModel.save(waterContentRecord);
            
            console.log(`✅ Water content saved with ID: ${savedRecord.id}`);
            
            return {
                ...calculationResult,
                water_content_id: savedRecord.id,
                saved_at: savedRecord.timestamp,
                auto_saved: true,
                save_skipped: false
            };

        } catch (error) {
            console.error('❌ Error saving water content calculation:', error);
            // Return calculation result even if save failed
            return {
                ...calculationResult,
                auto_saved: false,
                save_error: error.message,
                save_skipped: false
            };
        }
    }

    /**
     * Get real-time water content with smart processing
     * Only processes new measurements
     */
    static async getRealTimeWaterContent() {
        try {
            console.log('⚡ Real-time water content calculation...');
            
            const calculationResult = await this.calculateFromLatest();
            
            // Only save if it's a new measurement and should_save is true
            const finalResult = await this.saveCalculation(calculationResult, 'Real-time calculation');

            // Add calculation details
            finalResult.calculation_details = {
                formula: 'kadar_air = 0.0054 * return_loss^2 - 0.0238 * return_loss - 12.081',
                raw_calculation: `0.0054 * ${finalResult.return_loss_db}^2 - 0.0238 * ${finalResult.return_loss_db} - 12.081 = ${finalResult.water_content_percent}%`
            };

            return finalResult;

        } catch (error) {
            console.error('❌ Error in real-time water content:', error);
            throw error;
        }
    }
}

module.exports = WaterContentService;