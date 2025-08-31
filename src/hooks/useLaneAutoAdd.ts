import { useEffect, useCallback } from 'react';
import { LoadBoardSearchResult } from '../types/loadboard';
import { Lane } from '../components/lanes/types';

interface UseLaneAutoAddProps {
  setLanes: React.Dispatch<React.SetStateAction<Lane[]>>;
  datResult: LoadBoardSearchResult | null;
  sylectusResult: LoadBoardSearchResult | null;
}

/**
 * Custom hook to automatically add successful search results to lanes
 */
export const useLaneAutoAdd = ({
  setLanes,
  datResult,
  sylectusResult,
}: UseLaneAutoAddProps) => {
  // Helper function to generate a unique lane ID based on origin/destination
  const generateUnifiedLaneId = (
    originCity: string,
    originState: string,
    destinationCity: string,
    destinationState: string,
    originZip?: string,
    destinationZip?: string,
  ) => {
    const origin = `${originCity}_${originState}${
      originZip ? `_${originZip}` : ''
    }`;
    const destination =
      destinationCity && destinationState
        ? `${destinationCity}_${destinationState}${
            destinationZip ? `_${destinationZip}` : ''
          }`
        : 'anywhere';
    return `lane_${origin}_to_${destination}`
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '');
  };

  const addSearchResultToLanes = useCallback(
    (searchResult: LoadBoardSearchResult, source: 'DAT' | 'SYLECTUS') => {
      console.log(
        `🎯 addSearchResultToLanes called for ${source}:`,
        searchResult,
      );

      if (!searchResult.success || !searchResult.data) {
        console.log(
          `❌ Search result not successful or missing data:`,
          searchResult,
        );
        return;
      }

      const { data } = searchResult;
      const searchModuleId = data.searchModuleId;

      console.log(`🆔 Search Module ID from result:`, searchModuleId);
      console.log(`📋 Full search data:`, data);

      if (!searchModuleId) {
        console.warn(
          'Search result missing searchModuleId, cannot add to lanes',
        );
        console.log('Available data keys:', Object.keys(data));
        return;
      }

      console.log(`🎯 Adding ${source} search result to lanes:`, data);

      // Extract search criteria and actual results count
      // For extracting origin/destination data, prefer originalSearchData over searchCriteria
      // originalSearchData contains the actual user selections with proper city/state/zip format
      const originalSearchData = data.originalSearchData || {};
      const searchCriteria = data.searchCriteria || data.searchData || {};
      console.log(`📋 Original search data:`, originalSearchData);
      console.log(`🔍 Search criteria:`, searchCriteria);

      // Get the actual results count from the response structure
      let resultsCount = data.resultsFound || 0;

      if (source === 'DAT') {
        // For DAT, check the rawResponse structure for actual match count
        if (
          data.rawResponse?.data?.createAssetAndGetMatches?.assetMatchesBody
        ) {
          const assetMatchesBody =
            data.rawResponse.data.createAssetAndGetMatches.assetMatchesBody;

          console.log(`🔍 DAT assetMatchesBody structure:`, assetMatchesBody);

          // Try to get count from matchCounts.totalCount or matches array length
          if (assetMatchesBody.matchCounts?.totalCount !== undefined) {
            resultsCount = assetMatchesBody.matchCounts.totalCount;
            console.log(
              `📊 Found ${resultsCount} results from matchCounts.totalCount`,
            );
          } else if (assetMatchesBody.matches?.length !== undefined) {
            resultsCount = assetMatchesBody.matches.length;
            console.log(
              `📊 Found ${resultsCount} results from matches array length`,
            );
          }
        }
        console.log(`🎯 Final results count for DAT: ${resultsCount}`);
      } else if (source === 'SYLECTUS') {
        // For Sylectus, use totalRecords or loads array length
        if (data.totalRecords !== undefined) {
          resultsCount = data.totalRecords;
          console.log(
            `📊 Found ${resultsCount} results from Sylectus totalRecords`,
          );
        } else if (data.loads?.length !== undefined) {
          resultsCount = data.loads.length;
          console.log(
            `📊 Found ${resultsCount} results from Sylectus loads array length`,
          );
        }
        console.log(`🎯 Final results count for Sylectus: ${resultsCount}`);
      }

      // Extract origin and destination, preferring originalSearchData over searchCriteria
      // originalSearchData contains the actual user selections from the UI
      let originCity = '';
      let originState = '';
      let destinationCity = '';
      let destinationState = '';

      // First try to get origin from originalSearchData (user's actual selection)
      if (
        originalSearchData.origin &&
        typeof originalSearchData.origin === 'object'
      ) {
        originCity = originalSearchData.origin.city || '';
        originState = originalSearchData.origin.state || '';
        console.log(
          `✅ Using origin from originalSearchData: ${originCity}, ${originState}`,
        );
      }
      // Fallback to searchCriteria if originalSearchData is not available
      else if (typeof searchCriteria.origin === 'string') {
        // Format: "Chicago, IL"
        const originParts = searchCriteria.origin
          .split(',')
          .map((s: string) => s.trim());
        originCity = originParts[0] || '';
        originState = originParts[1] || '';
        console.log(
          `⚠️ Using origin from searchCriteria (string): ${originCity}, ${originState}`,
        );
      } else if (
        searchCriteria.origin &&
        typeof searchCriteria.origin === 'object'
      ) {
        // Format: { city: "Chicago", state: "IL" }
        originCity = searchCriteria.origin.city || '';
        originState = searchCriteria.origin.state || '';
        console.log(
          `⚠️ Using origin from searchCriteria (object): ${originCity}, ${originState}`,
        );
      }

      // First try to get destination from originalSearchData (user's actual selection)
      if (
        originalSearchData.destination &&
        typeof originalSearchData.destination === 'object'
      ) {
        destinationCity = originalSearchData.destination.city || '';
        destinationState = originalSearchData.destination.state || '';
        console.log(
          `✅ Using destination from originalSearchData: ${destinationCity}, ${destinationState}`,
        );
      }
      // Fallback to searchCriteria for destination
      else if (typeof searchCriteria.destination === 'string') {
        // Format: "Los Angeles, CA"
        const destParts = searchCriteria.destination
          .split(',')
          .map((s: string) => s.trim());
        destinationCity = destParts[0] || '';
        destinationState = destParts[1] || '';
        console.log(
          `⚠️ Using destination from searchCriteria (string): ${destinationCity}, ${destinationState}`,
        );
      } else if (
        searchCriteria.destination &&
        typeof searchCriteria.destination === 'object'
      ) {
        // Format: { city: "Los Angeles", state: "CA" }
        destinationCity = searchCriteria.destination.city || '';
        destinationState = searchCriteria.destination.state || '';
        console.log(
          `⚠️ Using destination from searchCriteria (object): ${destinationCity}, ${destinationState}`,
        );
      }

      console.log(`🏙️ Extracted origin: ${originCity}, ${originState}`);
      console.log(
        `🏙️ Extracted destination: ${destinationCity}, ${destinationState}`,
      );

      // Extract ZIP codes if available from originalSearchData
      const originZip = originalSearchData.origin?.zip || '';
      const destinationZip = originalSearchData.destination?.zip || '';

      if (originZip) {
        console.log(`📍 Origin ZIP: ${originZip}`);
      }
      if (destinationZip) {
        console.log(`📍 Destination ZIP: ${destinationZip}`);
      }

      // Generate unified lane ID based on origin/destination (not search module ID)
      const unifiedLaneId = generateUnifiedLaneId(
        originCity,
        originState,
        destinationCity,
        destinationState,
        originZip,
        destinationZip,
      );

      console.log(`🆔 Generated unified lane ID: ${unifiedLaneId}`);

      const newLane: Lane = {
        id: unifiedLaneId, // Use unified lane ID based on origin/destination
        searchModuleId: searchModuleId,
        origin: {
          city: originCity,
          state: originState,
          ...(originZip && { zip: originZip }), // Include ZIP if available
        },
        destination: {
          city: destinationCity,
          state: destinationState,
          ...(destinationZip && { zip: destinationZip }), // Include ZIP if available
        },
        dateRange: [
          searchCriteria.startDate || new Date().toISOString().split('T')[0],
          searchCriteria.endDate || new Date().toISOString().split('T')[0],
        ],
        weight: searchCriteria.weightPounds || 0,
        driverIds: [],
        source: source, // Will be updated to 'COMBINED' if both sources are present
        resultsCount: resultsCount, // Total combined results
        lastRefreshed: new Date().toISOString(),
        // Add query IDs and results count based on source
        ...(source === 'DAT' && {
          datQueryId: data.searchId || data.datQueryId || data.queryId, // DAT's internal search ID (e.g., "LLF6RT29")
          datSearchModuleId: searchModuleId, // Frontend search module ID for linking to results
          datResultsCount: resultsCount,
        }),
        ...(source === 'SYLECTUS' && {
          sylectusQueryId: data.sylectusQueryId || data.queryId,
          sylectusSearchModuleId: searchModuleId, // Frontend search module ID for linking to results
          sylectusResultsCount: resultsCount,
        }),
      };

      console.log(`🆔 Lane data created with IDs:`, {
        laneId: newLane.id,
        searchModuleId: newLane.searchModuleId,
        datQueryId: newLane.datQueryId,
        sylectusQueryId: newLane.sylectusQueryId,
        datResultsCount: newLane.datResultsCount,
        sylectusResultsCount: newLane.sylectusResultsCount,
      });

      setLanes((prevLanes) => {
        // Find existing lane with the same unified ID (based on origin/destination)
        const existingLaneIndex = prevLanes.findIndex(
          (lane) => lane.id === unifiedLaneId,
        );

        let updatedLanes: Lane[];

        if (existingLaneIndex >= 0) {
          // Update existing unified lane
          const existingLane = prevLanes[existingLaneIndex];

          updatedLanes = prevLanes.map((lane, index) => {
            if (index === existingLaneIndex) {
              // Determine the new source type
              let newSource: 'DAT' | 'SYLECTUS' | 'COMBINED' = source;
              if (source === 'DAT' && existingLane.sylectusQueryId) {
                newSource = 'COMBINED'; // DAT + existing Sylectus
              } else if (source === 'SYLECTUS' && existingLane.datQueryId) {
                newSource = 'COMBINED'; // Sylectus + existing DAT
              }

              // Calculate combined results count
              const datResults =
                source === 'DAT'
                  ? resultsCount
                  : existingLane.datResultsCount || 0;
              const sylectusResults =
                source === 'SYLECTUS'
                  ? resultsCount
                  : existingLane.sylectusResultsCount || 0;
              const combinedResultsCount = datResults + sylectusResults;

              const updatedLane = {
                ...lane,
                ...newLane,
                // Preserve the unified lane ID
                id: unifiedLaneId,
                // Preserve existing driver assignments
                driverIds: lane.driverIds,
                // Update source to reflect combined searches
                source: newSource,
                // Merge query IDs, preserving existing ones and adding new ones
                datQueryId:
                  source === 'DAT'
                    ? newLane.datQueryId || existingLane.datQueryId
                    : existingLane.datQueryId,
                sylectusQueryId:
                  source === 'SYLECTUS'
                    ? newLane.sylectusQueryId || existingLane.sylectusQueryId
                    : existingLane.sylectusQueryId,
                // Merge frontend search module IDs
                datSearchModuleId:
                  source === 'DAT'
                    ? newLane.datSearchModuleId ||
                      existingLane.datSearchModuleId
                    : existingLane.datSearchModuleId,
                sylectusSearchModuleId:
                  source === 'SYLECTUS'
                    ? newLane.sylectusSearchModuleId ||
                      existingLane.sylectusSearchModuleId
                    : existingLane.sylectusSearchModuleId,
                // Update individual results counts
                datResultsCount:
                  source === 'DAT'
                    ? resultsCount
                    : existingLane.datResultsCount,
                sylectusResultsCount:
                  source === 'SYLECTUS'
                    ? resultsCount
                    : existingLane.sylectusResultsCount,
                // Update combined results count
                resultsCount: combinedResultsCount,
                // Update metadata
                lastRefreshed: new Date().toISOString(),
                // Keep the original searchModuleId or update if needed
                searchModuleId: existingLane.searchModuleId || searchModuleId,
              };

              return updatedLane;
            }
            return lane;
          });

          console.log(
            `✅ Updated existing unified lane: ${unifiedLaneId} with ${source} data`,
          );
          console.log(`🆔 Updated lane query IDs:`, {
            datQueryId: updatedLanes[existingLaneIndex].datQueryId,
            sylectusQueryId: updatedLanes[existingLaneIndex].sylectusQueryId,
            source: updatedLanes[existingLaneIndex].source,
            combinedResults: updatedLanes[existingLaneIndex].resultsCount,
          });
        } else {
          // Add new unified lane
          updatedLanes = [...prevLanes, newLane];
          console.log(
            `✅ Created new unified lane: ${unifiedLaneId} for ${source}`,
          );
        }

        // Save to localStorage
        localStorage.setItem('lanes', JSON.stringify(updatedLanes));
        return updatedLanes;
      });
    },
    [setLanes],
  );

  // Listen for DAT search results
  useEffect(() => {
    console.log('🔍 useLaneAutoAdd: DAT result changed:', datResult);
    if (datResult && datResult.success) {
      console.log('✅ useLaneAutoAdd: Adding DAT result to lanes');
      addSearchResultToLanes(datResult, 'DAT');
    } else if (datResult && !datResult.success) {
      console.log('❌ useLaneAutoAdd: DAT result failed:', datResult);
    }
  }, [datResult, addSearchResultToLanes]);

  // Listen for Sylectus search results
  useEffect(() => {
    console.log('🔍 useLaneAutoAdd: Sylectus result changed:', sylectusResult);
    if (sylectusResult && sylectusResult.success) {
      console.log('✅ useLaneAutoAdd: Adding Sylectus result to lanes');
      addSearchResultToLanes(sylectusResult, 'SYLECTUS');
    } else if (sylectusResult && !sylectusResult.success) {
      console.log('❌ useLaneAutoAdd: Sylectus result failed:', sylectusResult);
    }
  }, [sylectusResult, addSearchResultToLanes]);

  return {
    addSearchResultToLanes,
  };
};
