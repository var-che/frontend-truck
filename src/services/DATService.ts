import {
  LoadBoardService,
  LoadBoardProvider,
  LoadBoardSearchData,
  LoadBoardSearchResult,
} from '../types/loadboard';
import { SearchState } from '../hooks/useSearchState';

export class DATService implements LoadBoardService {
  provider = LoadBoardProvider.DAT;
  name = 'DAT Power';
  isEnabled = true;

  private sendSearchMessage?: (searchData: any) => Promise<any>;

  constructor(sendSearchMessage?: (searchData: any) => Promise<any>) {
    this.sendSearchMessage = sendSearchMessage;
  }

  transformSearchState(searchState: SearchState): LoadBoardSearchData {
    return {
      origin: searchState.origin
        ? {
            city: searchState.origin.city,
            state: searchState.origin.state,
            name: `${searchState.origin.city}, ${searchState.origin.state}`,
          }
        : undefined,
      destination: searchState.destination
        ? {
            city: searchState.destination.city,
            state: searchState.destination.state,
            name: `${searchState.destination.city}, ${searchState.destination.state}`,
          }
        : null,
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

  /**
   * Perform a search and return the result (used by hooks for auto-adding lanes)
   */
  async performSearch(
    searchData: LoadBoardSearchData,
  ): Promise<LoadBoardSearchResult> {
    return this.search(searchData);
  }

  async search(
    searchData: LoadBoardSearchData,
  ): Promise<LoadBoardSearchResult> {
    try {
      console.log('DAT Search data:', searchData);

      // Send data to the extension if messaging is available
      if (this.sendSearchMessage) {
        try {
          // Format the message for the extension
          const extensionResponse = await this.sendSearchMessage({
            type: 'DAT_SEARCH',
            data: searchData,
            timestamp: Date.now(),
          });
          console.log('Extension response:', extensionResponse);

          // If extension successfully processed the search
          if (extensionResponse?.success) {
            return {
              success: true,
              message:
                extensionResponse.message ||
                'Search executed successfully on DAT via extension',
              data: {
                ...extensionResponse.data, // Include all extension response data
                searchModuleId: searchData.searchModuleId, // Ensure search module ID is preserved
                provider: this.provider,
                originalSearchData: searchData,
                timestamp: new Date().toISOString(),
              },
            };
          } else if (extensionResponse?.error) {
            throw new Error(extensionResponse.error);
          }
        } catch (extensionError) {
          console.error('Extension communication failed:', extensionError);
          // Continue with fallback behavior below
        }
      }

      // Fallback: simulate the search if extension is not available
      console.log('Using fallback DAT search simulation');
      await new Promise((resolve) => setTimeout(resolve, 1500));

      return {
        success: true,
        message: 'Search executed successfully on DAT (simulated)',
        data: {
          searchModuleId: searchData.searchModuleId, // Include search module ID
          provider: this.provider,
          originalSearchData: searchData,
          timestamp: new Date().toISOString(),
          mode: 'simulation',
          // Mock some search criteria for the fallback
          searchCriteria: {
            origin: { city: 'Mock City', state: 'TX' },
            destination: { city: 'Mock Destination', state: 'CA' },
            startDate: searchData.startDate,
            endDate: searchData.endDate,
          },
          resultsFound: 0,
          datQueryId: `mock_${Date.now()}`,
        },
      };
    } catch (error) {
      console.error('DAT search error:', error);
      return {
        success: false,
        message: `Failed to search on DAT: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      };
    }
  }
}
