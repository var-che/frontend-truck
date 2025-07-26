import { SearchState } from '../hooks/useSearchState';

export enum LoadBoardProvider {
  DAT = 'DAT',
  SYLECTUS = 'SYLECTUS',
}

export interface LoadBoardSearchData {
  origin?: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
  originStates: string[];
  destinationStates: string[];
}

export interface LoadBoardSearchResult {
  success: boolean;
  message?: string;
  data?: any;
}

export interface LoadBoardService {
  provider: LoadBoardProvider;
  name: string;
  isEnabled: boolean;
  search(searchData: LoadBoardSearchData): Promise<LoadBoardSearchResult>;
  transformSearchState(searchState: SearchState): LoadBoardSearchData;
}

export interface LoadBoardSubmissionState {
  isPosting: boolean;
  results: Record<LoadBoardProvider, LoadBoardSearchResult | null>;
  errors: Record<LoadBoardProvider, string | null>;
}
