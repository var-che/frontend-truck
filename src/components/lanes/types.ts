export interface Driver {
  id: string;
  driverName: string;
}

export interface Lane {
  id: string;
  origin: {
    city: string;
    state: string;
    zip?: string;
    coordinates?: { lat: number; lng: number };
  };
  destination: {
    city?: string;
    state?: string;
    zip?: string;
    coordinates?: { lat: number; lng: number };
  };
  dateRange: [string, string];
  weight: number;
  driverIds: string[];
  source?: 'DAT' | 'MANUAL' | 'SYLECTUS';
  lastRefreshed?: string;
  datQueryId?: string;
  sylectusQueryId?: string;
  resultsCount?: number;
  details?: string;
  searchModuleId?: string;
}
