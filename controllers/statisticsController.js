const MeasurementModel = require('../models/measurementModel');
const WaterContentModel = require('../models/waterContentModel');
const { calculateWaterContent } = require('../utils/calculations');

class StatisticsController {
    /**
     * Get comprehensive statistics
     */
    static async getStatistics(req, res) {
        try {
            console.log('📈 Calculating statistics...');
            
            // Get counts
            const measurementCount = await MeasurementModel.getCount();
            const waterContentCount = await WaterContentModel.getCount();
            
            // Get latest measurement
            const latestMeasurement = await MeasurementModel.getLatest();

            let stats = {
                total_measurements: measurementCount,
                total_water_content_records: waterContentCount,
                latest_measurement: latestMeasurement,
                backend_status: 'Running',
                timestamp: new Date().toISOString()
            };

            if (latestMeasurement) {
                const waterContent = calculateWaterContent(latestMeasurement.return_loss_db);
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
    }
}

module.exports = StatisticsController;