/**
 * Load Search Module
 *
 * This module contains all components related to load searching,
 * lane management, and load board integration.
 *
 * Main Components:
 * - LoadSearchPage: Main page for load search and lane management
 * - AddNewSearchModal: Modal for creating new load searches
 *
 * Related Components (still in parent directories):
 * - CitySelection: City search and selection
 * - StateMapSelector: Interactive state map for origin/destination
 * - DateRangePicker: Date range selection for pickups
 * - LoadBoardResults: Display results from load board searches
 * - LanesContainerList: List and management of saved lanes
 */

export { default as LoadSearchPage } from './LoadSearchPage';
export { default as AddNewSearchModal } from './AddNewSearchModal';

// Note: Subcomponents (OriginSelector, DestinationSelector, SearchDatePicker, SearchFooter)
// are NOT exported here to avoid circular dependencies. They are only used internally
// within AddNewSearchModal and should not be imported from outside this module.
