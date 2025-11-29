import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import http from "http";
import taxiRoutes from "./routes/taxiRoutes.js";
import zonesRoutes from "./routes/zonesRoutes.js";
import locationRoutes from "./routes/locationRoutes.js";
import zoneCrossingsRoutes from "./routes/zone_crossings.js";
import { setupWebSocket } from "./websocket.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

// Routes
app.use("/api", taxiRoutes);
app.use("/api", zonesRoutes);
app.use("/api", locationRoutes);
app.use("/api/zone-crossing", zoneCrossingsRoutes);

// Add middleware to log requests
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path} - ${new Date().toLocaleTimeString()}`);
  next();
});

// Setup WebSocket
setupWebSocket(server);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`\n${"=".repeat(50)}`);
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📍 HTTP:  http://localhost:${PORT}`);
  console.log(`🔌 WebSocket: ws://localhost:${PORT}/ws`);
  console.log(`${"=".repeat(50)}\n`);
});
