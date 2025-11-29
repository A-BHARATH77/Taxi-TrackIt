import { supabase } from '../config/supabaseClient.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  console.log('🔄 Running migration: add_event_type_to_zone_crossings.sql\n');
  
  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, '../migrations/add_event_type_to_zone_crossings.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📝 SQL to execute:');
    console.log('─'.repeat(60));
    console.log(sql);
    console.log('─'.repeat(60));
    console.log('');
    
    // Note: Supabase doesn't support direct SQL execution via the JS client for DDL
    // You need to run this in the Supabase SQL Editor
    console.log('⚠️  IMPORTANT: Supabase JS client doesn\'t support DDL queries.');
    console.log('📋 Please copy the SQL above and run it in Supabase SQL Editor:');
    console.log('   1. Go to your Supabase Dashboard');
    console.log('   2. Navigate to SQL Editor');
    console.log('   3. Paste and run the SQL above');
    console.log('');
    console.log('💡 OR manually add the column:');
    console.log('   ALTER TABLE zone_crossings ADD COLUMN event_type VARCHAR(10) DEFAULT \'CROSSING\';');
    console.log('');
    
    // Check if we can query the table structure
    console.log('🔍 Checking zone_crossings table structure...\n');
    const { data, error } = await supabase
      .from('zone_crossings')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error querying zone_crossings:', error.message);
    } else {
      console.log('✅ zone_crossings table exists');
      if (data && data.length > 0) {
        console.log('📊 Current columns:', Object.keys(data[0]));
        if (data[0].hasOwnProperty('event_type')) {
          console.log('✅ event_type column already exists!');
        } else {
          console.log('⚠️  event_type column NOT found - needs to be added');
        }
      } else {
        console.log('ℹ️  Table is empty');
      }
    }
    
  } catch (error) {
    console.error('❌ Migration error:', error);
  }
}

// Run the migration check
runMigration().then(() => {
  console.log('\n✅ Migration check complete!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
