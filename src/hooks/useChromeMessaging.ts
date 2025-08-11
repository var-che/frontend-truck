import { useState, useEffect } from 'react';

const EXTENSION_ID = 'pgdncppejlbjbpbifphhmjiebjdpgehi';

export const useChromeMessaging = () => {
  const [extensionConnected, setExtensionConnected] = useState(false);
  const [datTabConnected, setDatTabConnected] = useState(false);
  const [datTabId, setDatTabId] = useState<number | null>(null);
  const [pongMessage, setPongMessage] = useState('');
  const [checkingConnection, setCheckingConnection] = useState(false);

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
  const checkExtensionAvailability = async () => {
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
  };

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
      if (message.type === 'DAT_TAB_CONNECTED') {
        setDatTabConnected(true);
        setDatTabId(message.tabId);
      } else if (message.type === 'DAT_TAB_DISCONNECTED') {
        setDatTabConnected(false);
        setDatTabId(null);
      } else if (message.type === 'EXTENSION_DETECTED') {
        setExtensionConnected(true);
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
  }, []);

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

  return {
    extensionConnected,
    datTabConnected,
    datTabId,
    pongMessage,
    pingDatTab,
    checkExtensionAvailability,
    checkingConnection,
    sendMessageToExtension,
  };
};
