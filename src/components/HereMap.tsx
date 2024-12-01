import { useEffect, useRef } from 'react';
import { HMap, HMapPolyline, HPlatform } from 'react-here-map';

const HereMap = ({
  apiKey,
  points,
}: {
  apiKey: string;
  points: { lat: number; lng: number }[];
}) => {
  const mapRef = useRef(null);

  useEffect(() => {
    if (mapRef.current) {
      // Initialize the map here if needed
    }
  }, [points]);

  return (
    <>
      <div style={{ height: '80vh', overflow: 'hidden' }}>
        <HPlatform
          options={{
            apiKey: 'TIAGlD6jic7l9Aa8Of8IFxo3EUemmcZlHm_agfAm6Ew',
            includePlaces: false,
            includeUI: false,
            interactive: true,
            version: 'v3/3.1',
          }}
        >
          <HMap
            ref={mapRef}
            key={`map-${points.length}`}
            options={{
              center: {
                lat: 52,
                lng: 5,
              },
              build: true,
            }}
            style={{
              height: '100%',
              width: '100%',
              position: 'relative',
              top: '-100%',
            }}
          >
            {points.length > 1 && (
              <HMapPolyline
                events={
                  {
                    pointerdown: function noRefCheck() {},
                    pointerenter: function noRefCheck() {},
                    pointerleave: function noRefCheck() {},
                    pointermove: function noRefCheck() {},
                  } as any
                }
                options={{
                  style: {
                    lineWidth: 4,
                  },
                }}
                points={points}
                setViewBounds={true}
              />
            )}
          </HMap>
        </HPlatform>
      </div>
    </>
  );
};

export default HereMap;
