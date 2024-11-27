import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000', // Backend server URL
});

export const fetchGreeting = async () => {
  const response = await api.get('/');
  return response.data;
};
