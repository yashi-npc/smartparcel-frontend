import axios from 'axios';
import { getToken } from '../utils/tokens';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:8080/parceltrack',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add token to all outgoing requests
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;
