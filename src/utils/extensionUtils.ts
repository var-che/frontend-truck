import { EXTENSION_ID } from './constants';

let port: chrome.runtime.Port | null = null;

export const initializeConnection = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!chrome?.runtime?.connect) {
      reject(new Error('Chrome extension not available'));
      return;
    }

    try {
      port = chrome.runtime.connect(EXTENSION_ID);

      port.onDisconnect.addListener(() => {
        console.log('Port disconnected, attempting reconnect...');
        port = null;
        setTimeout(initializeConnection, 1000);
      });

      resolve();
    } catch (error) {
      reject(error);
    }
  });
};

export const sendMessageToExtension = async (message: any): Promise<any> => {
  if (!port) {
    await initializeConnection();
  }

  return new Promise((resolve, reject) => {
    try {
      port?.postMessage(message);

      const handleResponse = (response: any) => {
        if (response.type === `${message.type}_RESPONSE`) {
          port?.onMessage.removeListener(handleResponse);
          resolve(response.data);
        }
      };

      port?.onMessage.addListener(handleResponse);
    } catch (error) {
      reject(error);
    }
  });
};

export const isExtensionAvailable = (): boolean => {
  return (
    typeof chrome !== 'undefined' &&
    chrome.runtime &&
    !!chrome.runtime.sendMessage
  );
};

export const connectToExtension = () => {
  if (!chrome?.runtime?.connect) {
    throw new Error('Chrome extension not available');
  }

  port = chrome.runtime.connect(EXTENSION_ID);

  port.onMessage.addListener((message) => {
    if (message.type === 'DAT_TAB_CONNECTED') {
      console.log('Connected to DAT tab:', message.tabId);
      // Handle connection message
    }
  });

  port.onDisconnect.addListener(() => {
    console.log('Disconnected from extension');
    port = null;
  });
};

export const initializeExtensionConnection = () => {
  try {
    const port = chrome.runtime.connect(EXTENSION_ID);
    console.log('Connecting to extension...');

    port.onMessage.addListener((msg) => {
      console.log('Message from extension:', msg);
    });

    port.onDisconnect.addListener(() => {
      console.error('Extension connection failed:', chrome.runtime.lastError);
    });

    return port;
  } catch (error) {
    console.error('Failed to connect:', error);
    return null;
  }
};
