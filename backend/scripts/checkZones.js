import { supabase } from '../config/supabaseClient.js';

async function checkZones() {
  console.log('🔍 Checking zones in database...\n');
  
  const { data: zones, error } = await supabase
    .from('zones')
    .select('*');
  
  if (error) {
    console.error('❌ Error fetching zones:', error);
    return;
  }
  
  console.log(`Found ${zones.length} zones:\n`);
  
  zones.forEach((zone, index) => {
    console.log(`\n--- Zone ${index + 1} ---`);
    console.log(`ID: ${zone.id}`);
    console.log(`Name: ${zone.name}`);
    console.log(`Boundary type: ${typeof zone.boundary}`);
    console.log(`Boundary value:`, zone.boundary);
    
    // Try to parse if string
    if (typeof zone.boundary === 'string') {
      try {
        const parsed = JSON.parse(zone.boundary);
        console.log(`Parsed boundary:`, JSON.stringify(parsed, null, 2));
        console.log(`Has type property: ${!!parsed.type}`);
        console.log(`Has coordinates property: ${!!parsed.coordinates}`);
      } catch (e) {
        console.log(`❌ Cannot parse as JSON:`, e.message);
      }
    } else if (typeof zone.boundary === 'object') {
      console.log(`Has type property: ${!!zone.boundary?.type}`);
      console.log(`Has coordinates property: ${!!zone.boundary?.coordinates}`);
      if (zone.boundary) {
        console.log(`Full boundary object:`, JSON.stringify(zone.boundary, null, 2));
      }
    }
  });
  
  console.log('\n\n✅ Valid GeoJSON example for a polygon zone:');
  console.log(JSON.stringify({
    type: "Polygon",
    coordinates: [[
      [-74.45, 41.04],  // [lng, lat]
      [-74.35, 41.04],
      [-74.35, 41.00],
      [-74.45, 41.00],
      [-74.45, 41.04]   // Must close the polygon
    ]]
  }, null, 2));
}

checkZones();
