import { supabase } from '../config/supabaseClient.js';

async function checkTable() {
  console.log('🔍 Checking zone_crossings table...\n');
  
  try {
    // Try to fetch schema information
    const { data, error } = await supabase
      .from('zone_crossings')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error accessing zone_crossings table:');
      console.error('   Code:', error.code);
      console.error('   Message:', error.message);
      console.error('   Details:', error.details);
      console.error('   Hint:', error.hint);
      
      if (error.code === 'PGRST116' || error.message.includes('not find')) {
        console.log('\n⚠️  TABLE DOES NOT EXIST!\n');
        console.log('📋 Please create it with this SQL in Supabase Dashboard:\n');
        console.log('─'.repeat(70));
        console.log(`
CREATE TABLE zone_crossings (
  id BIGSERIAL PRIMARY KEY,
  taxi_id VARCHAR(50) NOT NULL,
  previous_zone UUID,
  current_zone UUID,
  event_type VARCHAR(10) DEFAULT 'CROSSING' CHECK (event_type IN ('ENTER', 'EXIT', 'CROSSING')),
  lat DECIMAL(10, 8) NOT NULL,
  lng DECIMAL(11, 8) NOT NULL,
  speed INTEGER DEFAULT 0,
  crossed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX idx_zone_crossings_taxi_id ON zone_crossings(taxi_id);
CREATE INDEX idx_zone_crossings_crossed_at ON zone_crossings(crossed_at DESC);
CREATE INDEX idx_zone_crossings_zones ON zone_crossings(previous_zone, current_zone);
CREATE INDEX idx_zone_crossings_event_type ON zone_crossings(event_type);

-- Add comments
COMMENT ON TABLE zone_crossings IS 'Tracks all zone crossing events (ENTER, EXIT, CROSSING)';
COMMENT ON COLUMN zone_crossings.event_type IS 'ENTER: from outside to zone, EXIT: from zone to outside, CROSSING: between zones';
        `);
        console.log('─'.repeat(70));
      }
      return;
    }
    
    console.log('✅ zone_crossings table exists!');
    
    if (data && data.length > 0) {
      console.log('\n📊 Table columns:');
      const columns = Object.keys(data[0]);
      columns.forEach(col => {
        console.log(`   - ${col}: ${typeof data[0][col]} (value: ${data[0][col]})`);
      });
      
      console.log('\n📝 Sample record:');
      console.log(JSON.stringify(data[0], null, 2));
    } else {
      console.log('\n📭 Table is empty (no records yet)');
      
      // Try to insert a test record to see what columns are expected
      console.log('\n🧪 Testing insert...');
      const testData = {
        taxi_id: 'TEST123',
        previous_zone: null,
        current_zone: null,
        event_type: 'ENTER',
        lat: 40.7128,
        lng: -74.0060,
        speed: 30,
        crossed_at: new Date().toISOString()
      };
      
      console.log('Test data:', testData);
      
      const { data: insertData, error: insertError } = await supabase
        .from('zone_crossings')
        .insert(testData)
        .select();
      
      if (insertError) {
        console.error('\n❌ Insert test failed:');
        console.error('   Code:', insertError.code);
        console.error('   Message:', insertError.message);
        console.error('   Details:', insertError.details);
        console.error('   Hint:', insertError.hint);
      } else {
        console.log('\n✅ Insert test successful!');
        console.log('Inserted record:', insertData);
        
        // Clean up test record
        await supabase
          .from('zone_crossings')
          .delete()
          .eq('taxi_id', 'TEST123');
        console.log('\n🧹 Test record cleaned up');
      }
    }
    
    // Check total count
    const { count, error: countError } = await supabase
      .from('zone_crossings')
      .select('*', { count: 'exact', head: true });
    
    if (!countError) {
      console.log(`\n📈 Total records in table: ${count}`);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkTable().then(() => {
  console.log('\n✅ Check complete!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
