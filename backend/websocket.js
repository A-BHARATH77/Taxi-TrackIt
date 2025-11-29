import { WebSocketServer } from 'ws';
import redisService from './services/redisService.js';

export function setupWebSocket(server) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  console.log('🔌 WebSocket server initialized on path /ws');

  // Store connected clients
  const clients = new Set();

  // Handle new WebSocket connections
  let clientIdCounter = 0;
  wss.on('connection', (ws, req) => {
    const clientIp = req.socket.remoteAddress;
    const clientId = ++clientIdCounter;
    ws.clientId = clientId;
    console.log(`✅ WebSocket client #${clientId} connected from ${clientIp} (Total: ${clients.size + 1})`);
    
    clients.add(ws);

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connection',
      message: 'Connected to Taxi Tracking WebSocket',
      timestamp: Date.now()
    }));

    // Handle client messages
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('📨 Received from client:', data);
        
        // You can handle client requests here if needed
        if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        }
      } catch (error) {
        console.error('Error parsing client message:', error);
      }
    });

    // Handle client disconnect
    ws.on('close', () => {
      clients.delete(ws);
      console.log(`❌ WebSocket client #${clientId} disconnected from ${clientIp} (Total: ${clients.size})`);
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });
  });

  // Subscribe to Redis pub/sub for taxi updates
  redisService.subscribeTaxiUpdates((data) => {
    // Broadcast to all connected WebSocket clients
    const message = JSON.stringify({
      type: 'taxi_update',
      data
    });

    let sentCount = 0;
    clients.forEach((client) => {
      if (client.readyState === 1) { // OPEN
        client.send(message);
        sentCount++;
      }
    });

    if (sentCount > 0) {
      console.log(`📡 Broadcasted update for taxi ${data.taxi_id} to ${sentCount} clients`);
    }
  });

  // Subscribe to zone crossing events
  const subscribeToZoneCrossings = async () => {
    try {
      const subscriber = await redisService.subscribeZoneCrossings((data) => {
        const broadcastMessage = JSON.stringify({
          type: 'zone_crossing',
          data
        });

        let sentCount = 0;
        clients.forEach((client) => {
          if (client.readyState === 1) { // OPEN
            client.send(broadcastMessage);
            sentCount++;
          }
        });

        if (sentCount > 0) {
          console.log(`🚪 Broadcasted zone ${data.event_type} event for taxi ${data.taxi_name} to ${sentCount} clients`);
        }
      });
    } catch (error) {
      console.error('❌ Error subscribing to zone crossings:', error);
    }
  };

  subscribeToZoneCrossings();

  return wss;
}
