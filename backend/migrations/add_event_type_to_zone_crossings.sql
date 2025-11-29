-- Add event_type column to zone_crossings table
-- This column tracks whether the event is ENTER (entering from outside), EXIT (exiting to outside), or CROSSING (moving between zones)

ALTER TABLE zone_crossings 
ADD COLUMN IF NOT EXISTS event_type VARCHAR(10) DEFAULT 'CROSSING' CHECK (event_type IN ('ENTER', 'EXIT', 'CROSSING'));

-- Add index for faster queries by event type
CREATE INDEX IF NOT EXISTS idx_zone_crossings_event_type ON zone_crossings(event_type);

-- Update existing records to have proper event types based on previous_zone and current_zone
UPDATE zone_crossings 
SET event_type = CASE
    WHEN previous_zone IS NULL AND current_zone IS NOT NULL THEN 'ENTER'
    WHEN previous_zone IS NOT NULL AND current_zone IS NULL THEN 'EXIT'
    ELSE 'CROSSING'
END
WHERE event_type IS NULL OR event_type = 'CROSSING';

-- Add comment for documentation
COMMENT ON COLUMN zone_crossings.event_type IS 'Type of zone event: ENTER (from outside to zone), EXIT (from zone to outside), or CROSSING (from one zone to another)';
