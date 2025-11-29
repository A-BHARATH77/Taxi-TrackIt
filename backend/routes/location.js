const express = require("express");
const router = express.Router();
const pool = require("../db/postgres");
const redis = require("../db/redis");
const turf = require("@turf/turf");

// POST /location/update
router.post("/update", async (req, res) => {
  try {
    const { taxi_id, lat, lng, speed } = req.body;

    if (!taxi_id || !lat || !lng) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const point = turf.point([lng, lat]);

    // 1. Load all zones from DB
    const zonesResult = await pool.query("SELECT id, boundary FROM zones");
    let currentZone = null;

    for (const zone of zonesResult.rows) {
      if (turf.booleanPointInPolygon(point, zone.boundary)) {
        currentZone = zone.id;
        break;
      }
    }

    // 2. Fetch last known zone from Redis
    const lastZone = await redis.get(`taxi:${taxi_id}:zone`);

    // 3. Detect zone ENTER / EXIT
    if (lastZone !== currentZone) {
      // Store event in PostgreSQL
      await pool.query(
        `INSERT INTO zone_events (taxi_id, zone_id, event_type)
         VALUES ($1, $2, $3)`,
        [
          taxi_id,
          currentZone ? currentZone : lastZone,
          currentZone ? "ENTER" : "EXIT"
        ]
      );

      // Update zone status table
      await pool.query(
        `INSERT INTO taxi_zone_status (taxi_id, current_zone)
         VALUES ($1, $2)
         ON CONFLICT (taxi_id)
         DO UPDATE SET current_zone = EXCLUDED.current_zone`,
        [taxi_id, currentZone]
      );
    }

    // 4. Update Redis (latest location + zone)
    await redis.set(
      `taxi:${taxi_id}:location`,
      JSON.stringify({
        lat,
        lng,
        speed,
        zone: currentZone,
        timestamp: Date.now(),
      })
    );

    await redis.set(`taxi:${taxi_id}:zone`, currentZone || "");

    // 5. Publish update for WebSocket clients
    await redis.publish(
      "taxi_updates",
      JSON.stringify({
        taxi_id,
        lat,
        lng,
        zone: currentZone,
      })
    );

    // 6. (Optional) Insert into history table
    await pool.query(
      `INSERT INTO taxi_locations (taxi_id, lat, lng, speed, zone)
       VALUES ($1, $2, $3, $4, $5)`,
      [taxi_id, lat, lng, speed, currentZone]
    );

    res.json({ message: "Location updated", zone: currentZone });

  } catch (err) {
    console.error("Location update error:", err);
    res.status(500).json({ error: "Server error" });
  }
});


// GET /location/latest — get all taxi current positions (from Redis)
router.get("/latest", async (req, res) => {
  try {
    const keys = await redis.keys("taxi:*:location");

    const locations = [];
    for (const key of keys) {
      const data = await redis.get(key);
      if (data) {
        const taxi_id = key.split(":")[1];
        locations.push({ taxi_id, ...JSON.parse(data) });
      }
    }

    res.json(locations);

  } catch (err) {
    console.error("Error fetching locations:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
