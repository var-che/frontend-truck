// src/context/MapContext.tsx
import React, { createContext, useContext, useState } from 'react';

interface MapContextType {
  isMapVisible: boolean;
  activeWaypoints: { lat: number; lng: number }[];
  showMap: (points: { lat: number; lng: number }[]) => void;
  hideMap: () => void;
}

const MapContext = createContext<MapContextType | undefined>(undefined);

export const MapProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isMapVisible, setIsMapVisible] = useState(false);
  const [activeWaypoints, setActiveWaypoints] = useState<
    { lat: number; lng: number }[]
  >([]);

  const showMap = (points: { lat: number; lng: number }[]) => {
    console.log('Showing map with waypoints:', points);
    setActiveWaypoints(points);
    setIsMapVisible(true);
  };

  const hideMap = () => {
    setIsMapVisible(false);
  };

  return (
    <MapContext.Provider
      value={{
        isMapVisible,
        activeWaypoints,
        showMap,
        hideMap,
      }}
    >
      {children}
    </MapContext.Provider>
  );
};

export const useMap = () => {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('useMap must be used within a MapProvider');
  }
  return context;
};
