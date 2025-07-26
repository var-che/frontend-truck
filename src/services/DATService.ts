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
      console.log('DAT Search data:', searchData);

      // Send data to the extension if messaging is available
      if (this.sendSearchMessage) {
        try {
          const extensionResponse = await this.sendSearchMessage(searchData);
          console.log('Extension response:', extensionResponse);

          // If extension successfully processed the search
          if (extensionResponse?.success) {
            return {
              success: true,
              message: 'Search executed successfully on DAT via extension',
              data: {
                provider: this.provider,
                searchData,
                timestamp: new Date().toISOString(),
                extensionResponse,
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
          provider: this.provider,
          searchData,
          timestamp: new Date().toISOString(),
          mode: 'simulation',
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
