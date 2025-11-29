// Test script to simulate taxi movement
// Run with: node test-taxi-simulator.js

const API_URL = 'http://localhost:5000/api';

// Sample taxi IDs
const TAXIS = ['TAXI001', 'TAXI002', 'TAXI003'];

// Sample route (London area)
const ROUTE = [
  { lat: 51.505, lng: -0.09 },
  { lat: 51.510, lng: -0.10 },
  { lat: 51.515, lng: -0.11 },
  { lat: 51.520, lng: -0.12 },
  { lat: 51.515, lng: -0.13 },
  { lat: 51.510, lng: -0.14 },
  { lat: 51.505, lng: -0.15 },
];

let currentIndex = 0;

async function sendLocationUpdate(taxiId, lat, lng, speed) {
  try {
    const response = await fetch(`${API_URL}/location/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        taxi_id: taxiId,
        lat,
        lng,
        speed,
      }),
    });

    const result = await response.json();
    console.log(`✅ ${taxiId}: ${result.message}`, 
      result.data.zone ? `(Zone: ${result.data.zone})` : '(No zone)');
    
    if (result.data.zone_changed) {
      console.log(`🚪 ${taxiId}: Zone changed!`);
    }
  } catch (error) {
    console.error(`❌ Error updating ${taxiId}:`, error.message);
  }
}

function simulateMovement() {
  TAXIS.forEach((taxiId, index) => {
    // Each taxi at different position along the route
    const position = ROUTE[(currentIndex + index) % ROUTE.length];
    const speed = Math.floor(Math.random() * 40) + 20; // 20-60 km/h
    
    sendLocationUpdate(taxiId, position.lat, position.lng, speed);
  });

  currentIndex = (currentIndex + 1) % ROUTE.length;
}

console.log('🚕 Starting taxi movement simulator...');
console.log(`📡 Sending updates to: ${API_URL}/location/update`);
console.log(`🚕 Simulating ${TAXIS.length} taxis\n`);

// Send initial positions
simulateMovement();

// Update every 3 seconds
setInterval(simulateMovement, 3000);

// Keep the script running
process.on('SIGINT', () => {
  console.log('\n\n👋 Stopping taxi simulator...');
  process.exit(0);
});
