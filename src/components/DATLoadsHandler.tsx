import React from 'react';
import { useDATLoadsListener } from '../hooks/useDATLoadsListener';

/**
 * Component that handles DAT loads from extension
 * Must be inside SearchResultsProvider context
 */
export const DATLoadsHandler: React.FC = () => {
  // This hook will register the callback and handle incoming DAT loads
  useDATLoadsListener();

  // This component renders nothing, it's just for the side effect
  return null;
};
