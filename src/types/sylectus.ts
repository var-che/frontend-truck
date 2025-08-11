// Types for Sylectus load board integration
export interface SylectusSearchParams {
  fromCity: string;
  fromState: string;
  toCity?: string;
  toState?: string;
  miles?: number;
  fromDate?: string;
  loadTypes?: string[];
  maxWeight?: string;
  minCargo?: string;
  maxCargo?: string;
  freight?: 'Both' | '3PL' | 'Alliance';
  refreshRate?: number;
}

export interface SylectusLoad {
  id: string;
  postedBy: string;
  refNo: string;
  orderNo: string;
  loadType: string;
  brokerMC: string;
  amount?: string;
  pickupLocation: {
    city: string;
    state: string;
    zipCode?: string;
    fullAddress: string;
  };
  pickupDateTime: string;
  deliveryLocation: {
    city: string;
    state: string;
    zipCode?: string;
    fullAddress: string;
  };
  deliveryDateTime: string;
  postDateTime: string;
  expiresOn: string;
  vehicleSize: string;
  miles: number;
  pieces: number;
  weight: number;
  notes?: string;
  otherInfo?: string;
  daysToPayCredit?: {
    days?: number;
    score?: string;
  };
  saferUrl?: string;
  bidUrl?: string;
  reviewData?: string;
}

export interface SylectusSearchResponse {
  success: boolean;
  loads: SylectusLoad[];
  totalRecords: number;
  lastRefresh: string;
  searchParams: SylectusSearchParams;
  error?: string;
}

export interface SylectusSearchRequest {
  type: 'SYLECTUS_SEARCH';
  params: SylectusSearchParams;
}

export interface SylectusSearchResult {
  type: 'SYLECTUS_SEARCH_RESULT';
  data: SylectusSearchResponse;
}

// Load type options for Sylectus
export const SYLECTUS_LOAD_TYPES = [
  { value: 'cb_pt1', label: 'Expedited Load' },
  { value: 'cb_pt2', label: 'Expedited Truck Load' },
  { value: 'cb_pt3', label: 'Truckload' },
  { value: 'cb_pt4', label: 'Less Than Truckload' },
  { value: 'cb_pt5', label: 'Truckload/LTL' },
  { value: 'cb_pt6', label: 'Courier type work' },
  { value: 'cb_pt7', label: 'Flatbed' },
  { value: 'cb_pt8', label: 'Dump Trailer' },
  { value: 'cb_pt9', label: 'Reefer' },
  { value: 'cb_pt10', label: 'Small Straight' },
  { value: 'cb_pt11', label: 'Large Straight' },
  { value: 'cb_pt12', label: 'Lane/Project RFQ' },
  { value: 'cb_pt13', label: 'Air Freight' },
  { value: 'cb_pt14', label: 'Air Charter' },
  { value: 'cb_pt15', label: 'Other' },
  { value: 'cb_pt16', label: 'Climate Control' },
  { value: 'cb_pt17', label: 'Cargo Van' },
  { value: 'cb_pt18', label: 'Sprinter' },
] as const;

// State options for Sylectus (subset of most common US states)
export const SYLECTUS_STATES = [
  { value: 'A1', label: 'Any U.S. State' },
  { value: 'AL', label: 'Alabama' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MO', label: 'Missouri' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WI', label: 'Wisconsin' },
] as const;
