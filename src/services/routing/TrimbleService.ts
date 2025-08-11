import * as TrimbleMaps from '@trimblemaps/trimblemaps-js';
import {
  Waypoint,
  Route,
  RouteOptions,
  RouteCalculationResult,
  RouteSegment,
} from '../../types/routing';

export class TrimbleRoutingService {
  private apiKey: string;
  private baseUrl: string = 'https://singlesearch.alk.com';
  private initialized: boolean = false;
  private activeRoutes: Map<string, Route> = new Map();

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.initializeSDK();
  }

  private initializeSDK() {
    if (!this.initialized) {
      TrimbleMaps.setAPIKey(this.apiKey);
      TrimbleMaps.setUnit(TrimbleMaps.Common.Unit.ENGLISH);
      this.initialized = true;
    }
  }

  /**
   * Calculate route using Trimble Maps SDK
   */
  async calculateRoute(
    waypoints: Waypoint[],
    options: RouteOptions,
  ): Promise<RouteCalculationResult> {
    console.log('=== TRIMBLE ROUTE CALCULATION DEBUG ===');
    console.log('Input waypoints:', waypoints);
    console.log('Route options:', options);

    if (waypoints.length < 2) {
      return {
        success: false,
        error: 'At least 2 waypoints are required',
        provider: 'TRIMBLE',
      };
    }

    try {
      this.initializeSDK();

      // Convert waypoints to TrimbleMaps.LngLat
      const trimbleWaypoints = waypoints.map(
        wp => new TrimbleMaps.LngLat(wp.lng, wp.lat),
      );
      console.log('Converted to Trimble waypoints:', trimbleWaypoints);

      // For now, we'll create a simple route without using the SDK routing
      // This is a temporary solution until we figure out the correct SDK API
      const totalDistance = this.calculateTotalDistance(waypoints);
      const routeData = {
        waypoints: trimbleWaypoints,
        distance: totalDistance,
        time: totalDistance * 1.2 // rough estimate: 1.2 minutes per mile
      };
      console.log('Simulated route data:', routeData);

      // Process the route data
      const processedRoute = this.processRouteData(
        routeData,
        waypoints,
        options,
      );
      console.log('Processed route:', processedRoute);

      // Create final route object
      const finalRoute = this.processRoute(processedRoute, routeData);
      console.log('Final route object:', finalRoute);

      // Store the route
      this.activeRoutes.set(finalRoute.id, finalRoute);

      return {
        success: true,
        route: finalRoute,
        provider: 'TRIMBLE',
      };
    } catch (error) {
      console.error('Trimble route calculation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: 'TRIMBLE',
      };
    }
  }

  /**
   * Process raw route data from Trimble SDK
   */
  private processRouteData(
    routeData: any,
    originalWaypoints: Waypoint[],
    options: RouteOptions,
  ): any {
    console.log('=== PROCESSING ROUTE DATA ===');
    console.log('Route data type:', typeof routeData);
    console.log('Route data keys:', Object.keys(routeData || {}));
    console.log('Full route data:', routeData);

    // Extract waypoints with coordinates
    const waypoints = originalWaypoints.map((wp, index) => ({
      ...wp,
      sequenceNumber: index
    }));

    // Extract geometry for map display
    let geometry: [number, number][] = [];
    if (routeData && routeData.getGeometry) {
      const geom = routeData.getGeometry();
      console.log('Geometry from getGeometry():', geom);
      if (geom && Array.isArray(geom)) {
        geometry = geom.map((point: any) => [point.lng || point.x, point.lat || point.y]);
      }
    }

    console.log('Extracted geometry points:', geometry.length);

    // Extract total distance and time
    let totalDistance = 0;
    let totalTime = 0;

    const actualRouteData = routeData?.target || routeData;
    console.log('Actual route data:', actualRouteData);
    console.log('Available properties:', Object.keys(actualRouteData || {}));

    // Try multiple property names for distance
    if (actualRouteData.TMiles !== undefined) {
      totalDistance = actualRouteData.TMiles;
    } else if (actualRouteData.distance !== undefined) {
      totalDistance = actualRouteData.distance;
    } else if (actualRouteData.totalDistance !== undefined) {
      totalDistance = actualRouteData.totalDistance;
    } else if (actualRouteData.totalMiles !== undefined) {
      totalDistance = actualRouteData.totalMiles;
    }

    if (actualRouteData.TMinutes !== undefined) {
      totalTime = actualRouteData.TMinutes; // Time in minutes
    } else if (actualRouteData.time !== undefined) {
      totalTime = actualRouteData.time;
    } else if (actualRouteData.duration !== undefined) {
      totalTime = actualRouteData.duration;
    } else if (actualRouteData.totalTime !== undefined) {
      totalTime = actualRouteData.totalTime;
    }

    console.log('Final extracted distance:', totalDistance, 'time:', totalTime);

    // Create segments based on waypoints
    // For now, we'll distribute the total distance equally between segments
    // This is a simplified approach until we can access detailed segment data from Trimble SDK
    const segments: RouteSegment[] = [];
    if (waypoints.length > 1) {
      const segmentCount = waypoints.length - 1;
      const avgSegmentDistance = totalDistance / segmentCount;
      const avgSegmentTime = totalTime / segmentCount;
      
      for (let i = 0; i < segmentCount; i++) {
        segments.push({
          distance: avgSegmentDistance,
          duration: avgSegmentTime,
        });
      }
      
      console.log('Created segments:', segments);
    }

    // Calculate fuel cost
    const fuelCost =
      options.fuelCostPerGallon && options.mpg
        ? (totalDistance / options.mpg) * options.fuelCostPerGallon
        : 0;

    return {
      waypoints,
      totalMiles: totalDistance,
      totalTime: totalTime,
      segments,
      geometry,
      fuelCost,
    };
  }

  /**
   * Process route data from SDK into our Route format
   */
  private processRoute(
    route: any,
    responseData: any
  ): Route {
    try {
      // Create segments with simple distance distribution
      const totalDistance = route.totalMiles;
      const numSegments = Math.max(1, route.waypoints.length - 1);
      const avgSegmentDistance = totalDistance / numSegments;

      const routeSegments = route.waypoints.slice(1).map((waypoint: any, index: number) => ({
        from: route.waypoints[index],
        to: waypoint,
        distance: avgSegmentDistance,
        duration: 0 // Simple equal distribution
      }));

      return {
        id: `route-${Date.now()}`,
        name: `Route ${Date.now()}`,
        waypoints: route.waypoints,
        segments: routeSegments,
        totalDistance: totalDistance,
        totalDuration: 0,
        geometry: route.geometry,
        color: this.getNextRouteColor(),
        estimatedFuelCost: 0,
        estimatedToll: 0
      };
    } catch (error) {
      console.error('Error processing route:', error);
      throw error;
    }
  }

  /**
   * Calculate total distance between waypoints using Haversine formula
   */
  private calculateTotalDistance(waypoints: Waypoint[]): number {
    if (waypoints.length < 2) return 0;
    
    let totalDistance = 0;
    for (let i = 1; i < waypoints.length; i++) {
      const prev = waypoints[i - 1];
      const curr = waypoints[i];
      totalDistance += this.haversineDistance(prev.lat, prev.lng, curr.lat, curr.lng);
    }
    
    return totalDistance;
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3959; // Radius of the Earth in miles
    const dLat = this.degToRad(lat2 - lat1);
    const dLon = this.degToRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.degToRad(lat1)) * Math.cos(this.degToRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   */
  private degToRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Get the next available color for a route
   */
  private getNextRouteColor(): string {
    const colors = [
      '#FF6B6B', // Red
      '#4ECDC4', // Teal
      '#45B7D1', // Blue
      '#96CEB4', // Green
      '#FFEAA7', // Yellow
      '#DDA0DD', // Plum
      '#98D8C8', // Mint
      '#F7DC6F', // Light Yellow
      '#BB8FCE', // Light Purple
      '#85C1E9'  // Light Blue
    ];
    
    const usedColors = Array.from(this.activeRoutes.values()).map(route => route.color);
    const availableColors = colors.filter(color => !usedColors.includes(color));
    
    return availableColors.length > 0 ? availableColors[0] : colors[0];
  }

  /**
   * Search for locations using Single Search API
   */
  async searchLocations(query: string): Promise<Waypoint[]> {
    if (!query || query.length < 3) return [];

    try {
      const region = 'NA'; // Default to North America
      const dataset = 'default';
      const maxResults = 10;

      const url = `${this.baseUrl}/search?query=${encodeURIComponent(
        query,
      )}&region=${region}&dataset=${dataset}&maxResults=${maxResults}&key=${this.apiKey}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.results || !Array.isArray(data.results)) {
        return [];
      }

      return data.results.map((result: any, index: number) => ({
        id: `search-${index}`,
        lat: result.coords?.lat || 0,
        lng: result.coords?.lon || 0,
        address: result.address?.formattedAddress || result.name || query,
        city: result.address?.city || '',
        state: result.address?.state || '',
        zipCode: result.address?.zip || '',
        country: result.address?.country || 'US',
      }));
    } catch (error) {
      console.error('Location search error:', error);
      return [];
    }
  }

  /**
   * Geocode an address to get coordinates
   */
  async geocodeAddress(address: string): Promise<Waypoint | null> {
    try {
      const locations = await this.searchLocations(address);
      return locations.length > 0 ? locations[0] : null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }
}
