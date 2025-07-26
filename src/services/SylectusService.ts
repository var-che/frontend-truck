import {
  LoadBoardService,
  LoadBoardProvider,
  LoadBoardSearchData,
  LoadBoardSearchResult,
} from '../types/loadboard';
import { SearchState } from '../hooks/useSearchState';

export class SylectusService implements LoadBoardService {
  provider = LoadBoardProvider.SYLECTUS;
  name = 'Sylectus';
  isEnabled = true;

  transformSearchState(searchState: SearchState): LoadBoardSearchData {
    return {
      origin: searchState.origin
        ? `${searchState.origin.city}, ${searchState.origin.state}`
        : undefined,
      destination: searchState.destination
        ? `${searchState.destination.city}, ${searchState.destination.state}`
        : undefined,
      startDate: searchState.dateRange[0]
        ? searchState.dateRange[0].format('YYYY-MM-DD')
        : undefined,
      endDate: searchState.dateRange[1]
        ? searchState.dateRange[1].format('YYYY-MM-DD')
        : undefined,
      originStates: searchState.originStates,
      destinationStates: searchState.destinationStates,
    };
  }

  async search(
    searchData: LoadBoardSearchData,
  ): Promise<LoadBoardSearchResult> {
    try {
      console.log('Sylectus Search data:', searchData);

      // TODO: Implement actual Sylectus API call here
      // For now, simulate the search
      await new Promise((resolve) => setTimeout(resolve, 2000));

      return {
        success: true,
        message: 'Search executed successfully on Sylectus',
        data: {
          provider: this.provider,
          searchData,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('Sylectus search error:', error);
      return {
        success: false,
        message: 'Failed to search on Sylectus. Please try again.',
      };
    }
  }
}
