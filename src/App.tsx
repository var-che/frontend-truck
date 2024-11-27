import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { DatePicker } from 'antd';
import Dashboard from './components/Dashboard';
import { fetchGreeting } from './api';

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
        <Route path="/" element={
          <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <h1>React Frontend with Fastify Backend</h1>
            <h2>{greeting ? `Backend says: ${greeting}` : 'Loading...'}</h2>
            <DatePicker />
          </div>
        } />
      </Routes>
    </Router>
  );
};

export default App;