import axios, { AxiosHeaders } from 'axios';

console.log('Environment variables:', {
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  VITE_API_SERVER: import.meta.env.VITE_API_SERVER,
  VITE_API_PORT: import.meta.env.VITE_API_PORT
});

const serverBase =
  import.meta.env.VITE_API_BASE_URL ??
  `${import.meta.env.VITE_API_SERVER ?? `http://localhost:${import.meta.env.VITE_API_PORT ?? '5002'}`}/api`;

console.log('Final API Base URL:', serverBase);

const api = axios.create({
  baseURL: serverBase,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    const headers = new AxiosHeaders(config.headers);
    headers.set('Authorization', `Bearer ${token}`);
    config.headers = headers;
  }
  return config;
});

export default api;
