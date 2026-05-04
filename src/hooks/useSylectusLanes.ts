import { useState, useEffect, useRef, useCallback } from 'react';
import { SylectusLoad, SylectusSearchParams } from '../types/sylectus';

export interface SylectusLane {
  id: string;
  label: string; // e.g. "Truck 1"
  searchParams: SylectusSearchParams;
  originDisplay: string; // display string for the autocomplete input
  destDisplay: string;
  loads: SylectusLoad[];
  newLoadIds: Set<string>; // IDs that appeared since last refresh
  newCount: number;
  lastRefresh: string | null;
  isLoading: boolean;
  error: string | null;
  totalRecords: number;
}

const LANE_STORAGE_KEY = 'sylectus_lanes_v1';

function generateLaneId() {
  return `lane_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function defaultLane(overrides: Partial<SylectusLane> = {}): SylectusLane {
  return {
    id: generateLaneId(),
    label: 'New Search',
    searchParams: {
      fromCity: '',
      fromState: '',
      toCity: '',
      toState: '',
      miles: 150,
      fromDate: new Date().toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
      }),
      toDate: new Date().toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
      }),
      loadTypes: [],
      freight: 'Both',
      maxWeight: '',
    },
    originDisplay: '',
    destDisplay: '',
    loads: [],
    newLoadIds: new Set(),
    newCount: 0,
    lastRefresh: null,
    isLoading: false,
    error: null,
    totalRecords: 0,
    ...overrides,
  };
}

function serializeLanes(lanes: SylectusLane[]) {
  return JSON.stringify(
    lanes.map((l) => ({
      ...l,
      newLoadIds: [],
      newCount: 0,
      isLoading: false,
      error: null,
    })),
  );
}

function deserializeLanes(raw: string): SylectusLane[] {
  try {
    const parsed = JSON.parse(raw) as any[];
    return parsed.map((l) => ({ ...defaultLane(), ...l, newLoadIds: new Set() }));
  } catch {
    return [];
  }
}

export function useSylectusLanes(
  sendMessageToExtension: ((msg: any) => Promise<any>) | null,
  refreshIntervalSeconds: number = 15,
) {
  const [lanes, setLanes] = useState<SylectusLane[]>(() => {
    const stored = localStorage.getItem(LANE_STORAGE_KEY);
    if (stored) {
      const deserialized = deserializeLanes(stored);
      if (deserialized.length > 0) return deserialized;
    }
    return [defaultLane({ label: 'Truck 1' })];
  });

  const lanesRef = useRef(lanes);
  lanesRef.current = lanes;

  // Persist to localStorage whenever lanes change (excluding transient state)
  useEffect(() => {
    localStorage.setItem(LANE_STORAGE_KEY, serializeLanes(lanes));
  }, [lanes]);

  const updateLane = useCallback(
    (id: string, updater: (lane: SylectusLane) => Partial<SylectusLane>) => {
      setLanes((prev) =>
        prev.map((l) => (l.id === id ? { ...l, ...updater(l) } : l)),
      );
    },
    [],
  );

  const addLane = useCallback(() => {
    const count = lanesRef.current.length + 1;
    setLanes((prev) => [...prev, defaultLane({ label: `Truck ${count}` })]);
  }, []);

  const removeLane = useCallback((id: string) => {
    setLanes((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const updateSearchParams = useCallback(
    (id: string, params: SylectusSearchParams, originDisplay: string = '', destDisplay: string = '') => {
      updateLane(id, () => ({ searchParams: params, originDisplay, destDisplay }));
    },
    [updateLane],
  );

  const renameLane = useCallback(
    (id: string, label: string) => {
      updateLane(id, () => ({ label }));
    },
    [updateLane],
  );

  const clearNewBadge = useCallback(
    (id: string) => {
      updateLane(id, () => ({ newLoadIds: new Set(), newCount: 0 }));
    },
    [updateLane],
  );

  const markLoadSeen = useCallback(
    (laneId: string, loadId: string) => {
      updateLane(laneId, (lane) => {
        if (!lane.newLoadIds.has(loadId)) return {};
        const newLoadIds = new Set(lane.newLoadIds);
        newLoadIds.delete(loadId);
        return { newLoadIds, newCount: newLoadIds.size };
      });
    },
    [updateLane],
  );

  const searchLane = useCallback(
    async (id: string, overrideParams?: SylectusSearchParams) => {
      const lane = lanesRef.current.find((l) => l.id === id);
      if (!lane || !sendMessageToExtension) return;

      const sp = overrideParams ?? lane.searchParams;
      updateLane(id, () => ({ isLoading: true, error: null }));

      try {
        const today = new Date().toLocaleDateString('en-US', {
          month: '2-digit',
          day: '2-digit',
          year: 'numeric',
        });
        const message = {
          type: 'SYLECTUS_SEARCH',
          params: {
            fromCity: sp.fromCity.toLowerCase(),
            fromState: sp.fromState,
            toCity: (sp.toCity || '').toLowerCase(),
            toState: sp.toState || '',
            miles: sp.miles || 150,
            fromDate: sp.fromDate || today,
            toDate: sp.toDate || sp.fromDate || today,
            loadTypes: sp.loadTypes || [],
            maxWeight: sp.maxWeight || '',
            minCargo: sp.minCargo || '',
            maxCargo: sp.maxCargo || '',
            freight: sp.freight || 'Both',
            refreshRate: 0,
          },
        };

        const response = await sendMessageToExtension(message);

        if (response?.success && response?.loads) {
          const newLoads: SylectusLoad[] = response.loads;
          const existingIds = new Set(lane.loads.map((l) => l.id));
          const newIds = new Set(
            newLoads.filter((l) => !existingIds.has(l.id)).map((l) => l.id),
          );

          updateLane(id, (prev) => ({
            loads: newLoads,
            totalRecords: response.totalRecords ?? newLoads.length,
            lastRefresh: new Date().toLocaleTimeString(),
            isLoading: false,
            newLoadIds: newIds,
            newCount: prev.lastRefresh === null ? 0 : newIds.size, // no badge on first load
          }));
        } else {
          throw new Error(response?.error || response?.message || 'No data returned');
        }
      } catch (err) {
        updateLane(id, () => ({
          isLoading: false,
          error: err instanceof Error ? err.message : 'Search failed',
        }));
      }
    },
    [sendMessageToExtension, updateLane],
  );

  // Auto-refresh all lanes that have valid search params
  const intervalsRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  useEffect(() => {
    // Clear existing intervals
    intervalsRef.current.forEach((t) => clearInterval(t));
    intervalsRef.current.clear();

    lanes.forEach((lane) => {
      if (!lane.searchParams.fromCity || !lane.searchParams.fromState) return;

      const timer = setInterval(() => {
        searchLane(lane.id);
      }, refreshIntervalSeconds * 1000);

      intervalsRef.current.set(lane.id, timer);
    });

    return () => {
      intervalsRef.current.forEach((t) => clearInterval(t));
      intervalsRef.current.clear();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lanes.map((l) => l.id).join(','), refreshIntervalSeconds, searchLane]);

  return {
    lanes,
    addLane,
    removeLane,
    updateSearchParams,
    renameLane,
    searchLane,
    clearNewBadge,
    markLoadSeen,
  };
}
