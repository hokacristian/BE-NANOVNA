const MeasurementModel = require('../models/measurementModel');

class MeasurementController {
    /**
     * Get latest return loss from NanoVNA measurements
     */
    static async getLatestReturnLoss(req, res) {
        try {
            console.log('🔍 Fetching latest return loss data...');
            
            const latestMeasurement = await MeasurementModel.getLatest();

            if (!latestMeasurement) {
                return res.status(404).json({
                    error: 'No measurement data found',
                    message: 'Database appears to be empty'
                });
            }
            
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
    }
}

module.exports = MeasurementController;