import { useEffect } from 'react';
import { useChromeMessaging } from '../../hooks/useChromeMessaging';

export const ConnectionStatus = () => {
  const {
    extensionConnected,
    datTabConnected,
    datTabId,
    pongMessage,
    pingDatTab,
  } = useChromeMessaging();

  useEffect(() => {}, [extensionConnected, datTabConnected]);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>DAT Tab Connector</h1>
      <div>
        <input type="checkbox" checked={extensionConnected} readOnly />
        <label>Connected to browser extension</label>
      </div>
      <div>
        <input type="checkbox" checked={datTabConnected} readOnly />
        <label>Connected to DAT tab {datTabId && `(ID: ${datTabId})`}</label>
      </div>
      <button
        onClick={pingDatTab}
        disabled={!datTabConnected}
        style={{ marginTop: '10px', padding: '8px 12px' }}
      >
        Ping DAT Tab
      </button>
      {pongMessage && <p>Response: {pongMessage}</p>}
    </div>
  );
};
