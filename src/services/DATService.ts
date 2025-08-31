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
            zip: searchState.origin.zip, // Include ZIP code for DAT searches
          }
        : undefined,
      destination: searchState.destination
        ? {
            city: searchState.destination.city,
            state: searchState.destination.state,
            name: `${searchState.destination.city}, ${searchState.destination.state}`,
            zip: searchState.destination.zip, // Include destination ZIP too
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
          // Check if we have ZIP-based search data (origin with ZIP)
          const hasOriginZip = searchData.origin?.zip;

          if (hasOriginZip && searchData.origin && searchData.origin.zip) {
            console.log(
              '🎯 Using ZIP-based DAT search with ZIP:',
              searchData.origin.zip,
            );

            // Use the ZIP-based search approach (same as DatTestPage)
            const zipSearchResult = await this.performZipBasedSearch(
              searchData.origin.zip,
              searchData,
            );

            return zipSearchResult;
          } else {
            console.log('📝 Using traditional DAT search approach');

            // Format the message for the extension (traditional approach)
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

  /**
   * Perform ZIP-based search using the same approach as DatTestPage
   * @param zipCode The ZIP code to search with
   * @param searchData The original search data for context
   */
  private async performZipBasedSearch(
    zipCode: string,
    searchData: LoadBoardSearchData,
  ): Promise<LoadBoardSearchResult> {
    try {
      console.log('🎯 Starting ZIP-based DAT search with ZIP:', zipCode);

      // Step 1: Search for city suggestions using the ZIP code
      console.log('📍 Step 1: Searching for city suggestions...');
      const citySearchResult = await this.sendSearchMessage!({
        type: 'DAT_TEST_ACTION',
        action: 'SIMPLE_CITY_SEARCH',
        data: {
          lookupTerm: zipCode,
        },
      });

      console.log('🔍 City search result:', citySearchResult);

      if (
        !citySearchResult?.success ||
        !citySearchResult?.result?.results?.data?.locationSuggestions
      ) {
        throw new Error('Failed to get city suggestions for ZIP code');
      }

      const locationSuggestions =
        citySearchResult.result.results.data.locationSuggestions;

      if (locationSuggestions.length === 0) {
        throw new Error(`No cities found for ZIP code: ${zipCode}`);
      }

      // Select the first city suggestion
      const firstCity = locationSuggestions[0];
      console.log('🏙️ Selected city:', firstCity);

      // Step 2: Perform dynamic lane posting with the selected city
      console.log('🚛 Step 2: Performing lane posting with selected city...');

      // Use the startDate from search data instead of current date
      const loadDate = searchData.startDate; // Use the date from your form!
      console.log('📅 Using search date for lane posting:', loadDate);

      const laneData = {
        fromZip: zipCode,
        fromCity: firstCity.city,
        fromState: firstCity.state,
        longitude: firstCity.longitude,
        latitude: firstCity.latitude,
        equipmentType: 'VAN',
        loadDate: loadDate, // Use your selected date!
        maxLength: 26,
        maxWeight: 10000,
        maxOriginDeadheadMiles: 150,
      };

      console.log('🚛 Lane data being sent:', laneData);
      console.log('🔍 DEBUG: ZIP from search:', zipCode);
      console.log('🔍 DEBUG: City from suggestions:', firstCity);
      console.log(
        '🔍 DEBUG: Full laneData object:',
        JSON.stringify(laneData, null, 2),
      );

      const lanePostingResult = await this.sendSearchMessage!({
        type: 'DAT_TEST_ACTION',
        action: 'LANE_POSTING_TEST',
        data: {
          laneData: laneData,
        },
      });

      console.log('✅ ZIP-based lane posting completed:', lanePostingResult);

      if (lanePostingResult?.success) {
        return {
          success: true,
          message: `ZIP-based search completed successfully for ${firstCity.name}!`,
          data: {
            searchModuleId: searchData.searchModuleId,
            provider: this.provider,
            originalSearchData: searchData,
            timestamp: new Date().toISOString(),
            zipCode: zipCode,
            selectedCity: firstCity,
            extensionResult: lanePostingResult,
          },
        };
      } else {
        throw new Error('ZIP-based lane posting failed');
      }
    } catch (error) {
      console.error('ZIP-based DAT search error:', error);
      return {
        success: false,
        message: `Failed to perform ZIP-based DAT search: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      };
    }
  }
}
