export interface LoadBoardSearchData {
  origin?: {
    city?: string;
    state?: string;
    name?: string;
  };
  destination?: {
    city?: string;
    state?: string;
    name?: string;
  } | null;
  weightPounds?: number;
  startDate?: string;
  endDate?: string;
  originStates?: string[];
  destinationStates?: string[];
  searchModuleId?: string;
}

export interface LoadBoardSearchResult {
  success: boolean;
  message: string;
  data?: {
    timestamp: string;
    mode?: 'simulation' | 'extension';
    loads?: any[];
    searchId?: string;
    [key: string]: any; // Allow additional properties
  };
  error?: string;
}

export interface LoadBoardError {
  message: string;
  code?: string;
  details?: any;
}

export type LoadBoardPlatform = 'DAT' | 'SYLECTUS';

export interface LoadBoardResponse {
  platform: LoadBoardPlatform;
  result?: LoadBoardSearchResult;
  error?: LoadBoardError;
}

export enum LoadBoardProvider {
  DAT = 'DAT',
  SYLECTUS = 'SYLECTUS',
}

export interface LoadBoardService {
  provider: LoadBoardProvider;
  name: string;
  isEnabled: boolean;
  transformSearchState(searchState: any): LoadBoardSearchData;
  search(searchData: LoadBoardSearchData): Promise<LoadBoardSearchResult>;
}

export interface LoadBoardSubmissionState {
  isPosting: boolean;
  results: Record<LoadBoardProvider, LoadBoardSearchResult | null>;
  errors: Record<LoadBoardProvider, string | null>;
}
