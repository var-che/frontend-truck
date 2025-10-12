import React, { useEffect, useRef } from 'react';
import * as TrimbleMaps from '@trimblemaps/trimblemaps-js';
import { useTrimbleRouting } from '../../../context/routing/TrimbleRoutingContext';

interface TrimbleMapDisplayProps {
  mapInstance: TrimbleMaps.Map | null;
}

const TrimbleMapDisplay: React.FC<TrimbleMapDisplayProps> = ({
  mapInstance,
}) => {
  const { activeRoutes } = useTrimbleRouting();
  const routeLayersRef = useRef<Map<string, string>>(new Map());
  const markersRef = useRef<Map<string, TrimbleMaps.Marker[]>>(new Map());

  useEffect(() => {
    if (!mapInstance) {
      console.log('❌ TrimbleMapDisplay: No map instance available');
      return;
    }

    console.log('🗺️ TrimbleMapDisplay: Processing active routes', {
      routeCount: activeRoutes.size,
      routes: Array.from(activeRoutes.entries()).map(([id, route]) => ({
        id,
        waypointCount: route.waypoints.length,
        hasGeometry: !!route.geometry,
        geometryType: Array.isArray(route.geometry)
          ? 'coordinates-array'
          : (route.geometry as any)?.type,
        color: route.color,
      })),
    });

    // Copy refs at the start of the effect for cleanup
    const routeLayers = routeLayersRef.current;
    const markers = markersRef.current;

    try {
      // Clear all existing routes and markers
      routeLayers.forEach((layerId) => {
        if (mapInstance.getLayer(layerId)) {
          mapInstance.removeLayer(layerId);
        }
        if (mapInstance.getSource(layerId)) {
          mapInstance.removeSource(layerId);
        }
      });

      markers.forEach((markersArray) => {
        markersArray.forEach((marker) => marker.remove());
      });

      routeLayers.clear();
      markers.clear();

      // Add each active route to the map
      const routeEntries = Array.from(activeRoutes.entries());
      console.log(
        '🔄 TrimbleMapDisplay: Processing routes for display',
        routeEntries.length,
      );

      routeEntries.forEach(([elementId, routeWithColor], routeIndex) => {
        const { color, ...route } = routeWithColor;
        console.log(`🛣️ Processing route ${elementId}:`, {
          color,
          waypointCount: route.waypoints.length,
          hasGeometry: !!route.geometry,
          geometry: route.geometry,
        });

        if (route.waypoints.length < 2) {
          console.warn(`⚠️ Route ${elementId} has insufficient waypoints`);
          return;
        }

        // Add route geometry if available
        if (route.geometry) {
          const routeId = `route-${elementId}`;
          routeLayersRef.current.set(elementId, routeId);
          console.log(`📍 Adding route geometry for ${routeId}`);

          let geoJSONGeometry: any;
          if (Array.isArray(route.geometry)) {
            // Convert coordinate array to GeoJSON LineString
            geoJSONGeometry = {
              type: 'LineString' as const,
              coordinates: route.geometry,
            };
          } else if ('coordinates' in route.geometry) {
            geoJSONGeometry = route.geometry;
          } else {
            console.warn(
              `⚠️ Unknown geometry format for route ${elementId}:`,
              route.geometry,
            );
            return;
          }

          console.log(`📊 GeoJSON geometry for ${routeId}:`, geoJSONGeometry);

          // Add route source
          mapInstance.addSource(routeId, {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: geoJSONGeometry,
            },
          });

          // Add route layer with the assigned color and slight width variation for visibility
          const lineWidth = 4 + routeIndex * 0.5; // Slightly different widths
          const lineOpacity = 0.85 - routeIndex * 0.05; // Slightly different opacities

          mapInstance.addLayer({
            id: routeId,
            type: 'line',
            source: routeId,
            layout: {
              'line-join': 'round',
              'line-cap': 'round',
            },
            paint: {
              'line-color': color,
              'line-width': lineWidth,
              'line-opacity': Math.max(lineOpacity, 0.6), // Minimum opacity
            },
          });
        }

        // Add markers for this route
        const routeMarkers: TrimbleMaps.Marker[] = [];
        console.log(
          `🎯 Adding markers for route ${elementId} with ${route.waypoints.length} waypoints`,
        );

        // Start marker (green)
        const startMarker = new TrimbleMaps.Marker({
          color: '#22c55e',
        })
          .setLngLat([route.waypoints[0].lng, route.waypoints[0].lat])
          .addTo(mapInstance);
        routeMarkers.push(startMarker);
        console.log(
          `🟢 Added start marker at [${route.waypoints[0].lng}, ${route.waypoints[0].lat}]`,
        );

        // End marker (red)
        const endMarker = new TrimbleMaps.Marker({
          color: '#ef4444',
        })
          .setLngLat([
            route.waypoints[route.waypoints.length - 1].lng,
            route.waypoints[route.waypoints.length - 1].lat,
          ])
          .addTo(mapInstance);
        routeMarkers.push(endMarker);
        console.log(
          `🔴 Added end marker at [${
            route.waypoints[route.waypoints.length - 1].lng
          }, ${route.waypoints[route.waypoints.length - 1].lat}]`,
        );

        // Intermediate waypoints (using route color)
        for (let i = 1; i < route.waypoints.length - 1; i++) {
          const waypoint = route.waypoints[i];
          const marker = new TrimbleMaps.Marker({
            color: color,
          })
            .setLngLat([waypoint.lng, waypoint.lat])
            .addTo(mapInstance);
          routeMarkers.push(marker);
          console.log(
            `⚪ Added intermediate marker ${i} at [${waypoint.lng}, ${waypoint.lat}]`,
          );
        }

        markersRef.current.set(elementId, routeMarkers);
      });

      // Fit map to show all routes if there are any
      if (activeRoutes.size > 0) {
        const allWaypoints = Array.from(activeRoutes.values()).flatMap(
          (route) => route.waypoints,
        );

        if (allWaypoints.length > 0) {
          const lats = allWaypoints.map((wp) => wp.lat);
          const lngs = allWaypoints.map((wp) => wp.lng);

          const minLat = Math.min(...lats);
          const maxLat = Math.max(...lats);
          const minLng = Math.min(...lngs);
          const maxLng = Math.max(...lngs);

          const bounds = new TrimbleMaps.LngLatBounds(
            [minLng, minLat],
            [maxLng, maxLat],
          );
          mapInstance.fitBounds(bounds, { padding: 50 });
        }
      }
    } catch (error) {
      console.error('Error displaying routes on map:', error);
    }

    return () => {
      if (mapInstance) {
        routeLayers.forEach((layerId) => {
          try {
            if (mapInstance.getLayer(layerId)) {
              mapInstance.removeLayer(layerId);
            }
            if (mapInstance.getSource(layerId)) {
              mapInstance.removeSource(layerId);
            }
          } catch (e) {
            console.warn('Error cleaning up route layer:', e);
          }
        });

        markers.forEach((markersArray) => {
          markersArray.forEach((marker) => {
            try {
              marker.remove();
            } catch (e) {
              console.warn('Error removing marker:', e);
            }
          });
        });
      }
    };
  }, [mapInstance, activeRoutes]);

  // Routes are rendered on the map but no widget is displayed
  return null;
};

export default TrimbleMapDisplay;
