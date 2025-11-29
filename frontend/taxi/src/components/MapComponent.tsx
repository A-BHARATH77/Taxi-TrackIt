import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Zone {
  id: number;
  name: string;
  boundary: string;
  created_at: string;
}

interface MapComponentProps {
  onZoneCreate: (boundary: any) => void;
  zones: Zone[];
  onZoneEdit: (id: number, boundary: any) => void;
  onZoneDelete: (id: number, name: string) => void;
}

export function MapComponent({ onZoneCreate, zones, onZoneEdit, onZoneDelete }: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const drawnItemsRef = useRef<L.FeatureGroup>(new L.FeatureGroup());

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map
    const map = L.map(mapRef.current).setView([40.7128, -74.0060], 13); // NYC coordinates

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: ''
    }).addTo(map);

    // Add drawn items layer
    map.addLayer(drawnItemsRef.current);

    // Initialize draw control
    const drawControl = new L.Control.Draw({
      position: 'topright',
      draw: {
        polygon: {
          allowIntersection: false,
          drawError: { color: '#e1e100', message: '<strong>Oh snap!</strong> you can\'t draw that!' },
          shapeOptions: { color: '#97009c' }
        },
        rectangle: false,
        circle: false,
        marker: false,
        polyline: false,
        circlemarker: false
      },
      edit: {
        featureGroup: drawnItemsRef.current,
        remove: false
      }
    });

    map.addControl(drawControl);

    // Event handlers
    map.on(L.Draw.Event.CREATED, (event: any) => {
      const layer = event.layer;
      drawnItemsRef.current.addLayer(layer);
      
      // Get the boundary data in GeoJSON format
      let boundary;
      if (layer instanceof L.Polygon || layer instanceof L.Rectangle) {
        const latLngs = layer.getLatLngs()[0] as L.LatLng[];
        
        // Convert to [lng, lat] format
        const coordinates = latLngs.map((latlng: L.LatLng) => [latlng.lng, latlng.lat]);
        
        // Ensure polygon is closed (first and last points must be the same)
        const firstPoint = coordinates[0];
        const lastPoint = coordinates[coordinates.length - 1];
        
        if (firstPoint[0] !== lastPoint[0] || firstPoint[1] !== lastPoint[1]) {
          coordinates.push([firstPoint[0], firstPoint[1]]);
        }
        
        // Validate minimum points (need at least 4 points for a closed polygon)
        if (coordinates.length < 4) {
          console.error('Polygon must have at least 3 unique points (4 with closing point)');
          return;
        }
        
        // Convert to proper GeoJSON Polygon format
        boundary = {
          type: 'Polygon',
          coordinates: [coordinates]
        };
      } else if (layer instanceof L.Circle) {
        // Convert circle to approximate polygon (GeoJSON doesn't support circles)
        const center = layer.getLatLng();
        const radius = layer.getRadius();
        const points = 32; // Number of points to approximate circle
        const coordinates: [number, number][] = [];
        
        for (let i = 0; i < points; i++) {
          const angle = (i * 360) / points;
          const lat = center.lat + (radius / 111320) * Math.cos((angle * Math.PI) / 180);
          const lng = center.lng + (radius / (111320 * Math.cos((center.lat * Math.PI) / 180))) * Math.sin((angle * Math.PI) / 180);
          coordinates.push([lng, lat]);
        }
        
        // Close the polygon by adding the first point at the end
        coordinates.push(coordinates[0]);
        
        boundary = {
          type: 'Polygon',
          coordinates: [coordinates]
        };
      } else if (layer instanceof L.Marker) {
        // Convert marker to GeoJSON Point
        boundary = {
          type: 'Point',
          coordinates: [layer.getLatLng().lng, layer.getLatLng().lat]
        };
      }

      onZoneCreate(boundary);
    });

    map.on(L.Draw.Event.EDITED, (event: any) => {
      const layers = event.layers;
      layers.eachLayer((layer: any) => {
        // Handle edit - you'd need to track layer IDs for this
        console.log('Layer edited:', layer);
      });
    });

    map.on(L.Draw.Event.DELETED, (event: any) => {
      const layers = event.layers;
      layers.eachLayer((layer: any) => {
        // Handle delete - you'd need to track layer IDs for this
        console.log('Layer deleted:', layer);
      });
    });

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [onZoneCreate, onZoneEdit, onZoneDelete]);

  // Load existing zones
  useEffect(() => {
    if (!mapInstanceRef.current || !zones.length) return;

    // Clear existing zones
    drawnItemsRef.current.clearLayers();

    // Add zones to map
    zones.forEach((zone) => {
      try {
        const boundary = typeof zone.boundary === 'string' ? JSON.parse(zone.boundary) : zone.boundary;
        let layer;

        // Handle GeoJSON Polygon format
        if (boundary.type === 'Polygon' && boundary.coordinates) {
          // Convert from GeoJSON format [lng, lat] to Leaflet format [lat, lng]
          const latLngs = boundary.coordinates[0].map((coord: [number, number]) => [coord[1], coord[0]]);
          layer = L.polygon(latLngs, { color: '#97009c' });
        } 
        // Handle legacy formats for backward compatibility
        else if (boundary.type === 'polygon') {
          layer = L.polygon(boundary.coordinates, { color: '#97009c' });
        } else if (boundary.type === 'circle') {
          layer = L.circle(boundary.center, { 
            radius: boundary.radius, 
            color: '#97009c' 
          });
        } else if (boundary.type === 'Point' && boundary.coordinates) {
          layer = L.marker([boundary.coordinates[1], boundary.coordinates[0]]);
        } else if (boundary.type === 'marker') {
          layer = L.marker(boundary.coordinates);
        }

        if (layer) {
          // Add popup with zone info
          layer.bindPopup(`
            <div>
              <h3 class="font-semibold">${zone.name}</h3>
              <p class="text-sm text-gray-600">Created: ${new Date(zone.created_at).toLocaleDateString()}</p>
            </div>
          `);
          drawnItemsRef.current.addLayer(layer);
        }
      } catch (error) {
        console.error('Error parsing zone boundary:', error);
      }
    });
  }, [zones]);

  return (
    <div className="h-full w-full rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700">
      <div ref={mapRef} className="h-full w-full" />
    </div>
  );
}