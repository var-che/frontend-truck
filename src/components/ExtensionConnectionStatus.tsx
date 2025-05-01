import React, { useEffect, useState } from 'react';

const ConnectionStatus: React.FC = () => {
  const [connectedTabId, setConnectedTabId] = useState<number | null>(null);

  useEffect(() => {
    const handleExtensionMessage = (message: any) => {
      console.log('React received message', message);
      if (message.type === 'DAT_TAB_CONNECTED') {
        setConnectedTabId(message.tabId);
        alert(`Connected to tab ${message.tabId}`);
      }
    };

    if (chrome.runtime?.onMessage) {
      chrome.runtime.onMessage.addListener(handleExtensionMessage);
    }

    return () => {
      if (chrome.runtime?.onMessage) {
        chrome.runtime.onMessage.removeListener(handleExtensionMessage);
      }
    };
  }, []);

  return (
    <div>
      {connectedTabId ? (
        <div>Connected to DAT tab: {connectedTabId}</div>
      ) : (
        <div>Not connected to any DAT tab</div>
      )}
    </div>
  );
};

export default ConnectionStatus;
