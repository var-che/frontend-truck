export interface Lane {
  id: string;
  origin: {
    city: string;
    state: string;
  };
  destination: {
    city: string;
    state: string;
  };
  dateRange: [string, string];
  weight: number;
  driverIds: string[];
  source?: 'DAT' | 'MANUAL';
}
