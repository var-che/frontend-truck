import { useRef } from 'react';
import { HMap, HMapPolyline } from "react-here-map";

const HereMap = ({ apiKey, points }: { apiKey: string, points: { lat: number, lng: number }[] }) => {

  const mapRef = useRef(null);
  console.log(mapRef, 'map ref');
  return (
    <>
      <div style={{ height: "80vh", overflow: "hidden" }}>

        <HMap
          ref={mapRef}
          key={1}
          options={{
            center: {
              lat: 52,
              lng: 5
            },
            build: true
          }}
          style={{
            height: '100%',
            width: '100%',
            position: 'relative',
            top: "-100%"
          }}
        >
          {points.length > 1 && <HMapPolyline
            events={{
              pointerdown: function noRefCheck() { },
              pointerenter: function noRefCheck() { },
              pointerleave: function noRefCheck() { },
              pointermove: function noRefCheck() { }
            } as any}
            options={{
              style: {
                lineWidth: 4
              }
            }}
            points={points}
            setViewBounds={true}
          />}
        </HMap>
      </div>
    </>
  )
};

export default HereMap;
