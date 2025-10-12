import { useState, useEffect, useCallback, useRef } from 'react';

const EXTENSION_ID = 'pgdncppejlbjbpbifphhmjiebjdpgehi';

interface DATLoadsMessage {
  type: 'DAT_LOADS_RECEIVED';
  queryId: string;
  loads: any[];
  matchCount: number;
  timestamp: string;
  provider: string;
}

interface DATSearchFindingsMessage {
  type: 'DAT_SEARCH_FINDINGS';
  laneId: string;
  findings: {
    matches: any[];
    matchCounts: {
      totalCount: number;
      normal: number;
      preferred: number;
      blocked: number;
      privateNetwork: number;
    };
    timestamp: string;
    provider: string;
  };
}

export const useChromeMessaging = () => {
  const [extensionConnected, setExtensionConnected] = useState(false);
  const [datTabConnected, setDatTabConnected] = useState(false);
  const [datTabId, setDatTabId] = useState<number | null>(null);
  const [pongMessage, setPongMessage] = useState('');
  const [checkingConnection, setCheckingConnection] = useState(false);
  const onDATLoadsReceivedRef = useRef<
    ((data: DATLoadsMessage) => void) | null
  >(null);
  const onDATSearchFindingsReceivedRef = useRef<
    ((data: DATSearchFindingsMessage) => void) | null
  >(null);

  // Helper to send messages to extension using externally_connectable API
  const sendMessageToExtension = useCallback((message: any): Promise<any> => {
    return new Promise((resolve, reject) => {
      try {
        // Check if Chrome is available and has the extension API
        if (typeof chrome === 'undefined') {
          console.warn('Chrome object not available');
          reject(new Error('Chrome API not available'));
          return;
        }

        if (!chrome.runtime) {
          console.warn('Chrome runtime not available');
          reject(new Error('Chrome runtime not available'));
          return;
        }

        // Use sendMessage with extension ID to communicate externally
        if (chrome.runtime.sendMessage) {
          // This is the right API for web pages talking to extensions
          chrome.runtime.sendMessage(EXTENSION_ID, message, (response) => {
            if (chrome.runtime.lastError) {
              console.warn('Chrome runtime error:', chrome.runtime.lastError);
              console.warn('Error details:', chrome.runtime.lastError.message);
              reject(chrome.runtime.lastError);
            } else {
              resolve(response);
            }
          });
        } else {
          // Fall back to window.postMessage as an alternative
          console.warn('Using fallback postMessage communication');

          // Generate a unique request ID for this message
          const requestId = `req_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`;

          // Create a one-time message listener for the response
          const messageListener = (event: MessageEvent) => {
            if (
              event.source === window &&
              event.data &&
              event.data.source === 'truckarooskie-extension' &&
              event.data.requestId === requestId
            ) {
              window.removeEventListener('message', messageListener);
              resolve(event.data);
            }
          };

          // Listen for the response
          window.addEventListener('message', messageListener);

          // Send the message with the request ID
          window.postMessage(
            {
              target: 'truckarooskie-extension',
              requestId,
              ...message,
            },
            '*',
          );

          // Set timeout to clean up listener if no response
          setTimeout(() => {
            window.removeEventListener('message', messageListener);
            reject(new Error('Extension communication timed out'));
          }, 5000);
        }
      } catch (error) {
        console.error('Error sending message to extension:', error);
        reject(error);
      }
    });
  }, []);

  // Check if extension is available
  const checkExtensionAvailability = useCallback(async () => {
    setCheckingConnection(true);
    try {
      // First try postMessage to check if extension is injected
      window.postMessage(
        {
          target: 'truckarooskie-extension',
          type: 'PING',
          timestamp: Date.now(),
        },
        '*',
      );

      // Wait a moment before trying direct communication
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Try to send a message to the extension
      const response = await sendMessageToExtension({
        type: 'CONNECTION_CHECK',
      });

      setExtensionConnected(true);

      // If we have information about a connected DAT tab OR DAT Test tab
      if (response?.datTabConnected || response?.datTestTabConnected) {
        setDatTabConnected(true);
        setDatTabId(response.tabId || response.datTestTabId);
      } else {
        setDatTabConnected(false);
        setDatTabId(null);
      }
    } catch (error) {
      console.error('Extension connection error:', error);
      setExtensionConnected(false);
      setDatTabConnected(false);
    } finally {
      setCheckingConnection(false);
    }
  }, [sendMessageToExtension]);

  // Set up message listener for events from extension
  useEffect(() => {
    const handleExtensionMessage = (event: MessageEvent) => {
      // Only accept messages from our window (extension will post to window)
      if (event.source !== window) return;

      // Check if this is from our extension
      const message = event.data;
      if (!message || message.source !== 'truckarooskie-extension') return;

      console.log('Received message from extension:', message);

      // Handle connection status updates
      if (
        message.type === 'DAT_TAB_CONNECTED' ||
        message.type === 'DAT_TEST_TAB_CONNECTED'
      ) {
        setDatTabConnected(true);
        setDatTabId(message.tabId);
      } else if (
        message.type === 'DAT_TAB_DISCONNECTED' ||
        message.type === 'DAT_TEST_TAB_DISCONNECTED'
      ) {
        setDatTabConnected(false);
        setDatTabId(null);
      } else if (message.type === 'EXTENSION_DETECTED') {
        setExtensionConnected(true);
      } else if (message.type === 'DAT_LOADS_RECEIVED') {
        // Handle DAT loads data
        console.log('📦 Received DAT loads for queryId:', message.queryId, {
          loadCount: message.loads?.length || 0,
          matchCount: message.matchCount,
        });
        if (
          onDATLoadsReceivedRef.current &&
          typeof onDATLoadsReceivedRef.current === 'function'
        ) {
          console.log('✅ Calling DAT loads callback with message:', message);
          onDATLoadsReceivedRef.current(message as DATLoadsMessage);
        } else {
          console.warn(
            '⚠️ No DAT loads callback registered or callback is not a function:',
            onDATLoadsReceivedRef.current,
          );
        }
      } else if (message.type === 'DAT_SEARCH_FINDINGS') {
        // Handle DAT search findings data
        console.log(
          '🔍 Received DAT search findings for laneId:',
          message.laneId,
          {
            matchCount: message.findings?.matches?.length || 0,
            totalCount: message.findings?.matchCounts?.totalCount || 0,
          },
        );
        if (
          onDATSearchFindingsReceivedRef.current &&
          typeof onDATSearchFindingsReceivedRef.current === 'function'
        ) {
          console.log(
            '✅ Calling DAT search findings callback with message:',
            message,
          );
          onDATSearchFindingsReceivedRef.current(
            message as DATSearchFindingsMessage,
          );
        } else {
          console.warn(
            '⚠️ No DAT search findings callback registered or callback is not a function:',
            onDATSearchFindingsReceivedRef.current,
          );
        }
      }
    };

    // Add listener for extension messages
    window.addEventListener('message', handleExtensionMessage);

    // Check connection on mount
    checkExtensionAvailability();

    // Set up periodic connection check
    const intervalId = setInterval(checkExtensionAvailability, 30000);

    return () => {
      window.removeEventListener('message', handleExtensionMessage);
      clearInterval(intervalId);
    };
  }, [checkExtensionAvailability]);

  // Send a ping to the DAT tab
  const pingDatTab = async () => {
    setPongMessage('Sending ping...');
    try {
      const response = await sendMessageToExtension({ type: 'PING_DAT_TAB' });
      if (response?.message) {
        setPongMessage(response.message);
      } else if (response?.error) {
        setPongMessage(`Error: ${response.error}`);
      } else {
        setPongMessage('Got response but no message');
      }
    } catch (error) {
      setPongMessage(
        `Failed to communicate with extension: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  };

  // Function to set the DAT loads callback
  const setDATLoadsCallback = useCallback(
    (callback: ((data: DATLoadsMessage) => void) | null) => {
      console.log(
        '� Registering DAT loads callback:',
        typeof callback === 'function' ? 'function' : callback,
      );
      onDATLoadsReceivedRef.current = callback;
    },
    [],
  );

  const setDATSearchFindingsCallback = useCallback(
    (callback: ((data: DATSearchFindingsMessage) => void) | null) => {
      console.log(
        '🔗 Registering DAT search findings callback:',
        typeof callback === 'function' ? 'function' : callback,
      );
      onDATSearchFindingsReceivedRef.current = callback;
    },
    [],
  );

  return {
    extensionConnected,
    datTabConnected,
    datTabId,
    pongMessage,
    pingDatTab,
    checkExtensionAvailability,
    checkingConnection,
    sendMessageToExtension,
    // Function to register DAT loads callback
    setDATLoadsCallback,
    // Function to register DAT search findings callback
    setDATSearchFindingsCallback,
  };
};
