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
      // Try to get search criteria from either searchCriteria or searchData (depending on service)
      const searchCriteria = data.searchCriteria || data.searchData || {};
      console.log(`🔍 Search criteria:`, searchCriteria);

      // Get the actual results count from the response structure
      let resultsCount = data.resultsFound || 0; // For DAT, check the rawResponse structure for actual match count
      if (
        source === 'DAT' &&
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

        console.log(`🎯 Final results count for DAT: ${resultsCount}`);
      }

      // Extract origin and destination, handling both object and string formats
      let originCity = '';
      let originState = '';
      let destinationCity = '';
      let destinationState = '';

      // Handle origin - could be object or string
      if (typeof searchCriteria.origin === 'string') {
        // Format: "Chicago, IL"
        const originParts = searchCriteria.origin
          .split(',')
          .map((s: string) => s.trim());
        originCity = originParts[0] || '';
        originState = originParts[1] || '';
      } else if (
        searchCriteria.origin &&
        typeof searchCriteria.origin === 'object'
      ) {
        // Format: { city: "Chicago", state: "IL" }
        originCity = searchCriteria.origin.city || '';
        originState = searchCriteria.origin.state || '';
      }

      // Handle destination - could be object or string
      if (typeof searchCriteria.destination === 'string') {
        // Format: "Los Angeles, CA"
        const destParts = searchCriteria.destination
          .split(',')
          .map((s: string) => s.trim());
        destinationCity = destParts[0] || '';
        destinationState = destParts[1] || '';
      } else if (
        searchCriteria.destination &&
        typeof searchCriteria.destination === 'object'
      ) {
        // Format: { city: "Los Angeles", state: "CA" }
        destinationCity = searchCriteria.destination.city || '';
        destinationState = searchCriteria.destination.state || '';
      }

      console.log(`🏙️ Extracted origin: ${originCity}, ${originState}`);
      console.log(
        `🏙️ Extracted destination: ${destinationCity}, ${destinationState}`,
      );

      const newLane: Lane = {
        id: searchModuleId, // Use search module ID as lane ID
        searchModuleId: searchModuleId,
        origin: {
          city: originCity,
          state: originState,
        },
        destination: {
          city: destinationCity,
          state: destinationState,
        },
        dateRange: [
          searchCriteria.startDate || new Date().toISOString().split('T')[0],
          searchCriteria.endDate || new Date().toISOString().split('T')[0],
        ],
        weight: searchCriteria.weightPounds || 0,
        driverIds: [],
        source: source,
        resultsCount: resultsCount, // Use the correctly extracted results count
        lastRefreshed: new Date().toISOString(),
        // Add query IDs based on source
        ...(source === 'DAT' && {
          datQueryId: data.datQueryId || data.queryId,
        }),
        ...(source === 'SYLECTUS' && {
          sylectusQueryId: data.sylectusQueryId || data.queryId,
        }),
      };

      setLanes((prevLanes) => {
        // Check if lane with this search module ID already exists
        // Look for lanes that match by ID, searchModuleId, datQueryId, or sylectusQueryId
        const existingLaneIndex = prevLanes.findIndex(
          (lane) =>
            lane.id === searchModuleId ||
            lane.searchModuleId === searchModuleId ||
            (source === 'DAT' && lane.datQueryId === searchModuleId) ||
            (source === 'SYLECTUS' && lane.sylectusQueryId === searchModuleId),
        );

        let updatedLanes: Lane[];

        if (existingLaneIndex >= 0) {
          // Update existing lane
          updatedLanes = prevLanes.map((lane, index) => {
            if (index === existingLaneIndex) {
              return {
                ...lane,
                ...newLane,
                // Preserve the original lane ID
                id: lane.id,
                // Preserve existing driver assignments
                driverIds: lane.driverIds,
                // Update search module ID to match the new search
                searchModuleId: searchModuleId,
                // Merge query IDs if updating
                datQueryId: newLane.datQueryId || lane.datQueryId,
                sylectusQueryId:
                  newLane.sylectusQueryId || lane.sylectusQueryId,
                // Update metadata
                lastRefreshed: new Date().toISOString(),
                resultsCount: newLane.resultsCount || lane.resultsCount,
              };
            }
            return lane;
          });

          console.log(
            `✅ Updated existing lane: ${searchModuleId} (original lane ID: ${prevLanes[existingLaneIndex].id})`,
          );
        } else {
          // Add new lane
          updatedLanes = [...prevLanes, newLane];
          console.log(`✅ Added new lane: ${searchModuleId}`);
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
