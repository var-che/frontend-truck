import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from 'react';
import {
  RoutingElement,
  Route,
  Waypoint,
  RouteOptions,
  TruckSpecs,
} from '../../types/routing';
import { TrimbleRoutingService } from '../../services/routing/TrimbleService';

interface TrimbleRoutingContextType {
  elements: RoutingElement[];
  activeRoutes: Map<string, Route & { color: string }>; // elementId -> route with color
  isCalculating: boolean;

  // Element management
  addElement: () => string;
  deleteElement: (id: string) => void;
  updateElement: (id: string, updates: Partial<RoutingElement>) => void;

  // Route management
  calculateRoute: (elementId: string) => Promise<void>;
  hideRoute: (elementId: string) => void;
  hideAllRoutes: () => void;

  // Waypoint management
  addWaypoint: (elementId: string, waypoint: Waypoint) => void;
  removeWaypoint: (elementId: string, waypointId: string) => void;
  reorderWaypoints: (
    elementId: string,
    oldIndex: number,
    newIndex: number,
  ) => void;
  updateWaypoint: (
    elementId: string,
    waypointId: string,
    updates: Partial<Waypoint>,
  ) => void;

  // Utility functions
  searchLocations: (query: string) => Promise<Waypoint[]>;
  geocodeAddress: (address: string) => Promise<Waypoint | null>;
}

const TrimbleRoutingContext = createContext<
  TrimbleRoutingContextType | undefined
>(undefined);

const TRIMBLE_API_KEY = '299354C7A83A67439273691EA750BB7F';

// Default truck specifications
const DEFAULT_TRUCK_SPECS: TruckSpecs = {
  grossWeight: 80000, // 80,000 lbs
  length: 53, // 53 feet
  width: 8.5, // 8.5 feet
  height: 13.6, // 13.6 feet
  axles: 5,
  trailerCount: 1,
};

const DEFAULT_ROUTE_OPTIONS: RouteOptions = {
  truckSpecs: DEFAULT_TRUCK_SPECS,
  avoidTolls: false,
  avoidHighways: false,
  avoidFerries: false,
  fuelCostPerGallon: 3.5,
  mpg: 6.5,
};

export const TrimbleRoutingProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [elements, setElements] = useState<RoutingElement[]>(() => {
    const saved = localStorage.getItem('trimble-routing-elements');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeRoutes, setActiveRoutes] = useState<
    Map<string, Route & { color: string }>
  >(new Map());
  const [isCalculating, setIsCalculating] = useState(false);

  // Define route colors for different elements
  const routeColors = useMemo(
    () => [
      '#3b82f6', // blue
      '#ef4444', // red
      '#22c55e', // green
      '#f59e0b', // amber
      '#8b5cf6', // violet
      '#ec4899', // pink
      '#14b8a6', // teal
      '#f97316', // orange
      '#6366f1', // indigo
      '#84cc16', // lime
    ],
    [],
  );

  const getRouteColor = useCallback(
    (elementIndex: number): string => {
      return routeColors[elementIndex % routeColors.length];
    },
    [routeColors],
  );

  const trimbleService = useMemo(
    () => new TrimbleRoutingService(TRIMBLE_API_KEY),
    [],
  );

  // Save elements to localStorage whenever they change
  const saveElements = useCallback((newElements: RoutingElement[]) => {
    localStorage.setItem(
      'trimble-routing-elements',
      JSON.stringify(newElements),
    );
  }, []);

  const addElement = useCallback((): string => {
    // Better positioning for canvas layout - cascade new cards
    const baseX = 900; // Start after the map area
    const baseY = 100; // Below the toolbar
    const offset = elements.length * 30; // Cascade offset

    const newElement: RoutingElement = {
      id: `element-${Date.now()}`,
      x: baseX + offset,
      y: baseY + offset,
      zIndex: elements.length + 1,
      driverName: '',
      waypoints: [],
      routeOptions: { ...DEFAULT_ROUTE_OPTIONS },
    };

    const newElements = [...elements, newElement];
    setElements(newElements);
    saveElements(newElements);

    return newElement.id;
  }, [elements, saveElements]);

  const hideRoute = useCallback((elementId: string) => {
    setActiveRoutes((prev) => {
      const newRoutes = new Map(prev);
      newRoutes.delete(elementId);
      return newRoutes;
    });
  }, []);

  const hideAllRoutes = useCallback(() => {
    setActiveRoutes(new Map());
  }, []);

  const deleteElement = useCallback(
    (id: string) => {
      const newElements = elements.filter((el) => el.id !== id);
      setElements(newElements);
      saveElements(newElements);

      // Remove route from active routes if it belongs to deleted element
      hideRoute(id);
    },
    [elements, saveElements, hideRoute],
  );

  const updateElement = useCallback(
    (id: string, updates: Partial<RoutingElement>) => {
      const newElements = elements.map((el) =>
        el.id === id ? { ...el, ...updates } : el,
      );
      setElements(newElements);
      saveElements(newElements);
    },
    [elements, saveElements],
  );

  const addWaypoint = useCallback(
    (elementId: string, waypoint: Waypoint) => {
      updateElement(elementId, {
        waypoints: [
          ...(elements.find((el) => el.id === elementId)?.waypoints || []),
          waypoint,
        ],
      });
    },
    [elements, updateElement],
  );

  const removeWaypoint = useCallback(
    (elementId: string, waypointId: string) => {
      const element = elements.find((el) => el.id === elementId);
      if (element) {
        updateElement(elementId, {
          waypoints: element.waypoints.filter((wp) => wp.id !== waypointId),
        });
      }
    },
    [elements, updateElement],
  );

  const reorderWaypoints = useCallback(
    (elementId: string, oldIndex: number, newIndex: number) => {
      const element = elements.find((el) => el.id === elementId);
      if (element && oldIndex !== newIndex) {
        const newWaypoints = [...element.waypoints];
        const [movedWaypoint] = newWaypoints.splice(oldIndex, 1);
        newWaypoints.splice(newIndex, 0, movedWaypoint);
        updateElement(elementId, {
          waypoints: newWaypoints,
        });
      }
    },
    [elements, updateElement],
  );

  const updateWaypoint = useCallback(
    (elementId: string, waypointId: string, updates: Partial<Waypoint>) => {
      const element = elements.find((el) => el.id === elementId);
      if (element) {
        updateElement(elementId, {
          waypoints: element.waypoints.map((wp) =>
            wp.id === waypointId ? { ...wp, ...updates } : wp,
          ),
        });
      }
    },
    [elements, updateElement],
  );

  const calculateRoute = useCallback(
    async (elementId: string) => {
      const element = elements.find((el) => el.id === elementId);
      if (!element || element.waypoints.length < 2) {
        return;
      }

      setIsCalculating(true);

      try {
        const result = await trimbleService.calculateRoute(
          element.waypoints,
          element.routeOptions,
        );

        if (result.success && result.route) {
          updateElement(elementId, { route: result.route });

          // Add route to active routes with assigned color
          const elementIndex = elements.findIndex((el) => el.id === elementId);
          const routeColor = getRouteColor(elementIndex);

          setActiveRoutes((prev) => {
            const newRoutes = new Map(prev);
            newRoutes.set(elementId, {
              ...result.route,
              color: routeColor,
            } as Route & { color: string });
            return newRoutes;
          });
        } else {
          console.error('Route calculation failed:', result.error);
        }
      } catch (error) {
        console.error('Error calculating route:', error);
      } finally {
        setIsCalculating(false);
      }
    },
    [elements, updateElement, trimbleService, getRouteColor],
  );

  const searchLocations = useCallback(
    async (query: string): Promise<Waypoint[]> => {
      return await trimbleService.searchLocations(query);
    },
    [trimbleService],
  );

  const geocodeAddress = useCallback(
    async (address: string): Promise<Waypoint | null> => {
      return await trimbleService.geocodeAddress(address);
    },
    [trimbleService],
  );

  const value: TrimbleRoutingContextType = {
    elements,
    activeRoutes,
    isCalculating,
    addElement,
    deleteElement,
    updateElement,
    calculateRoute,
    hideRoute,
    hideAllRoutes,
    addWaypoint,
    removeWaypoint,
    reorderWaypoints,
    updateWaypoint,
    searchLocations,
    geocodeAddress,
  };

  return (
    <TrimbleRoutingContext.Provider value={value}>
      {children}
    </TrimbleRoutingContext.Provider>
  );
};

export const useTrimbleRouting = () => {
  const context = useContext(TrimbleRoutingContext);
  if (!context) {
    throw new Error(
      'useTrimbleRouting must be used within a TrimbleRoutingProvider',
    );
  }
  return context;
};
