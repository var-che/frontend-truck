import { useCallback, useEffect, useRef, useState } from 'react';
import { HMap, HMapPolyline, HPlatform } from 'react-here-map';
import { decode } from '../utils';

const HereMap = ({
  apiKey,
  points,
}: {
  apiKey: string;
  points: { lat: number; lng: number }[];
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [routePolyline, setRoutePolyline] = useState<number[][] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [routePoints, setRoutePoints] = useState<
    { lat: number; lng: number }[]
  >([]);

  useEffect(() => {
    if (routePolyline) {
      const converted = routePolyline.map((point) => ({
        lat: point[0],
        lng: point[1],
      }));
      setRoutePoints(converted);
    }
  }, [routePolyline]);

  const calculateRoute = useCallback(
    async (
      waypoints: { lat: number; lng: number }[],
    ): Promise<number[][] | null> => {
      if (waypoints.length < 2) return null;

      const origin = `${waypoints[0].lat},${waypoints[0].lng}`;
      const destination = `${waypoints[waypoints.length - 1].lat},${
        waypoints[waypoints.length - 1].lng
      }`;

      // Combine all intermediate waypoints into single via parameter
      const via = waypoints
        .slice(1, -1)
        .map((point) => `&via=${point.lat},${point.lng}`)
        .join('');

      const viaParam = via ? via : '';

      const truckParams = {
        grossWeight: 8000,
        length: 26,
        width: 9,
        height: 12,
      };

      const url =
        `https://router.hereapi.com/v8/routes?` +
        `transportMode=truck` +
        `&origin=${origin}` +
        `&destination=${destination}` +
        viaParam +
        `&return=polyline,summary` +
        `&truck[grossWeight]=${truckParams.grossWeight}` +
        `&truck[length]=${truckParams.length}` +
        `&truck[width]=${truckParams.width}` +
        `&truck[height]=${truckParams.height}` +
        `&apikey=${apiKey}`;

      console.log('Route calculation URL:', url);
      try {
        const response = await fetch(url);
        if (!response.ok) {
          const error = await response.json();
          console.error('Route calculation error:', error);
          return null;
        }
        const data = await response.json();
        const encodedPolyline = data.routes[0].sections[0].polyline;
        const decodedData = decode(encodedPolyline);
        console.log('Decoded polyline:', decodedData);
        return decodedData.polyline;
      } catch (error) {
        console.error('Error calculating route:', error);
        return null;
      }
    },
    [apiKey],
  );

  useEffect(() => {
    async function updateRoute() {
      if (points.length >= 2) {
        setIsLoading(true);
        const polyline = await calculateRoute(points);
        setRoutePolyline(polyline);
        setIsLoading(false);
      }
    }
    updateRoute();
  }, [points, apiKey, calculateRoute]);

  return (
    <div ref={containerRef} style={{ height: '80vh', overflow: 'hidden' }}>
      <HPlatform
        options={{
          apiKey: apiKey,
          includePlaces: false,
          includeUI: false,
          interactive: true,
          version: 'v3/3.1',
        }}
      >
        <HMap
          key={`map-${points.length}-${routePolyline}`}
          options={{
            center:
              points.length > 0
                ? { lat: points[0].lat, lng: points[0].lng }
                : { lat: 52, lng: 5 },
            build: true,
          }}
          style={{
            height: '100%',
            width: '100%',
            position: 'relative',
            top: '-100%',
          }}
        >
          {points.length > 1 && routePolyline && (
            <HMapPolyline
              points={routePoints}
              setViewBounds={true}
              options={{
                style: {
                  lineWidth: 4,
                  strokeColor: '#00A0DC',
                },
              }}
              events={{} as Record<string, () => void>}
            />
          )}
        </HMap>
      </HPlatform>
    </div>
  );
};

export default HereMap;
