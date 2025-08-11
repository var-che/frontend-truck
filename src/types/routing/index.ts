// Common types for routing functionality

export interface Waypoint {
  id: string;
  lat: number;
  lng: number;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

export interface RouteSegment {
  from?: Waypoint;
  to?: Waypoint;
  distance: number; // in miles
  duration: number; // in minutes
  polyline?: number[][];
  instructions?: string[];
}

export interface Route {
  id: string;
  name?: string;
  waypoints: Waypoint[];
  segments: RouteSegment[];
  totalDistance: number; // in miles
  totalDuration: number; // in minutes
  totalTime?: number; // in minutes (alias for totalDuration)
  totalCost?: number;
  fuelCost?: number;
  createdAt?: string;
  provider?: 'HERE' | 'TRIMBLE';
  geometry?: GeoJSON.Geometry | [number, number][];
  color?: string;
  estimatedFuelCost?: number;
  estimatedToll?: number;
}

export interface TruckSpecs {
  grossWeight: number; // in pounds
  length: number; // in feet
  width: number; // in feet
  height: number; // in feet
  axles?: number;
  trailerCount?: number;
  hazmatClass?: string;
}

export interface RouteOptions {
  truckSpecs: TruckSpecs;
  avoidTolls?: boolean;
  avoidHighways?: boolean;
  avoidFerries?: boolean;
  fuelCostPerGallon?: number;
  mpg?: number;
}

export interface RoutingElement {
  id: string;
  x: number;
  y: number;
  zIndex: number;
  driverName: string;
  waypoints: Waypoint[];
  route?: Route;
  routeOptions: RouteOptions;
}

export interface RouteCalculationResult {
  success: boolean;
  route?: Route;
  error?: string;
  provider: 'HERE' | 'TRIMBLE';
}
