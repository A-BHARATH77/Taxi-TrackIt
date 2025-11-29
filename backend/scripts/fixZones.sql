-- Delete the invalid zones (optional - uncomment if you want to remove them)
-- DELETE FROM zones WHERE id IN ('060bba67-0ce6-4c65-8adf-de502620b621', '774b67d9-73ad-4241-8e98-68443fb6e057');

-- Update existing zones with valid GeoJSON polygons
-- Zone 1: "circle two" - A rectangular zone in the tracking area
UPDATE zones 
SET boundary = '{
  "type": "Polygon",
  "coordinates": [[
    [-74.45, 41.04],
    [-74.35, 41.04],
    [-74.35, 41.00],
    [-74.45, 41.00],
    [-74.45, 41.04]
  ]]
}'::jsonb
WHERE id = '060bba67-0ce6-4c65-8adf-de502620b621';

-- Zone 2: "circle" - Another rectangular zone
UPDATE zones 
SET boundary = '{
  "type": "Polygon",
  "coordinates": [[
    [-74.40, 41.06],
    [-74.30, 41.06],
    [-74.30, 41.02],
    [-74.40, 41.02],
    [-74.40, 41.06]
  ]]
}'::jsonb
WHERE id = '774b67d9-73ad-4241-8e98-68443fb6e057';

-- OR: Insert a completely new test zone with valid GeoJSON
INSERT INTO zones (name, boundary, created_at)
VALUES (
  'Test Downtown Zone',
  '{
    "type": "Polygon",
    "coordinates": [[
      [-74.42, 41.05],
      [-74.38, 41.05],
      [-74.38, 41.02],
      [-74.42, 41.02],
      [-74.42, 41.05]
    ]]
  }'::jsonb,
  NOW()
);

-- Verify the zones
SELECT 
  id,
  name,
  boundary->>'type' as geojson_type,
  jsonb_array_length(boundary->'coordinates') as coordinate_arrays,
  created_at
FROM zones
ORDER BY created_at DESC;
