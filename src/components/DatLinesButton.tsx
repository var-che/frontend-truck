import React, { useEffect, useState } from 'react';
import {
  sendMessageToExtension,
  initializeConnection,
} from '../utils/extensionUtils';

interface DatLinesButtonProps {
  onDataReceived: (data: any) => void;
}

const DatLinesButton: React.FC<DatLinesButtonProps> = ({ onDataReceived }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeConnection().catch(console.error);
  }, []);

  const handleGetDatLines = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await sendMessageToExtension({
        type: 'GET_DAT_LINES',
        action: 'getData',
      });
      onDataReceived(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get DAT lines');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button onClick={handleGetDatLines} disabled={isLoading}>
      {isLoading ? 'Loading...' : 'GET DAT LINES'}
    </button>
  );
};

export default DatLinesButton;
