import React from 'react';
import LoadsContainer from './LoadsContainer';
import LanesContainerList from './LanesContainerList';

const LoadContainerListing: React.FC = () => {
  return (
    <div>
      <LanesContainerList />
      <LoadsContainer driverId="driver1" />
      <LoadsContainer driverId="driver2" />
      <LoadsContainer driverId="driver3" />
    </div>
  );
};

export default LoadContainerListing;
