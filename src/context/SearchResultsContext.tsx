import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';
import { LoadBoardSearchResult } from '../types/loadboard';

interface SearchResultsContextType {
  datResults: LoadBoardSearchResult[];
  sylectusResults: LoadBoardSearchResult[];
  addDatResult: (result: LoadBoardSearchResult) => void;
  addSylectusResult: (result: LoadBoardSearchResult) => void;
  clearResults: () => void;
  latestDatResult: LoadBoardSearchResult | null;
  latestSylectusResult: LoadBoardSearchResult | null;
  // New method to get search results by searchModuleId
  getResultBySearchModuleId: (
    searchModuleId: string,
  ) => LoadBoardSearchResult | null;
  // Method to clean up old results (older than 24 hours)
  cleanupOldResults: () => void;
  // Methods to delete specific search results by searchModuleId
  deleteDatResult: (searchModuleId: string) => void;
  deleteSylectusResult: (searchModuleId: string) => void;
  // Method to delete result from any provider by searchModuleId
  deleteResultBySearchModuleId: (searchModuleId: string) => void;
}

const SearchResultsContext = createContext<
  SearchResultsContextType | undefined
>(undefined);

export const SearchResultsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Initialize state from localStorage
  const [datResults, setDatResults] = useState<LoadBoardSearchResult[]>(() => {
    try {
      const savedDatResults = localStorage.getItem('datSearchResults');
      return savedDatResults ? JSON.parse(savedDatResults) : [];
    } catch (error) {
      console.error('Error loading DAT results from localStorage:', error);
      return [];
    }
  });

  const [sylectusResults, setSylectusResults] = useState<
    LoadBoardSearchResult[]
  >(() => {
    try {
      const savedSylectusResults = localStorage.getItem(
        'sylectusSearchResults',
      );
      return savedSylectusResults ? JSON.parse(savedSylectusResults) : [];
    } catch (error) {
      console.error('Error loading Sylectus results from localStorage:', error);
      return [];
    }
  });

  // Save DAT results to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('datSearchResults', JSON.stringify(datResults));
      console.log(
        '💾 Saved DAT results to localStorage:',
        datResults.length,
        'results',
      );
    } catch (error) {
      console.error('Error saving DAT results to localStorage:', error);
    }
  }, [datResults]);

  // Save Sylectus results to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(
        'sylectusSearchResults',
        JSON.stringify(sylectusResults),
      );
      console.log(
        '💾 Saved Sylectus results to localStorage:',
        sylectusResults.length,
        'results',
      );
    } catch (error) {
      console.error('Error saving Sylectus results to localStorage:', error);
    }
  }, [sylectusResults]);

  const addDatResult = useCallback((result: LoadBoardSearchResult) => {
    console.log('📊 SearchResultsContext: Adding DAT result:', result);
    setDatResults((prev) => {
      // Check if a result with the same searchModuleId already exists
      const existingIndex = prev.findIndex(
        (existing) =>
          existing.data?.searchModuleId === result.data?.searchModuleId,
      );

      if (existingIndex >= 0) {
        // Update existing result
        console.log(
          '🔄 Updating existing DAT result for searchModuleId:',
          result.data?.searchModuleId,
        );
        const updated = [...prev];
        updated[existingIndex] = result;
        return updated;
      } else {
        // Add new result
        console.log(
          '➕ Adding new DAT result for searchModuleId:',
          result.data?.searchModuleId,
        );
        return [...prev, result];
      }
    });
  }, []);

  const addSylectusResult = useCallback((result: LoadBoardSearchResult) => {
    console.log('📊 SearchResultsContext: Adding Sylectus result:', result);
    setSylectusResults((prev) => {
      // Check if a result with the same searchModuleId already exists
      const existingIndex = prev.findIndex(
        (existing) =>
          existing.data?.searchModuleId === result.data?.searchModuleId,
      );

      if (existingIndex >= 0) {
        // Update existing result
        console.log(
          '🔄 Updating existing Sylectus result for searchModuleId:',
          result.data?.searchModuleId,
        );
        const updated = [...prev];
        updated[existingIndex] = result;
        return updated;
      } else {
        // Add new result
        console.log(
          '➕ Adding new Sylectus result for searchModuleId:',
          result.data?.searchModuleId,
        );
        return [...prev, result];
      }
    });
  }, []);

  const clearResults = useCallback(() => {
    setDatResults([]);
    setSylectusResults([]);
    // Also clear from localStorage
    try {
      localStorage.removeItem('datSearchResults');
      localStorage.removeItem('sylectusSearchResults');
      console.log('🗑️ Cleared all search results from localStorage');
    } catch (error) {
      console.error('Error clearing search results from localStorage:', error);
    }
  }, []);

  const getResultBySearchModuleId = useCallback(
    (searchModuleId: string) => {
      // First check DAT results
      const datResult = datResults.find(
        (result) => result.data?.searchModuleId === searchModuleId,
      );
      if (datResult) return datResult;

      // Then check Sylectus results
      const sylectusResult = sylectusResults.find(
        (result) => result.data?.searchModuleId === searchModuleId,
      );
      return sylectusResult || null;
    },
    [datResults, sylectusResults],
  );

  const cleanupOldResults = useCallback(() => {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    setDatResults((prev) => {
      const filtered = prev.filter((result) => {
        const resultTime = new Date(result.data?.timestamp || 0);
        return resultTime > twentyFourHoursAgo;
      });

      if (filtered.length !== prev.length) {
        console.log(
          `🧹 Cleaned up ${prev.length - filtered.length} old DAT results`,
        );
      }

      return filtered;
    });

    setSylectusResults((prev) => {
      const filtered = prev.filter((result) => {
        const resultTime = new Date(result.data?.timestamp || 0);
        return resultTime > twentyFourHoursAgo;
      });

      if (filtered.length !== prev.length) {
        console.log(
          `🧹 Cleaned up ${prev.length - filtered.length} old Sylectus results`,
        );
      }

      return filtered;
    });
  }, []);

  // Delete methods for individual search results
  const deleteDatResult = useCallback((searchModuleId: string) => {
    console.log('🗑️ Deleting DAT result with searchModuleId:', searchModuleId);
    setDatResults((prev) => {
      const filtered = prev.filter(
        (result) => result.data?.searchModuleId !== searchModuleId,
      );

      if (filtered.length !== prev.length) {
        console.log(`✅ Deleted DAT result: ${searchModuleId}`);
      } else {
        console.log(`⚠️ DAT result not found: ${searchModuleId}`);
      }

      return filtered;
    });
  }, []);

  const deleteSylectusResult = useCallback((searchModuleId: string) => {
    console.log(
      '🗑️ Deleting Sylectus result with searchModuleId:',
      searchModuleId,
    );
    setSylectusResults((prev) => {
      const filtered = prev.filter(
        (result) => result.data?.searchModuleId !== searchModuleId,
      );

      if (filtered.length !== prev.length) {
        console.log(`✅ Deleted Sylectus result: ${searchModuleId}`);
      } else {
        console.log(`⚠️ Sylectus result not found: ${searchModuleId}`);
      }

      return filtered;
    });
  }, []);

  const deleteResultBySearchModuleId = useCallback(
    (searchModuleId: string) => {
      console.log(
        '🗑️ Deleting search result with searchModuleId:',
        searchModuleId,
      );
      // Delete from both DAT and Sylectus results
      deleteDatResult(searchModuleId);
      deleteSylectusResult(searchModuleId);
    },
    [deleteDatResult, deleteSylectusResult],
  );

  // Clean up old results on mount
  useEffect(() => {
    cleanupOldResults();
  }, [cleanupOldResults]);

  const latestDatResult =
    datResults.length > 0 ? datResults[datResults.length - 1] : null;
  const latestSylectusResult =
    sylectusResults.length > 0
      ? sylectusResults[sylectusResults.length - 1]
      : null;

  const value: SearchResultsContextType = {
    datResults,
    sylectusResults,
    addDatResult,
    addSylectusResult,
    clearResults,
    latestDatResult,
    latestSylectusResult,
    getResultBySearchModuleId,
    cleanupOldResults,
    deleteDatResult,
    deleteSylectusResult,
    deleteResultBySearchModuleId,
  };

  return (
    <SearchResultsContext.Provider value={value}>
      {children}
    </SearchResultsContext.Provider>
  );
};

export const useSearchResults = (): SearchResultsContextType => {
  const context = useContext(SearchResultsContext);
  if (!context) {
    throw new Error(
      'useSearchResults must be used within a SearchResultsProvider',
    );
  }
  return context;
};
