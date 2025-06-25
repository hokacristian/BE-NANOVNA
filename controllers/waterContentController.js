const WaterContentService = require('../services/waterContentService');
const WaterContentModel = require('../models/waterContentModel');
const MeasurementModel = require('../models/measurementModel');

class WaterContentController {
    /**
     * Calculate water content from latest measurement
     */
    static async calculateWaterContent(req, res) {
        try {
            console.log('🧮 Calculating water content from latest measurement...');
            
            const result = await WaterContentService.calculateFromLatest();
            
            res.json({
                success: true,
                data: result
            });

        } catch (error) {
            console.error('❌ Error calculating water content:', error);
            res.status(500).json({
                error: 'Failed to calculate water content',
                message: error.message
            });
        }
    }

    /**
     * Save water content to database
     */
    static async saveWaterContent(req, res) {
        try {
            console.log('💾 Saving water content to database...');
            
            const calculationResult = await WaterContentService.calculateFromLatest();
            const savedResult = await WaterContentService.saveCalculation(
                calculationResult, 
                req.body.notes
            );

            res.json({
                success: true,
                message: savedResult.auto_saved ? 'Water content saved successfully' : 'Water content calculated (save failed)',
                data: savedResult
            });

        } catch (error) {
            console.error('❌ Error saving water content:', error);
            res.status(500).json({
                error: 'Failed to save water content',
                message: error.message
            });
        }
    }

    /**
     * Get water content history
     */
    static async getWaterContentHistory(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 10;
            
            console.log(`📊 Fetching water content history (limit: ${limit})...`);
            
            const data = await WaterContentModel.getHistory(limit);

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
    }

    /**
     * Real-time endpoint - gets latest measurement and calculates water content
     * SMART: Only processes NEW measurements
     */
    static async getRealtimeWaterContent(req, res) {
        try {
            const result = await WaterContentService.getRealTimeWaterContent();

            res.json({
                success: true,
                realtime: true,
                data: result
            });

        } catch (error) {
            console.error('❌ Error in real-time water content:', error);
            res.status(500).json({
                error: 'Failed to get real-time water content',
                message: error.message
            });
        }
    }
}

module.exports = WaterContentController;