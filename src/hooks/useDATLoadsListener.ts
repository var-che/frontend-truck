import { useEffect } from 'react';
import { useChromeMessaging } from './useChromeMessaging';
import { useSearchResults } from '../context/SearchResultsContext';

/**
 * Hook that listens for DAT loads from the extension and adds them to search results
 */
export const useDATLoadsListener = () => {
  const { setDATLoadsCallback } = useChromeMessaging();
  const { addDatResult } = useSearchResults();

  useEffect(() => {
    const handleDATLoads = (
      message: {
        type: 'DAT_LOADS_RECEIVED';
        queryId: string;
        loads: any[];
        matchCount: number;
        timestamp: string;
        provider: string;
      } | null,
    ) => {
      // Check if message is null or missing required properties
      if (!message) {
        console.warn('⚠️ handleDATLoads received null message');
        return;
      }

      if (!message.queryId) {
        console.warn(
          '⚠️ handleDATLoads received message without queryId:',
          message,
        );
        return;
      }

      console.log('🔄 Converting DAT loads to search result format:', {
        queryId: message.queryId,
        loadCount: message.loads?.length || 0,
        matchCount: message.matchCount,
      });

      // Create a LoadBoardSearchResult from the DAT loads data
      const datResult = {
        success: true,
        provider: 'DAT' as const,
        message: `Found ${message.matchCount} matches (${
          message.loads?.length || 0
        } loads loaded)`,
        data: {
          searchModuleId: message.queryId, // Use DAT's queryId as searchModuleId
          queryId: message.queryId,
          timestamp: message.timestamp,
          loads: message.loads || [],
          totalRecords: message.matchCount,
          // Add some reasonable defaults for DAT search data
          origin: {
            city: '',
            state: '',
            coordinates: { lat: 0, lng: 0 },
          },
          destination: {
            city: '',
            state: '',
            coordinates: { lat: 0, lng: 0 },
          },
          distance: 0,
        },
      };

      console.log('✅ Adding DAT loads as search result:', datResult);
      addDatResult(datResult);
    };

    // Register the callback
    setDATLoadsCallback(handleDATLoads);

    // Cleanup - unregister callback
    return () => {
      setDATLoadsCallback(null);
    };
  }, [setDATLoadsCallback, addDatResult]);
};
