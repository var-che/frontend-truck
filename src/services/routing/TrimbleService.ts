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
   * Calculate route using Trimble Maps SDK with proper Route class
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

      // Convert waypoints to TrimbleMaps.LngLat properly
      const routeStops = waypoints.map(
        (wp) => new TrimbleMaps.LngLat(wp.lng, wp.lat),
      );
      console.log('🚛 Creating Trimble Maps Route with stops:', routeStops);

      // Use the proper TrimbleMaps.Route class like in the sample apps
      const routeResult = await this.createTrimbleRoute(routeStops, options);

      if (!routeResult.success) {
        throw new Error(routeResult.error || 'Route calculation failed');
      }

      console.log(
        '✅ Trimble route calculated successfully:',
        routeResult.route,
      );

      // Store the route
      this.activeRoutes.set(routeResult.route!.id, routeResult.route!);

      return routeResult;
    } catch (error) {
      console.error('❌ Trimble route calculation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: 'TRIMBLE',
      };
    }
  }

  /**
   * Create route using PCMiler REST API
   */
  private async createTrimbleRoute(
    routeStops: TrimbleMaps.LngLat[],
    options: RouteOptions,
  ): Promise<RouteCalculationResult> {
    try {
      // Build the REST API URL for PCMiler
      const baseUrl =
        'https://pcmiler.alk.com/APIs/REST/v1.0/service.svc/route/routePath';

      // Convert stops to the required format: "lng,lat;lng,lat;..."
      const stopsParam = routeStops
        .map((stop) => `${stop.lng},${stop.lat}`)
        .join(';');

      // Configure route parameters based on options
      const params = new URLSearchParams({
        stops: stopsParam,
        vehType: '0', // 0 = Truck
        routeType: '0', // 0 = Practical route
        tollRoads: options.avoidTolls ? '1' : '3', // 1 = Avoid, 3 = Use
        openBorders: 'true',
        hwyOnly: options.avoidHighways ? 'false' : 'false',
        hazMat: options.truckSpecs?.hazmatClass ? '1' : '0',
        distUnits: '0', // 0 = Miles
        vehDimUnits: '0',
        region: 'NA',
        dataVersion: 'Current',
        reports: 'Mileage,Directions',
        useSites: 'false',
        authToken: '299354C7A83A67439273691EA750BB7F', // PCMiler API auth token
      });

      const url = `${baseUrl}?${params.toString()}`;
      console.log('🚛 PCMiler API request:', url);

      // Make the API call
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(
          `PCMiler API error: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();
      console.log('✅ PCMiler API response:', data);

      // Process the actual API response
      return this.processPCMilerResponse(data, routeStops, options);
    } catch (error) {
      console.error('❌ PCMiler API error:', error);

      // Fallback to enhanced simple route
      console.log('🔄 Falling back to enhanced simple route calculation...');
      return this.calculateEnhancedSimpleRoute(routeStops, options);
    }
  }

  /**
   * Process PCMiler API response into our route format
   */
  private async processPCMilerResponse(
    data: any,
    routeStops: TrimbleMaps.LngLat[],
    options: RouteOptions,
  ): Promise<RouteCalculationResult> {
    try {
      console.log('🎯 Processing PCMiler response...');

      // Extract basic route information
      const totalDistance = data.TDistance || 0; // Total distance in miles
      const totalTime = data.TMinutes || 0; // Total time in minutes

      // Extract geometry
      let geometry: any = null;
      if (data.geometry && data.geometry.type === 'MultiLineString') {
        // Convert MultiLineString to LineString for map display
        const allCoordinates: number[][] = [];

        // Flatten all coordinate segments into a single array
        data.geometry.coordinates.forEach((segment: number[][]) => {
          allCoordinates.push(...segment);
        });

        geometry = {
          type: 'LineString',
          coordinates: allCoordinates,
        };

        console.log('✅ Processed geometry:', {
          type: geometry.type,
          coordinateCount: allCoordinates.length,
          firstCoord: allCoordinates[0],
          lastCoord: allCoordinates[allCoordinates.length - 1],
        });
      } else {
        // Fallback to simple line geometry
        geometry = {
          type: 'LineString',
          coordinates: routeStops.map((stop) => [stop.lng, stop.lat]),
        };
        console.log('⚠️ Using fallback geometry (no route coordinates found)');
      }

      // Calculate individual segments between waypoints
      const segments: any[] = [];

      for (let i = 1; i < routeStops.length; i++) {
        // Calculate actual distance between consecutive waypoints using Haversine
        const segmentDistance = this.haversineDistance(
          routeStops[i - 1].lat,
          routeStops[i - 1].lng,
          routeStops[i].lat,
          routeStops[i].lng,
        );

        // Apply truck routing factor for more realistic distances
        const truckSegmentDistance = segmentDistance * 1.25; // 25% increase for truck routing

        // Calculate proportional time based on this segment's distance
        const segmentTime =
          totalTime > 0
            ? (truckSegmentDistance / totalDistance) * totalTime
            : truckSegmentDistance * 1.2; // Fallback: 1.2 minutes per mile

        segments.push({
          from: this.convertToWaypoint(routeStops[i - 1], i - 1),
          to: this.convertToWaypoint(routeStops[i], i),
          distance: truckSegmentDistance,
          duration: segmentTime,
        });
      }

      // Calculate fuel cost
      const fuelCost =
        options.fuelCostPerGallon && options.mpg
          ? (totalDistance / options.mpg) * options.fuelCostPerGallon
          : 0;

      // Create final route object
      const route: Route = {
        id: `pcmiler-route-${Date.now()}`,
        name: `Truck Route ${Date.now()}`,
        waypoints: routeStops.map((stop, index) =>
          this.convertToWaypoint(stop, index),
        ),
        segments,
        totalDistance,
        totalDuration: totalTime,
        totalTime,
        geometry,
        color: this.getNextRouteColor(),
        estimatedFuelCost: fuelCost,
        estimatedToll: 0, // Could be extracted from detailed reports
        provider: 'TRIMBLE',
      };

      console.log('📊 Final PCMiler route summary:', {
        totalDistance: totalDistance.toFixed(1) + ' miles',
        totalTime: Math.round(totalTime) + ' minutes',
        segments: segments.length,
        fuelCost: fuelCost.toFixed(2),
        geometryType: geometry.type,
        coordinateCount: geometry.coordinates.length,
      });

      return {
        success: true,
        route,
        provider: 'TRIMBLE',
      };
    } catch (error) {
      console.error('❌ Error processing PCMiler response:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: 'TRIMBLE',
      };
    }
  }

  /**
   * Convert TrimbleMaps.LngLat to Waypoint
   */
  private convertToWaypoint(
    lngLat: TrimbleMaps.LngLat,
    index: number,
  ): Waypoint {
    return {
      id: `waypoint-${index}`,
      lat: lngLat.lat,
      lng: lngLat.lng,
      address: `Stop ${index + 1}`,
    };
  }

  /**
   * Enhanced simple route calculation with better distance estimates
   */
  private async calculateEnhancedSimpleRoute(
    waypoints: TrimbleMaps.LngLat[],
    options: RouteOptions,
  ): Promise<RouteCalculationResult> {
    console.log('⚠️ Using enhanced simple route calculation');

    // Convert back to Waypoint format
    const simpleWaypoints: Waypoint[] = waypoints.map((wp, index) => ({
      id: `waypoint-${index}`,
      lat: wp.lat,
      lng: wp.lng,
      address: `Waypoint ${index + 1}`,
    }));

    // For truck routing, add a factor to account for road routing vs straight line
    const TRUCK_ROUTING_FACTOR = 1.3; // Trucks typically travel 30% more distance than straight line

    // Create segments with individual distances
    const segments: any[] = [];
    let totalDistance = 0;

    for (let i = 1; i < simpleWaypoints.length; i++) {
      const straightLineDistance = this.haversineDistance(
        simpleWaypoints[i - 1].lat,
        simpleWaypoints[i - 1].lng,
        simpleWaypoints[i].lat,
        simpleWaypoints[i].lng,
      );

      // Apply truck routing factor for more realistic distances
      const truckDistance = straightLineDistance * TRUCK_ROUTING_FACTOR;
      totalDistance += truckDistance;

      segments.push({
        from: simpleWaypoints[i - 1],
        to: simpleWaypoints[i],
        distance: truckDistance,
        duration: truckDistance * 1.5, // Assume 40 mph average truck speed
      });
    }

    // Create simple geometry (straight lines) but note it's not actual route
    const geometry = this.createSimpleGeometry(simpleWaypoints);

    console.log('📊 Enhanced simple route summary:', {
      totalDistance: totalDistance.toFixed(1) + ' miles (estimated)',
      averageSpeed: '40 mph (truck routing)',
      note: 'Distances adjusted for truck routing (+30%)',
    });

    const route: Route = {
      id: `enhanced-route-${Date.now()}`,
      name: `Enhanced Truck Route ${Date.now()}`,
      waypoints: simpleWaypoints,
      segments,
      totalDistance,
      totalDuration: totalDistance * 1.5,
      geometry,
      color: this.getNextRouteColor(),
      estimatedFuelCost: 0,
      estimatedToll: 0,
      provider: 'TRIMBLE',
    };

    return {
      success: true,
      route,
      provider: 'TRIMBLE',
    };
  }

  /**
   * Create simple geometry for fallback routes
   */
  private createSimpleGeometry(waypoints: Waypoint[]): any {
    return {
      type: 'LineString',
      coordinates: waypoints.map((wp) => [wp.lng, wp.lat]),
    };
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  private haversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Get next route color for visual distinction
   */
  private getNextRouteColor(): string {
    const colors = ['#FF5733', '#33C3FF', '#8A2BE2', '#FFD700', '#32CD32'];
    return colors[this.activeRoutes.size % colors.length];
  }

  /**
   * Search for locations using Single Search API
   */
  async searchLocations(query: string): Promise<Waypoint[]> {
    if (!query || query.length < 3) return [];

    try {
      const region = 'NA'; // Default to North America
      const maxResults = 5;

      // Use the correct Trimble Maps Single Search API endpoint structure
      const url = `${this.baseUrl}/${region}/api/search?authToken=${
        this.apiKey
      }&query=${encodeURIComponent(query)}&maxResults=${maxResults}`;

      console.log('🔍 Trimble API call:', url);

      const response = await fetch(url);
      if (!response.ok) {
        console.error(
          '❌ Trimble API error:',
          response.status,
          response.statusText,
        );
        throw new Error(
          `Search failed: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();
      console.log('✅ Trimble API response:', data);

      // Parse the response according to actual Trimble Maps API format
      if (
        !data ||
        data.Err !== 0 ||
        !data.Locations ||
        !Array.isArray(data.Locations)
      ) {
        console.warn(
          '⚠️ Unexpected Trimble API response format or error:',
          data,
        );
        return [];
      }

      return data.Locations.map((location: any, index: number) => ({
        id: `search-${index}`,
        lat: parseFloat(location.Coords?.Lat || '0'),
        lng: parseFloat(location.Coords?.Lon || '0'),
        address:
          location.ShortString ||
          `${location.Address?.City || ''}, ${location.Address?.State || ''}`,
        city: location.Address?.City || '',
        state: location.Address?.State || '',
        zipCode: location.Address?.Zip || '',
        country: location.Address?.Country || 'US',
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
