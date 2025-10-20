import React from 'react';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useNavigate,
} from 'react-router-dom';
import Dashboard from './components/Dashboard';
import { fetchGreeting } from './api';
import { MapProvider } from './context/MapContext';
import { SearchResultsProvider } from './context/SearchResultsContext';
import { TrimbleRoutingProvider } from './context/routing/TrimbleRoutingContext';
import LoadSearchPage from './components/routing/load-search/LoadSearchPage';
import DriversPage from './components/DriversPage';
import SylectusSearchPage from './components/SylectusSearchPage';
import DatTestPage from './components/DatTestPage';
import TrimbleRoutingPage from './components/routing/trimble/TrimbleRoutingPage';
import { DATLoadsHandler } from './components/DATLoadsHandler';

import { App as AntApp, Layout, Button } from 'antd';
import LanesContainerList from './components/LanesContainerList';
import BoardsInitialization from './components/boards/BoardsInitialization';
import DatConnectionStatus from './components/DatConnectionStatus';

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
        <SearchResultsProvider>
          <DATLoadsHandler />
          <TrimbleRoutingProvider>
            <Router>
              <Layout>
                <AppHeader />
                <Content style={{ marginTop: 64, padding: '0 50px' }}>
                  <div
                    className="connection-status-wrapper"
                    style={{ margin: '16px' }}
                  >
                    <DatConnectionStatus onConnectionChange={() => {}} />
                  </div>
                  <Routes>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route
                      path="/"
                      element={
                        <div style={{ textAlign: 'center', marginTop: '50px' }}>
                          <h1>React Frontend with Fastify Backend</h1>
                          <h2>
                            {greeting
                              ? `Backend says: ${greeting}`
                              : 'Loading...'}
                          </h2>
                        </div>
                      }
                    />
                    <Route path="/lanes" element={<LanesContainerList />} />
                    <Route path="/load-search" element={<LoadSearchPage />} />
                    <Route path="/boards" element={<BoardsInitialization />} />
                    <Route path="/drivers" element={<DriversPage />} />
                    <Route path="/sylectus" element={<SylectusSearchPage />} />
                    <Route path="/dat-test-page" element={<DatTestPage />} />
                    <Route
                      path="/trimble-routing"
                      element={<TrimbleRoutingPage />}
                    />
                  </Routes>
                </Content>
              </Layout>
            </Router>
          </TrimbleRoutingProvider>
        </SearchResultsProvider>
      </MapProvider>
    </AntApp>
  );
};

// Create a separate component for the header to use navigation hooks
const AppHeader: React.FC = () => {
  const navigate = useNavigate();

  return (
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
      <Button type="primary" onClick={() => navigate('/dashboard')}>
        Dashboard
      </Button>
      <Button onClick={() => navigate('/load-search')}>Load Search</Button>
      <Button onClick={() => navigate('/drivers')}>Drivers</Button>
      <Button onClick={() => navigate('/sylectus')}>Sylectus</Button>
      <Button onClick={() => navigate('/dat-test-page')}>DAT Test</Button>
      <Button onClick={() => navigate('/trimble-routing')}>
        Trimble Routing
      </Button>
      <Button>Settings</Button>
      <Button onClick={() => navigate('/boards')}>Boards connection</Button>
    </Header>
  );
};

export default App;
