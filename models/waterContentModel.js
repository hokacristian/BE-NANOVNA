const { supabase } = require('../config/database');

class WaterContentModel {
    /**
     * Save water content record
     */
    static async save(waterContentData) {
        try {
            console.log('💾 Inserting water content record:', {
                measurement_id: waterContentData.measurement_id,
                water_content_percent: waterContentData.water_content_percent
            });
            
            const { data, error } = await supabase
                .from('water_content')
                .insert([waterContentData])
                .select();

            if (error) throw error;
            return data?.[0] || null;
        } catch (error) {
            console.error('❌ Error saving water content:', error);
            throw error;
        }
    }

    /**
     * Get water content history
     */
    static async getHistory(limit = 10) {
        try {
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

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('❌ Error fetching water content history:', error);
            throw error;
        }
    }

    /**
     * Get count of water content records
     */
    static async getCount() {
        try {
            const { count, error } = await supabase
                .from('water_content')
                .select('*', { count: 'exact', head: true });

            if (error) throw error;
            return count || 0;
        } catch (error) {
            console.error('❌ Error counting water content records:', error);
            throw error;
        }
    }

    /**
     * Get last processed measurement ID
     */
    static async getLastProcessedMeasurementId() {
        try {
            const { data, error } = await supabase
                .from('water_content')
                .select('measurement_id')
                .order('timestamp', { ascending: false })
                .limit(1);

            if (error) throw error;
            return data?.[0]?.measurement_id || 0;
        } catch (error) {
            console.error('❌ Error getting last processed ID:', error);
            return 0;
        }
    }

    /**
     * Check if measurement already processed - FIXED QUERY
     */
    static async isAlreadyProcessed(measurementId) {
        try {
            console.log(`🔍 Checking if measurement ${measurementId} is already processed...`);
            
            const { data, error } = await supabase
                .from('water_content')
                .select('id, measurement_id')
                .eq('measurement_id', measurementId);

            if (error) {
                console.error('❌ Error checking processed status:', error);
                throw error;
            }

            const isProcessed = (data && data.length > 0);
            console.log(`📋 Measurement ${measurementId} processed: ${isProcessed} (found ${data?.length || 0} records)`);
            
            return isProcessed;
        } catch (error) {
            console.error('❌ Error checking if already processed:', error);
            return false;
        }
    }

    /**
     * Get water content records by measurement ID
     */
    static async getByMeasurementId(measurementId) {
        try {
            const { data, error } = await supabase
                .from('water_content')
                .select('*')
                .eq('measurement_id', measurementId)
                .order('timestamp', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('❌ Error fetching water content by measurement ID:', error);
            throw error;
        }
    }
}

module.exports = WaterContentModel;