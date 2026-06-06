/**
 * LoadRouteMap
 * - Real PCMiler truck-route line on a Trimble Maps map
 * - Origin pre-filled from lane search origin
 * - Draggable markers (Origin, Pickup, Delivery, + extra stops)
 * - Drag a pin -> route auto-recalculates
 * - Address autocomplete + "Add Stop"
 */

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import * as TrimbleMaps from '@trimblemaps/trimblemaps-js';
import { AutoComplete, Button, Input, Spin, Typography } from 'antd';
import { AimOutlined, HolderOutlined, PlusOutlined, ReloadOutlined, GlobalOutlined } from '@ant-design/icons';

const { Text } = Typography;

const TRIMBLE_KEY =
  process.env.REACT_APP_TRIMBLE_API_KEY || '299354C7A83A67439273691EA750BB7F';

// API helpers

interface GeoResult {
  lat: number;
  lng: number;
  display: string;
}

// North America bounding box – rejects any geocoding result outside this range
const NA_LAT_MIN = 14, NA_LAT_MAX = 72;
const NA_LNG_MIN = -170, NA_LNG_MAX = -52;

async function geocodeQuery(query: string): Promise<GeoResult[]> {
  if (!query || query.length < 2) return [];
  try {
    const url = `https://singlesearch.alk.com/NA/api/search?authToken=${TRIMBLE_KEY}&query=${encodeURIComponent(query)}&maxResults=6`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    if (data.Err !== 0 || !Array.isArray(data.Locations)) return [];
    return (data.Locations.map((loc: any) => ({
      lat: parseFloat(loc.Coords?.Lat || '0'),
      lng: parseFloat(loc.Coords?.Lon || '0'),
      display: loc.ShortString || `${loc.Address?.City || ''}, ${loc.Address?.State || ''}`.trim(),
    })) as GeoResult[]).filter((r) =>
      r.lat !== 0 && r.lng !== 0 &&
      r.lat >= NA_LAT_MIN && r.lat <= NA_LAT_MAX &&
      r.lng >= NA_LNG_MIN && r.lng <= NA_LNG_MAX
    );
  } catch { return []; }
}

interface RouteResult { coords: [number,number][]; miles: number; minutes: number; }

async function fetchTruckRoute(points: {lat:number;lng:number}[]): Promise<RouteResult|null> {
  if (points.length < 2) return null;
  try {
    const stops = points.map((p) => `${p.lng},${p.lat}`).join(';');
    const params = new URLSearchParams({ stops, vehType:'0', routeType:'0', tollRoads:'3', distUnits:'0', region:'NA', dataVersion:'Current', authToken: TRIMBLE_KEY });
    const res = await fetch(`https://pcmiler.alk.com/APIs/REST/v1.0/service.svc/route/routePath?${params}`);
    const data = await res.json();
    let coords: [number,number][] = [];
    if (data.geometry?.type === 'MultiLineString') {
      (data.geometry.coordinates as number[][][]).forEach((seg) => { coords.push(...(seg as [number,number][])); });
    } else if (data.geometry?.type === 'LineString') {
      coords = data.geometry.coordinates as [number,number][];
    } else {
      coords = points.map((p) => [p.lng, p.lat]);
    }
    return { coords, miles: parseFloat(data.TDistance) || 0, minutes: parseFloat(data.TMinutes) || 0 };
  } catch {
    return { coords: points.map((p) => [p.lng, p.lat]), miles: 0, minutes: 0 };
  }
}

// Types

interface WaypointItem { id:string; address:string; lat:number|null; lng:number|null; locked:boolean; }
interface SearchOption { value:string; label:string; lat:number; lng:number; }

let _seq = 0;
const mkId = () => `wp-${++_seq}-${Date.now()}`;

function makeInitialWaypoints(pickupAddress:string, deliveryAddress:string, userOrigin?:string): WaypointItem[] {
  return [
    { id:'origin',   address: userOrigin || '',   lat:null, lng:null, locked:false },
    { id:'pickup',   address: pickupAddress,       lat:null, lng:null, locked:true  },
    { id:'delivery', address: deliveryAddress,     lat:null, lng:null, locked:true  },
  ];
}

function markerColor(id:string, idx:number, total:number): string {
  if (id === 'origin')   return '#595959';
  if (id === 'delivery' || idx === total-1) return '#ff4d4f';
  if (id === 'pickup')   return '#52c41a';
  return '#1677ff';
}

function wpLabel(id:string, index:number): string {
  if (id === 'origin')   return 'Origin (your location)';
  if (id === 'pickup')   return 'Pickup';
  if (id === 'delivery') return 'Delivery';
  return `Stop ${index - 1}`;
}

function makeMarkerEl(color: string, num: number): HTMLDivElement {
  const el = document.createElement('div');
  el.style.cssText = `width:26px;height:32px;cursor:grab;position:relative;`;
  el.innerHTML = `<svg viewBox="0 0 24 32" xmlns="http://www.w3.org/2000/svg" style="width:26px;height:32px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.4))">
    <path d="M12 0C7.58 0 4 3.58 4 8c0 5.54 8 16 8 16s8-10.46 8-16c0-4.42-3.58-8-8-8z" fill="${color}" stroke="#fff" stroke-width="1.5"/>
    <text x="12" y="12" text-anchor="middle" dominant-baseline="middle" font-size="9" font-weight="bold" fill="#fff" font-family="sans-serif">${num}</text>
  </svg>`;
  return el;
}

// Component

export interface LoadRouteMapProps {
  origin: string;
  destination: string;
  loadId: string;
  userOrigin?: string;
}

const LoadRouteMap: React.FC<LoadRouteMapProps> = ({ origin, destination, loadId, userOrigin }) => {
  const routeSourceId  = `lr-src-${loadId}`;
  const casingLayerId  = `lr-cas-${loadId}`;
  const lineLayerId    = `lr-ln-${loadId}`;

  const [waypoints, setWaypoints] = useState<WaypointItem[]>(() =>
    makeInitialWaypoints(origin, destination, userOrigin));
  const [routeResult, setRouteResult]   = useState<RouteResult|null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [mapReady, setMapReady]         = useState(false);
  const [searchOptions, setSearchOptions] = useState<Record<string,SearchOption[]>>({});

  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragIndexRef = useRef<number | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef          = useRef<TrimbleMaps.Map|null>(null);
  const markersRef      = useRef<Map<string,TrimbleMaps.Marker>>(new Map());
  const searchTimers    = useRef<Record<string,ReturnType<typeof setTimeout>>>({});
  const waypointsRef    = useRef(waypoints);
  waypointsRef.current  = waypoints;
  const initialCalcDone = useRef(false);
  const isMountedRef    = useRef(false);

  // 1. Map init
  useEffect(() => {
    if (!mapContainerRef.current) return;
    TrimbleMaps.setAPIKey(TRIMBLE_KEY);
    const map = new TrimbleMaps.Map({
      container: mapContainerRef.current,
      style: TrimbleMaps.Common.Style.TRANSPORTATION,
      center: [-96, 38],
      zoom: 3.5,
      attributionControl: false,
    });
    map.on('load', () => {
      requestAnimationFrame(() => { map.resize(); setMapReady(true); });
    });
    mapRef.current = map;

    // Resize the map whenever the container changes size (e.g. Ant Design expand animation)
    // Without this, markers can appear at wrong positions if the container was zero-sized at init.
    const ro = new ResizeObserver(() => {
      if (mapRef.current) {
        mapRef.current.resize();
      }
    });
    ro.observe(mapContainerRef.current);

    return () => {
      initialCalcDone.current = false;
      markersRef.current.forEach((m) => m.remove());
      markersRef.current.clear();
      ro.disconnect();
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 1b. Reset route when the load changes (guards against stale state if component is reused)
  useEffect(() => {
    if (!isMountedRef.current) { isMountedRef.current = true; return; }
    initialCalcDone.current = false;
    setRouteResult(null);
    setWaypoints(makeInitialWaypoints(origin, destination, userOrigin));
  }, [origin, destination, userOrigin]); // eslint-disable-line react-hooks/exhaustive-deps

  // 2. Geocode initial addresses
  useEffect(() => {
    let cancelled = false;
    const patch = (id: string, res: GeoResult[]) => {
      if (cancelled || !res.length) return;
      setWaypoints((prev) => prev.map((w) =>
        w.id === id ? { ...w, lat: res[0].lat, lng: res[0].lng } : w));
    };
    if (origin)      geocodeQuery(origin).then((r)      => patch('pickup',   r));
    if (destination) geocodeQuery(destination).then((r) => patch('delivery', r));
    if (userOrigin)  geocodeQuery(userOrigin).then((r)  => patch('origin',   r));
    return () => { cancelled = true; };
  }, [origin, destination, userOrigin]);

  // 3. Auto-calc once >=2 points ready
  const geocodedCount = useMemo(() => waypoints.filter((w) => w.lat != null).length, [waypoints]);
  useEffect(() => {
    if (initialCalcDone.current || geocodedCount < 2) return;
    initialCalcDone.current = true;
    setTimeout(() => handleCalculate(), 250);
  }, [geocodedCount]); // eslint-disable-line react-hooks/exhaustive-deps

  const recalc = useCallback((wps: WaypointItem[]) => {
    const pts = wps.filter((w) => w.lat != null && w.lng != null);
    if (pts.length < 2) return;
    setIsCalculating(true);
    fetchTruckRoute(pts.map((w) => ({ lat: w.lat!, lng: w.lng! }))).then((r) => {
      setRouteResult(r);
      setIsCalculating(false);
    });
  }, []);

  // 4. Sync markers
  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;
    const markerMap = markersRef.current;
    const currentIds = new Set(waypoints.map((w) => w.id));

    // Remove deleted
    markerMap.forEach((marker, id) => {
      if (!currentIds.has(id)) { marker.remove(); markerMap.delete(id); }
    });

    const geocodedWps = waypoints.filter((w) => w.lat != null && w.lng != null);

    waypoints.forEach((wp) => {
      if (wp.lat == null || wp.lng == null) {
        markerMap.get(wp.id)?.remove();
        markerMap.delete(wp.id);
        return;
      }
      const gIdx  = geocodedWps.findIndex((w) => w.id === wp.id);
      const color = markerColor(wp.id, gIdx, geocodedWps.length);
      const num   = gIdx + 1;

      if (markerMap.has(wp.id)) {
        const existing = markerMap.get(wp.id)!;
        // Re-create if color or number changed (element is baked in)
        const existingEl = existing.getElement();
        const prevColor  = existingEl.dataset.markerColor;
        const prevNum    = existingEl.dataset.markerNum;
        if (prevColor === color && prevNum === String(num)) {
          existing.setLngLat([wp.lng, wp.lat]);
          return;
        }
        // Remove old, fall through to create new
        existing.remove();
        markerMap.delete(wp.id);
      }

      // Create new marker
      const wpId = wp.id;
      const el   = makeMarkerEl(color, num);
      el.dataset.markerColor = color;
      el.dataset.markerNum   = String(num);

      const marker = new TrimbleMaps.Marker({ element: el, anchor: 'bottom', draggable: true })
        .setLngLat([wp.lng, wp.lat])
        .addTo(map);

      // Hover label
      const popup = new TrimbleMaps.Popup({ offset: [0, -36], closeButton: false })
        .setHTML(`<span style="font-size:11px;font-weight:600">${wpLabel(wpId, waypoints.findIndex((w) => w.id === wpId))}</span>`);
      el.addEventListener('mouseenter', () => popup.setLngLat([wp.lng!, wp.lat!]).addTo(map));
      el.addEventListener('mouseleave', () => popup.remove());

      marker.on('drag', () => { el.style.cursor = 'grabbing'; });

      marker.on('dragend', () => {
        el.style.cursor = 'grab';
        const { lat, lng } = marker.getLngLat();
        // Update popup position
        popup.setLngLat([lng, lat]);
        setWaypoints((prev) => {
          const updated = prev.map((w) =>
            w.id === wpId ? { ...w, lat, lng, address: `${lat.toFixed(5)}, ${lng.toFixed(5)}` } : w);
          recalc(updated);
          return updated;
        });
      });

      markerMap.set(wpId, marker);
    });
  }, [mapReady, waypoints, recalc]);

  // 5. Draw route line + fitBounds
  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;

    if (routeResult && routeResult.coords.length > 1) {
      const geojson = {
        type: 'Feature' as const,
        properties: {},
        geometry: { type: 'LineString' as const, coordinates: routeResult.coords },
      };
      if (map.getSource(routeSourceId)) {
        (map.getSource(routeSourceId) as any).setData(geojson);
      } else {
        map.addSource(routeSourceId, { type: 'geojson', data: geojson });
        map.addLayer({ id: casingLayerId, type:'line', source: routeSourceId,
          layout: {'line-join':'round','line-cap':'round'},
          paint: {'line-color':'#fff','line-width':8,'line-opacity':0.7} });
        map.addLayer({ id: lineLayerId, type:'line', source: routeSourceId,
          layout: {'line-join':'round','line-cap':'round'},
          paint: {'line-color':'#1677ff','line-width':4,'line-opacity':0.9} });
      }
      const bounds = new TrimbleMaps.LngLatBounds();
      routeResult.coords.forEach(([lng, lat]) => bounds.extend([lng, lat]));
      map.fitBounds(bounds, { padding: 60, maxZoom: 11, duration: 500 });
    } else {
      const geocodedWps = waypointsRef.current.filter((w) => w.lat != null && w.lng != null);
      if (geocodedWps.length > 0) {
        const bounds = new TrimbleMaps.LngLatBounds();
        geocodedWps.forEach((w) => bounds.extend([w.lng!, w.lat!]));
        map.fitBounds(bounds, { padding: 80, maxZoom: 9, duration: 400 });
      }
    }
  }, [mapReady, routeResult]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handlers
  const handleCalculate = useCallback(async () => {
    const pts = waypointsRef.current.filter((w) => w.lat != null && w.lng != null);
    if (pts.length < 2) return;
    setIsCalculating(true);
    try {
      const result = await fetchTruckRoute(pts.map((w) => ({ lat: w.lat!, lng: w.lng! })));
      setRouteResult(result);
    } finally { setIsCalculating(false); }
  }, []);

  const handleSearch = useCallback((wpId: string, query: string) => {
    setWaypoints((prev) => prev.map((w) => w.id === wpId ? { ...w, address: query, lat: null, lng: null } : w));
    if (searchTimers.current[wpId]) clearTimeout(searchTimers.current[wpId]);
    searchTimers.current[wpId] = setTimeout(async () => {
      const results = await geocodeQuery(query);
      setSearchOptions((prev) => ({ ...prev, [wpId]: results.map((r) => ({ value: r.display, label: r.display, lat: r.lat, lng: r.lng })) }));
    }, 350);
  }, []);

  const handleSelect = useCallback((wpId: string, value: string, option: SearchOption) => {
    setWaypoints((prev) => {
      const updated = prev.map((w) => w.id === wpId ? { ...w, address: value, lat: option.lat, lng: option.lng } : w);
      const pts = updated.filter((w) => w.lat != null && w.lng != null);
      if (pts.length >= 2) {
        setIsCalculating(true);
        fetchTruckRoute(pts.map((w) => ({ lat: w.lat!, lng: w.lng! }))).then((r) => { setRouteResult(r); setIsCalculating(false); });
      }
      return updated;
    });
  }, []);

  const handleAddStop = useCallback(() => {
    const newWp: WaypointItem = { id: mkId(), address: '', lat: null, lng: null, locked: false };
    setWaypoints((prev) => { const last = prev.length - 1; return [...prev.slice(0, last), newWp, prev[last]]; });
  }, []);

  const handleRemove = useCallback((id: string) => {
    markersRef.current.get(id)?.remove();
    markersRef.current.delete(id);
    setWaypoints((prev) => prev.filter((w) => w.id !== id));
    setRouteResult(null);
  }, []);

  const handleOpenGoogleMaps = useCallback(() => {
    const pts = waypoints.filter((w) => w.lat != null && w.lng != null);
    if (pts.length >= 2) {
      const stops = pts.map((w) => `${w.lat},${w.lng}`).join('/');
      window.open(`https://www.google.com/maps/dir/${stops}`, '_blank', 'noopener,noreferrer');
    } else {
      const addrs = waypoints.filter((w) => w.address.trim()).map((w) => encodeURIComponent(w.address.trim()));
      if (addrs.length >= 2) {
        window.open(`https://www.google.com/maps/dir/${addrs.join('/')}`, '_blank', 'noopener,noreferrer');
      }
    }
  }, [waypoints]);

  const fmtTime = (min: number) => {
    if (!min) return '�';
    const h = Math.floor(min / 60);
    const m = Math.round(min % 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const geocodedCount2 = waypoints.filter((w) => w.lat != null).length;

  return (
    <div style={{ display:'flex', height:420, border:'1px solid #d9d9d9', borderRadius:6, background:'#fff', position:'relative' }}>

      {/* LEFT: waypoints panel */}
      <div style={{ width:252, minWidth:252, background:'#fafafa', borderRight:'1px solid #e8e8e8', borderRadius:'6px 0 0 6px', display:'flex', flexDirection:'column', overflow:'hidden', zIndex:1 }}>
        <div style={{ padding:'7px 10px', borderBottom:'1px solid #e8e8e8', background:'#fff', fontSize:12, fontWeight:600, color:'#1677ff', display:'flex', alignItems:'center', gap:5, flexShrink:0 }}>
          <AimOutlined /> Route Stops
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'8px 10px 4px' }}>
          {waypoints.map((wp, index) => {
            const geocodedWps = waypoints.filter((w) => w.lat != null);
            const gIdx  = geocodedWps.findIndex((w) => w.id === wp.id);
            const color = markerColor(wp.id, gIdx, geocodedWps.length);
            const isLast = index === waypoints.length - 1;

            return (
              <div
                key={wp.id}
                data-wp-row="true"
                onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOverIndex(index); }}
                onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverIndex(null); }}
                onDrop={(e) => {
                  e.preventDefault();
                  const from = dragIndexRef.current;
                  setDragOverIndex(null);
                  dragIndexRef.current = null;
                  if (from === null || from === index) return;
                  setWaypoints((prev) => {
                    const next = [...prev];
                    const [moved] = next.splice(from, 1);
                    next.splice(index, 0, moved);
                    recalc(next);
                    return next;
                  });
                }}
                style={{ marginBottom:10, position:'relative', borderTop: dragOverIndex === index ? '2px solid #1677ff' : '2px solid transparent', borderRadius:4 }}
              >
                {!isLast && (
                  <div style={{ position:'absolute', left:24, top:22, bottom:-4, width:2, background:'#e8e8e8', zIndex:0 }} />
                )}
                <div style={{ display:'flex', alignItems:'flex-start', gap:8, position:'relative', zIndex:1 }}>
                  <div
                    draggable
                    onDragStart={(e) => {
                      dragIndexRef.current = index;
                      e.dataTransfer.effectAllowed = 'move';
                      const row = e.currentTarget.closest('[data-wp-row]') as HTMLElement;
                      if (row) e.dataTransfer.setDragImage(row, 20, 12);
                    }}
                    onDragEnd={() => { dragIndexRef.current = null; setDragOverIndex(null); }}
                    style={{ display:'flex', alignItems:'center', gap:3, flexShrink:0, marginTop:3, cursor:'grab', userSelect:'none' }}
                  >
                    <HolderOutlined style={{ color:'#bfbfbf', fontSize:11 }} />
                    <div style={{ width:18, height:18, borderRadius:'50%', background:color, color:'#fff', fontSize:9, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }}>
                      {index + 1}
                    </div>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:3 }}>
                      <span style={{ fontSize:10, fontWeight:600, color:'#595959', textTransform:'uppercase', letterSpacing:0.3 }}>
                        {wpLabel(wp.id, index)}
                      </span>
                      {!wp.locked && (
                        <button onClick={() => handleRemove(wp.id)} style={{ border:'none', background:'none', cursor:'pointer', color:'#ff7875', padding:'0 2px', fontSize:11 }} title="Remove">?</button>
                      )}
                    </div>
                    <AutoComplete
                      value={wp.address}
                      options={(searchOptions[wp.id] || []).map((o) => ({ value:o.value, label:o.label, lat:o.lat, lng:o.lng }))}
                      onSearch={(val) => handleSearch(wp.id, val)}
                      onSelect={(val, opt) => handleSelect(wp.id, val, opt as unknown as SearchOption)}
                      style={{ width:'100%' }}
                      size="small"
                    >
                      <Input
                        placeholder={wp.id === 'origin' ? 'Your location�' : 'Search address�'}
                        size="small"
                        style={{ fontSize:11, background: wp.lat ? '#f6ffed' : '#fff', borderColor: wp.lat ? '#b7eb8f' : undefined }}
                        suffix={wp.lat ? <span style={{ color:'#52c41a', fontSize:9 }}>?</span> : undefined}
                      />
                    </AutoComplete>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ padding:'6px 10px', borderTop:'1px solid #f0f0f0', flexShrink:0 }}>
          <Button size="small" icon={<PlusOutlined />} onClick={handleAddStop} type="dashed" style={{ width:'100%', fontSize:11 }}>
            Add Stop
          </Button>
        </div>

        <div style={{ padding:'4px 10px 2px', flexShrink:0 }}>
          <Button
            size="small"
            icon={<GlobalOutlined />}
            onClick={handleOpenGoogleMaps}
            style={{ width:'100%', fontSize:11, color:'#1677ff', borderColor:'#91caff', background:'#e6f4ff' }}
          >
            Open in Google Maps
          </Button>
        </div>

        <div style={{ padding:'8px 10px', borderTop:'1px solid #e8e8e8', background:'#fff', flexShrink:0 }}>
          {routeResult && (routeResult.miles > 0 || routeResult.minutes > 0) && (
            <div style={{ fontSize:11, marginBottom:7, display:'flex', gap:16, color:'#595959' }}>
              <div><Text type="secondary">Distance </Text><strong>{Math.round(routeResult.miles)} mi</strong></div>
              <div><Text type="secondary">Time </Text><strong>{fmtTime(routeResult.minutes)}</strong></div>
            </div>
          )}
          <Button size="small" type="primary" loading={isCalculating} icon={<ReloadOutlined />} onClick={handleCalculate} style={{ width:'100%', fontSize:11 }} disabled={geocodedCount2 < 2}>
            {isCalculating ? 'Calculating�' : 'Recalculate Route'}
          </Button>
          <div style={{ fontSize:10, color:'#bfbfbf', marginTop:4, textAlign:'center' }}>
            {geocodedCount2 >= 2 ? 'Drag rows to reorder stops' : 'Set at least 2 stops'}
          </div>
        </div>
      </div>

      {/* RIGHT: Map � overflow:hidden here is safe (clips map chrome, not markers outside canvas) */}
      <div style={{ flex:1, position:'relative', minWidth:0, borderRadius:'0 6px 6px 0', overflow:'hidden' }}>
        {!mapReady && (
          <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'#f0f5ff', gap:8, zIndex:1 }}>
            <Spin /><Text type="secondary" style={{ fontSize:11 }}>Loading map�</Text>
          </div>
        )}
        <div ref={mapContainerRef} style={{ width:'100%', height:'100%' }} />
      </div>
    </div>
  );
};

export default LoadRouteMap;
