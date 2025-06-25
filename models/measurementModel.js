const { supabase } = require('../config/database');

class MeasurementModel {
    /**
     * Get latest measurement from nanovna_measurements table
     */
    static async getLatest() {
        try {
            console.log('🔍 Fetching latest measurement...');
            
            const { data, error } = await supabase
                .from('nanovna_measurements')
                .select('*')
                .order('id', { ascending: false })
                .limit(1);

            if (error) {
                console.error('❌ Error fetching latest measurement:', error);
                throw error;
            }

            if (!data || data.length === 0) {
                console.log('⚠️ No measurement data found');
                return null;
            }

            const latestMeasurement = data[0];
            console.log(`✅ Got latest measurement ID: ${latestMeasurement.id}`);
            
            return latestMeasurement;
        } catch (error) {
            console.error('❌ Error in getLatest:', error);
            throw error;
        }
    }

    /**
     * Get measurement by ID
     */
    static async getById(id) {
        try {
            const { data, error } = await supabase
                .from('nanovna_measurements')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('❌ Error fetching measurement by ID:', error);
            throw error;
        }
    }

    /**
     * Get measurement count
     */
    static async getCount() {
        try {
            const { count, error } = await supabase
                .from('nanovna_measurements')
                .select('*', { count: 'exact', head: true });

            if (error) throw error;
            return count || 0;
        } catch (error) {
            console.error('❌ Error counting measurements:', error);
            throw error;
        }
    }

    /**
     * Get recent measurements
     */
    static async getRecent(limit = 10) {
        try {
            const { data, error } = await supabase
                .from('nanovna_measurements')
                .select('*')
                .order('id', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('❌ Error fetching recent measurements:', error);
            throw error;
        }
    }
}

module.exports = MeasurementModel;