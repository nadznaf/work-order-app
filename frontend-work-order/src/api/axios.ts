import axios from 'axios';

// Create Axios instance
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api', // Default to localhost if not set
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to inject headers dynamically
api.interceptors.request.use(
  (config) => {
    // Read from localStorage directly to ensure we get the latest value
    // Note: We use 'localStorage' mostly on client side.
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('workOrderApp_role');
      const userId = localStorage.getItem('workOrderApp_userId');

      if (role) {
        config.headers['x-role'] = role;
      }
      if (userId) {
        config.headers['x-user-id'] = userId;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
