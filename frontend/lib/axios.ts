import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Pass along meaningful error message from backend
    const message = error.response?.data?.error?.message || error.response?.data?.message || error.message;
    return Promise.reject(new Error(message));
  }
);
