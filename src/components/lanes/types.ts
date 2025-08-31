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
  source?: 'DAT' | 'MANUAL' | 'SYLECTUS' | 'COMBINED';
  lastRefreshed?: string;
  // Backend query IDs (for refresh operations)
  datQueryId?: string; // DAT's internal query ID (e.g., "LLF6RT29")
  sylectusQueryId?: string; // Sylectus's internal query ID
  // Frontend search module IDs (for linking to search results)
  datSearchModuleId?: string; // Frontend search module ID for DAT
  sylectusSearchModuleId?: string; // Frontend search module ID for Sylectus
  datResultsCount?: number;
  sylectusResultsCount?: number;
  resultsCount?: number; // Total combined results
  details?: string;
  searchModuleId?: string; // Legacy field, kept for backwards compatibility
}
