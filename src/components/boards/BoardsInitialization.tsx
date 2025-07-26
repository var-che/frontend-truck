import React, { useState, useEffect } from 'react';
import { Tabs, Card, Input, DatePicker, Button, Row, Col, Divider } from 'antd';

type TabItems = {
  key: string;
  label: string;
  children: React.ReactNode;
};

const BoardsInitialization: React.FC = () => {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [searchDate, setSearchDate] = useState<Date | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    'connected' | 'disconnected'
  >('disconnected');
  const [port, setPort] = useState<chrome.runtime.Port | null>(null);

  // Initialize connection to extension
  useEffect(() => {
    if (window.chrome && window.chrome.runtime) {
      try {
        const newPort = chrome.runtime.connect(
          // Use your extension ID here
          // This ID is typically found in the Chrome extension management page
          'YOUR_EXTENSION_ID',
          { name: 'truckarooskie-dat-connection' },
        );

        setPort(newPort);

        newPort.onMessage.addListener((message) => {
          console.log('Received message from extension:', message);

          if (message.type === 'DAT_TAB_CONNECTED') {
            setConnectionStatus('connected');
            document.getElementById('connection-status')!.textContent =
              'Connected';
            document.getElementById('connection-status')!.style.color = 'green';
          }

          if (message.type === 'GET_DAT_LINES_RESPONSE') {
            console.log('Received DAT lanes:', message.data);
            // Handle the lanes data here
          }
        });

        newPort.onDisconnect.addListener(() => {
          console.log('Disconnected from extension');
          setConnectionStatus('disconnected');
          setPort(null);
        });

        return () => {
          newPort.disconnect();
        };
      } catch (error) {
        console.error('Failed to connect to extension:', error);
      }
    }
  }, []);

  const checkConnectionStatus = () => {
    if (port) {
      port.postMessage({ type: 'CHECK_CONNECTION' });
    } else if (window.chrome && window.chrome.runtime) {
      try {
        // Try to reconnect if port is not available
        const newPort = chrome.runtime.connect('YOUR_EXTENSION_ID', {
          name: 'truckarooskie-dat-connection',
        });
        setPort(newPort);
        newPort.postMessage({ type: 'CHECK_CONNECTION' });
      } catch (error) {
        console.error('Failed to reconnect to extension:', error);
        setConnectionStatus('disconnected');
        document.getElementById('connection-status')!.textContent =
          'Not Connected';
        document.getElementById('connection-status')!.style.color = 'red';
      }
    } else {
      console.warn('Chrome extension API not available');
      setConnectionStatus('disconnected');
      document.getElementById('connection-status')!.textContent =
        'Extension Not Installed';
      document.getElementById('connection-status')!.style.color = 'red';
    }
  };

  const handleSubmitSearch = () => {
    console.log('Sending search to DAT:', { origin, destination, searchDate });

    if (port && connectionStatus === 'connected') {
      port.postMessage({
        type: 'EXECUTE_SEARCH',
        data: {
          origin,
          destination,
          searchDate: searchDate ? searchDate.toISOString() : null,
        },
      });
    } else if (window.chrome && window.chrome.runtime) {
      try {
        chrome.runtime.sendMessage({
          type: 'EXECUTE_SEARCH',
          data: {
            origin,
            destination,
            searchDate: searchDate ? searchDate.toISOString() : null,
          },
        });
      } catch (error) {
        console.error('Error sending message to extension:', error);
      }
    } else {
      console.warn('Chrome extension not available');
    }
  };

  const items: TabItems[] = [
    {
      key: '1',
      label: 'Connect to DAT',
      children: (
        <Card title="DAT Connection">
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <h3>DAT Board Connection</h3>
              <div
                style={{
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  padding: '20px',
                  backgroundColor: '#f9f9f9',
                }}
              >
                <h4>DAT Embedding Restriction</h4>
                <p>
                  DAT prevents embedding their site in iframes due to security
                  restrictions. To connect with DAT, please use our Chrome
                  extension:
                </p>
                <ol>
                  <li>
                    Install the Truckarooskie Chrome Extension from the Chrome
                    Web Store
                  </li>
                  <li>
                    Open DAT in a separate tab by clicking the button below
                  </li>
                  <li>
                    The extension will establish a connection between this app
                    and DAT
                  </li>
                  <li>
                    Once connected, you can use the form below to interact with
                    DAT
                  </li>
                </ol>
                <div style={{ marginTop: '15px', textAlign: 'center' }}>
                  <Button
                    type="primary"
                    href="https://dat.com/"
                    target="_blank"
                  >
                    Open DAT in New Tab
                  </Button>
                  <div style={{ marginTop: '10px' }}>
                    <Button
                      type="default"
                      icon={<span>🔌</span>}
                      style={{ marginRight: '10px' }}
                      onClick={checkConnectionStatus}
                    >
                      Check Connection Status
                    </Button>
                    <span id="connection-status" style={{ color: 'red' }}>
                      Not Connected
                    </span>
                  </div>
                </div>
              </div>
              <p style={{ margin: '8px 0', color: '#888' }}>
                Our Chrome extension will serve as a bridge between this
                application and DAT.
              </p>
            </Col>

            <Divider />

            <Col span={24}>
              <h3>Search for Loads</h3>
              <p>Fill these fields to search for loads on DAT</p>
            </Col>

            <Col span={12}>
              <Input
                placeholder="Origin"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
              />
            </Col>

            <Col span={12}>
              <Input
                placeholder="Destination"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              />
            </Col>

            <Col span={12}>
              <DatePicker
                placeholder="Date"
                style={{ width: '100%' }}
                onChange={(date) => setSearchDate(date ? date.toDate() : null)}
              />
            </Col>

            <Col span={12}>
              <Button type="primary" onClick={handleSubmitSearch}>
                Submit Search to DAT
              </Button>
            </Col>
          </Row>
        </Card>
      ),
    },
    {
      key: '2',
      label: 'Connect to Sylectus',
      children: (
        <Card title="Sylectus Connection">
          <p>
            Sylectus integration will be implemented after DAT is fully
            functional.
          </p>
          <p>This feature is currently not available.</p>
        </Card>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <h1>Board Connections</h1>
      <Tabs defaultActiveKey="1" items={items} />
    </div>
  );
};

export default BoardsInitialization;

/*
The role of this board is create an iframe of the DAT and Sylectus, and allow the chrome extension to interact with them.
This is an attempt to change the already existing way of connecting to DAT and Sylectus boards.
On the "Connect to DAT" tab, there will be an iframe that loads the DAT board.
For now, we will skip Sylectus until DAT is fully functional.
Once user is logged in that iframe of DAT, the extension will be a middleman between the DAT and this site.
On our site, the Truckarooskie frontend, there will be similar input fields that DAT has, like
"Origin", "Destination", "Date", etc, and button "Submit".
Once user clicks "Submit", the extension will send a message to the DAT iframe, which will then
fill the corresponding fields in the DAT board and submit the form.
This way, we will be able to use the DAT board without leaving our site.
*/
