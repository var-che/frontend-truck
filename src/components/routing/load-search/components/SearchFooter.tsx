import React from 'react';
import LoadBoardResults from '../../../LoadBoardResults';
import { LoadBoardSearchResult } from '../../../../types/loadboard';

interface SearchFooterProps {
  isPosting: boolean;
  hasAnySuccess: boolean;
  hasAnyError: boolean;
  allErrors: string;
  datResult: LoadBoardSearchResult | null;
  sylectusResult: LoadBoardSearchResult | null;
  datError: string | null;
  sylectusError: string | null;
  extensionConnected?: boolean;
  onSearchAll: () => void;
  onSearchDAT: () => void;
  onSearchSylectus: () => void;
}

/**
 * SearchFooter - Footer section containing load board results and action buttons
 * Displays search results and provides reset/submit controls
 * This component is used as the Modal footer
 */
const SearchFooter: React.FC<SearchFooterProps> = ({
  isPosting,
  hasAnySuccess,
  hasAnyError,
  allErrors,
  datResult,
  sylectusResult,
  datError,
  sylectusError,
  extensionConnected,
  onSearchAll,
  onSearchDAT,
  onSearchSylectus,
}) => {
  return (
    <LoadBoardResults
      isPosting={isPosting}
      hasAnySuccess={hasAnySuccess}
      hasAnyError={hasAnyError}
      allErrors={allErrors}
      datResult={datResult}
      sylectusResult={sylectusResult}
      datError={datError}
      sylectusError={sylectusError}
      extensionConnected={extensionConnected}
      onSearchAll={onSearchAll}
      onSearchDAT={onSearchDAT}
      onSearchSylectus={onSearchSylectus}
    />
  );
};

export default SearchFooter;
