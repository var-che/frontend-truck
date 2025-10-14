import React from 'react';
import { ConnectionStatus } from './connection/ConnectionStatus';

interface DatConnectionStatusProps {
  onConnectionChange?: (isConnected: boolean) => void;
}

const DatConnectionStatus: React.FC<DatConnectionStatusProps> = ({
  onConnectionChange,
}) => {
  return <ConnectionStatus />;
};

export default DatConnectionStatus;
