import { supabase } from '../config/supabaseClient.js';

async function fixZonePolygons() {
  console.log('🔧 Fixing zone polygons...\n');
  
  try {
    // Fetch all zones
    const { data: zones, error } = await supabase
      .from('zones')
      .select('*');
    
    if (error) throw error;
    
    console.log(`Found ${zones.length} zones to check\n`);
    
    let fixedCount = 0;
    let invalidCount = 0;
    
    for (const zone of zones) {
      try {
        let boundary = zone.boundary;
        
        // Parse if string
        if (typeof boundary === 'string') {
          boundary = JSON.parse(boundary);
        }
        
        // Check if it's a valid Polygon
        if (boundary.type !== 'Polygon' || !boundary.coordinates || !boundary.coordinates[0]) {
          console.log(`⚠️  Zone "${zone.name}" (${zone.id}): Invalid structure, skipping`);
          invalidCount++;
          continue;
        }
        
        let coordinates = boundary.coordinates[0];
        let needsUpdate = false;
        
        // Check if polygon has enough points
        if (coordinates.length < 3) {
          console.log(`❌ Zone "${zone.name}" (${zone.id}): Not enough points (${coordinates.length}), skipping`);
          invalidCount++;
          continue;
        }
        
        // Check if polygon is closed
        const firstPoint = coordinates[0];
        const lastPoint = coordinates[coordinates.length - 1];
        
        if (firstPoint[0] !== lastPoint[0] || firstPoint[1] !== lastPoint[1]) {
          console.log(`🔧 Zone "${zone.name}" (${zone.id}): Not closed, fixing...`);
          coordinates.push([firstPoint[0], firstPoint[1]]);
          needsUpdate = true;
        }
        
        // Ensure at least 4 points (3 unique + 1 closing)
        if (coordinates.length < 4) {
          console.log(`❌ Zone "${zone.name}" (${zone.id}): Not enough unique points, skipping`);
          invalidCount++;
          continue;
        }
        
        // Update if needed
        if (needsUpdate) {
          const updatedBoundary = {
            type: 'Polygon',
            coordinates: [coordinates]
          };
          
          const { error: updateError } = await supabase
            .from('zones')
            .update({ boundary: updatedBoundary })
            .eq('id', zone.id);
          
          if (updateError) {
            console.error(`❌ Error updating zone "${zone.name}":`, updateError.message);
          } else {
            console.log(`✅ Zone "${zone.name}" fixed successfully`);
            fixedCount++;
          }
        } else {
          console.log(`✓ Zone "${zone.name}" (${zone.id}): Already valid`);
        }
        
      } catch (zoneError) {
        console.error(`❌ Error processing zone "${zone.name}":`, zoneError.message);
        invalidCount++;
      }
      
      console.log('');
    }
    
    console.log('\n📊 Summary:');
    console.log(`   ✅ Fixed: ${fixedCount}`);
    console.log(`   ✓ Already valid: ${zones.length - fixedCount - invalidCount}`);
    console.log(`   ❌ Invalid/Skipped: ${invalidCount}`);
    console.log('\n💡 Tip: Delete invalid zones and create new ones using the updated Zone Management page.\n');
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

// Run the fix
fixZonePolygons().then(() => {
  console.log('✅ Done!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
