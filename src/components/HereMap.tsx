import React, { useEffect, useRef } from 'react';
import H from '@here/maps-api-for-javascript';

const HereMap: React.FC = () => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const map = useRef<H.Map | null>(null);
  const platform = useRef<H.service.Platform | null>(null);

  useEffect(() => {
    if (!map.current && mapRef.current) {
      try {
        platform.current = new H.service.Platform({
          apikey: 'dT5AXa07Et19QuFHBKyQ2X-C0gBE5Qkj6-d7YkJYAU',
        });

        const defaultLayers = platform.current.createDefaultLayers() as any;

        if (defaultLayers.vector) {
          const newMap = new H.Map(
            mapRef.current,
            defaultLayers.vector.normal.map,
            {
              zoom: 14,
              center: {
                lat: 64.144,
                lng: -21.94,
              },
            },
          );

          // Set the map object to the reference
          map.current = newMap;

          const behavior = new H.mapevents.Behavior(
            new H.mapevents.MapEvents(newMap),
          );
          const ui = H.ui.UI.createDefault(newMap, defaultLayers);

          return () => {
            newMap.dispose();
          };
        } else {
          console.error('Vector layers are not available.');
        }
      } catch (error) {
        console.error('Error initializing the HERE map:', error);
      }
    }
  }, []);

  return <div ref={mapRef} style={{ width: '100%', height: '80vh' }} />;
};

export default HereMap;
