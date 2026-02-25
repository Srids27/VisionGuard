import axios from 'axios';

const api = axios.create({
  // This takes the base URL and adds the required /api prefix
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  timeout: 60000,
});

export default api;