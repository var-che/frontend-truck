import { useState, useEffect } from 'react';
import { SearchState } from './useSearchState';
import { useChromeMessaging } from './useChromeMessaging';
import {
  LoadBoardProvider,
  LoadBoardSubmissionState,
  LoadBoardSearchResult,
} from '../types/loadboard';
import { loadBoardRegistry } from '../services/LoadBoardRegistry';

export const useSearchSubmission = () => {
  const { sendDatSearchData, extensionConnected } = useChromeMessaging();

  const [submissionState, setSubmissionState] =
    useState<LoadBoardSubmissionState>({
      isPosting: false,
      results: {
        [LoadBoardProvider.DAT]: null,
        [LoadBoardProvider.SYLECTUS]: null,
      },
      errors: {
        [LoadBoardProvider.DAT]: null,
        [LoadBoardProvider.SYLECTUS]: null,
      },
    });

  // Set up messaging function when extension is connected
  useEffect(() => {
    if (extensionConnected && sendDatSearchData) {
      loadBoardRegistry.setMessagingFunction(sendDatSearchData);
    }
  }, [extensionConnected, sendDatSearchData]);

  const searchOnLoadBoards = async (
    searchState: SearchState,
    providers: LoadBoardProvider[] = [
      LoadBoardProvider.DAT,
      LoadBoardProvider.SYLECTUS,
    ],
  ) => {
    setSubmissionState((prev) => ({
      ...prev,
      isPosting: true,
      // Reset previous results and errors
      results: Object.fromEntries(
        Object.keys(prev.results).map((key) => [key, null]),
      ) as Record<LoadBoardProvider, LoadBoardSearchResult | null>,
      errors: Object.fromEntries(
        Object.keys(prev.errors).map((key) => [key, null]),
      ) as Record<LoadBoardProvider, string | null>,
    }));

    try {
      const services = loadBoardRegistry.getServicesByProviders(providers);

      // Execute searches in parallel
      const searchPromises = services.map(async (service) => {
        try {
          const searchData = service.transformSearchState(searchState);
          const result = await service.search(searchData);
          return { provider: service.provider, result };
        } catch (error) {
          console.error(`Error searching on ${service.name}:`, error);
          return {
            provider: service.provider,
            result: {
              success: false,
              message: `Failed to search on ${service.name}. Please try again.`,
            },
          };
        }
      });

      const results = await Promise.all(searchPromises);

      // Update state with results
      setSubmissionState((prev) => {
        const newResults = { ...prev.results };
        const newErrors = { ...prev.errors };

        results.forEach(({ provider, result }) => {
          newResults[provider] = result;
          if (!result.success) {
            newErrors[provider] = result.message || 'Search failed';
          }
        });

        return {
          ...prev,
          isPosting: false,
          results: newResults,
          errors: newErrors,
        };
      });
    } catch (error) {
      console.error('General search error:', error);
      setSubmissionState((prev) => ({
        ...prev,
        isPosting: false,
        errors: Object.fromEntries(
          providers.map((provider) => [provider, 'Unexpected error occurred']),
        ) as Record<LoadBoardProvider, string | null>,
      }));
    }
  };

  const searchOnSpecificLoadBoard = async (
    searchState: SearchState,
    provider: LoadBoardProvider,
  ) => {
    await searchOnLoadBoards(searchState, [provider]);
  };

  const resetStatus = () => {
    setSubmissionState((prev) => ({
      ...prev,
      results: Object.fromEntries(
        Object.keys(prev.results).map((key) => [key, null]),
      ) as Record<LoadBoardProvider, LoadBoardSearchResult | null>,
      errors: Object.fromEntries(
        Object.keys(prev.errors).map((key) => [key, null]),
      ) as Record<LoadBoardProvider, string | null>,
    }));
  };

  // Legacy method for backward compatibility
  const handlePostToDat = async (searchState: SearchState) => {
    await searchOnSpecificLoadBoard(searchState, LoadBoardProvider.DAT);
  };

  // Computed properties for easier access
  const isPosting = submissionState.isPosting;
  const hasAnySuccess = Object.values(submissionState.results).some(
    (result) => result?.success,
  );
  const hasAnyError = Object.values(submissionState.errors).some(
    (error) => error !== null,
  );
  const allErrors = Object.entries(submissionState.errors)
    .filter(([, error]) => error !== null)
    .map(([provider, error]) => `${provider}: ${error}`)
    .join('; ');

  return {
    // State
    isPosting,
    submissionState,
    extensionConnected,

    // Computed properties
    hasAnySuccess,
    hasAnyError,
    allErrors,

    // Actions
    searchOnLoadBoards,
    searchOnSpecificLoadBoard,
    handlePostToDat, // Legacy compatibility
    resetStatus,

    // Individual load board results
    datResult: submissionState.results[LoadBoardProvider.DAT],
    sylectusResult: submissionState.results[LoadBoardProvider.SYLECTUS],
    datError: submissionState.errors[LoadBoardProvider.DAT],
    sylectusError: submissionState.errors[LoadBoardProvider.SYLECTUS],
  };
};
