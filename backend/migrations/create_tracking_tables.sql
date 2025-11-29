-- Taxi Locations History Table (for analytics)
CREATE TABLE IF NOT EXISTS taxi_locations (
  id SERIAL PRIMARY KEY,
  taxi_id VARCHAR(50) NOT NULL,
  lat DECIMAL(10, 8) NOT NULL,
  lng DECIMAL(11, 8) NOT NULL,
  speed INTEGER DEFAULT 0,
  zone_id UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_taxi_locations_taxi_id ON taxi_locations(taxi_id);
CREATE INDEX IF NOT EXISTS idx_taxi_locations_created_at ON taxi_locations(created_at);

-- Zone Events Table (ENTER/EXIT logs)
CREATE TABLE IF NOT EXISTS zone_events (
  id SERIAL PRIMARY KEY,
  taxi_id VARCHAR(50) NOT NULL,
  zone_id UUID NOT NULL,
  event_type VARCHAR(10) NOT NULL CHECK (event_type IN ('ENTER', 'EXIT')),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zone_events_taxi_id ON zone_events(taxi_id);
CREATE INDEX IF NOT EXISTS idx_zone_events_zone_id ON zone_events(zone_id);
CREATE INDEX IF NOT EXISTS idx_zone_events_created_at ON zone_events(created_at);

-- Taxi Zone Status Table (current zone status)
CREATE TABLE IF NOT EXISTS taxi_zone_status (
  taxi_id VARCHAR(50) PRIMARY KEY,
  current_zone UUID,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER IF NOT EXISTS update_taxi_zone_status_updated_at 
  BEFORE UPDATE ON taxi_zone_status 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE taxi_locations IS 'Historical GPS tracking data for analytics';
COMMENT ON TABLE zone_events IS 'Log of zone ENTER/EXIT events';
COMMENT ON TABLE taxi_zone_status IS 'Current zone status for each taxi (real-time)';

