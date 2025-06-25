const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://bxqetstclndccppyalom.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4cWV0c3RjbG5kY2NwcHlhbG9tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTQ4MjM1MCwiZXhwIjoyMDY1MDU4MzUwfQ.3ZbX9aiIpHqpSKmOyyvAEhd9FuJ_jmPB_xdIOBrI3SQ';

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = {
    supabase,
    supabaseUrl,
    supabaseKey
};
