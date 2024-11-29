import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { DatePicker } from 'antd';
import Dashboard from './components/Dashboard';
import { fetchGreeting } from './api';
import MapDashboard from './components/MapDashboard';
import { HPlatform } from 'react-here-map';

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
    <Router>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route
          path="/"
          element={
            <div style={{ textAlign: 'center', marginTop: '50px' }}>
              <h1>React Frontend with Fastify Backend</h1>
              <h2>{greeting ? `Backend says: ${greeting}` : 'Loading...'}</h2>
              <HPlatform
                options={{
                  apiKey: "TIAGlD6jic7l9Aa8Of8IFxo3EUemmcZlHm_agfAm6Ew",
                  includePlaces: false,
                  includeUI: false,
                  interactive: true,
                  version: 'v3/3.1'
                }}
              >
                <MapDashboard />
              </HPlatform>
              {/* <DatePicker /> */}
            </div>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
