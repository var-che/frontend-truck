import { useState, useEffect, useCallback } from 'react';

const EXTENSION_ID = 'pgdncppejlbjbpbifphhmjiebjdpgehi';

export const useChromeMessaging = () => {
  const [extensionConnected, setExtensionConnected] = useState(false);
  const [datTabConnected, setDatTabConnected] = useState(false);
  const [datTabId, setDatTabId] = useState<number | null>(null);
  const [pongMessage, setPongMessage] = useState('');
  const [checkingConnection, setCheckingConnection] = useState(false);
  const [lastSearchTime, setLastSearchTime] = useState<number>(0);

  // Helper to send messages to extension using externally_connectable API
  const sendMessageToExtension = (message: any): Promise<any> => {
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
  };

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

      console.log('Extension responded:', response);
      setExtensionConnected(true);

      // If we have information about a connected DAT tab
      if (response?.datTabConnected) {
        setDatTabConnected(true);
        setDatTabId(response.tabId);
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
  }, []);

  // Set up message listener (only once)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.chrome?.runtime?.onMessage) {
      setExtensionConnected(false);
      return;
    }

    const messageListener = (message: any, sender: any, sendResponse: any) => {
      if (message.type === 'DAT_CONNECTION_STATUS') {
        setDatTabConnected(message.connected);
        setDatTabId(message.tabId || null);
        setExtensionConnected(true);
      } else if (message.type === 'PONG') {
        setPongMessage(message.data || 'Extension connected');
        setExtensionConnected(true);
      }
    };

    window.chrome.runtime.onMessage.addListener(messageListener);

    return () => {
      if (window.chrome?.runtime?.onMessage) {
        window.chrome.runtime.onMessage.removeListener(messageListener);
      }
    };
  }, []); // Initial connection check (only once)
  useEffect(() => {
    checkExtensionAvailability();
  }, [checkExtensionAvailability]);

  // Set up dynamic connection monitoring based on search activity
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const getCheckInterval = () => {
      const timeSinceLastSearch = Date.now() - lastSearchTime;
      if (timeSinceLastSearch < 60000) {
        // Within 1 minute of last search
        return 10000; // Check every 10 seconds
      } else if (timeSinceLastSearch < 300000) {
        // Within 5 minutes
        return 30000; // Check every 30 seconds
      } else {
        return 60000; // Check every minute when idle
      }
    };

    const scheduleNextCheck = () => {
      const interval = getCheckInterval();
      timeoutId = setTimeout(() => {
        checkExtensionAvailability();
        scheduleNextCheck();
      }, interval);
    };

    // Only start scheduling if we've had at least one search
    if (lastSearchTime > 0) {
      scheduleNextCheck();
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [lastSearchTime, checkExtensionAvailability]);

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

  // Send DAT search data to the extension
  const sendDatSearchData = async (searchData: any) => {
    try {
      console.log('Sending DAT search data to extension:', searchData);

      // Update last search time for connection monitoring
      setLastSearchTime(Date.now());

      const response = await sendMessageToExtension({
        type: 'DAT_SEARCH',
        data: searchData,
        timestamp: Date.now(),
      });

      console.log('DAT search response:', response);

      // If the search failed due to connection issues, trigger a connection check
      if (
        !response.success &&
        response.error &&
        (response.error.includes('connection lost') ||
          response.error.includes('Connection error') ||
          response.error.includes('receiving end does not exist'))
      ) {
        console.log(
          'Connection issue detected, rechecking extension availability...',
        );
        setTimeout(() => {
          checkExtensionAvailability();
        }, 1000);
      }

      return response;
    } catch (error) {
      console.error('Failed to send DAT search data:', error);

      // If there's a communication error, try to reconnect
      console.log(
        'Communication error detected, rechecking extension availability...',
      );
      setTimeout(() => {
        checkExtensionAvailability();
      }, 1000);

      throw error;
    }
  };

  return {
    extensionConnected,
    datTabConnected,
    datTabId,
    pongMessage,
    pingDatTab,
    sendDatSearchData,
    checkExtensionAvailability,
    checkingConnection,
    sendMessageToExtension, // Expose for direct usage if needed
  };
};
