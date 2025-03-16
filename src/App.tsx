import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import { fetchGreeting } from './api';
import { MapProvider } from './context/MapContext';
import LoadContainerListing from './components/LoadContainerListing';

import { App as AntApp, Layout, Button } from 'antd';
import LanesContainerList from './components/LanesContainerList';
import CitySearch from './components/CitySearch';

const { Header, Content } = Layout;

const App: React.FC = () => {
  const [greeting, setGreeting] = React.useState<string | null>(null);

  React.useEffect(() => {
    const getGreeting = async () => {
      try {
        const data = await fetchGreeting();
        setGreeting(data.hello);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    getGreeting();
  }, []);

  return (
    <AntApp>
      <MapProvider>
        <Router>
          <Layout>
            <Header
              style={{
                position: 'fixed',
                width: '100%',
                zIndex: 1000,
                backgroundColor: '#fff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <Button type="primary">Dashboard</Button>
              <Button>Loads</Button>
              <Button>Settings</Button>
            </Header>
            <Content style={{ marginTop: 64, padding: '0 50px' }}>
              <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route
                  path="/"
                  element={
                    <div style={{ textAlign: 'center', marginTop: '50px' }}>
                      <h1>React Frontend with Fastify Backend</h1>
                      <h2>
                        {greeting ? `Backend says: ${greeting}` : 'Loading...'}
                      </h2>
                    </div>
                  }
                />
                <Route path="/lanes" element={<LanesContainerList />} />
                <Route path="/test" element={<LoadContainerListing />} />
              </Routes>
            </Content>
          </Layout>
        </Router>
      </MapProvider>
    </AntApp>
  );
};

export default App;
