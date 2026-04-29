import axios from 'axios';
import { API_BASE_URL } from '../utils/constants.js';

const getLocalFallbackBaseUrls = () => {
  const fallbackUrls = [API_BASE_URL];

  // If the user hasn't pinned VITE_API_BASE_URL, try a few common dev ports.
  // Order matters — the first reachable one wins.
  if (!import.meta.env.VITE_API_BASE_URL) {
    ['http://localhost:5050/api', 'http://localhost:5000/api', 'http://localhost:5010/api']
      .forEach((url) => {
        if (!fallbackUrls.includes(url)) fallbackUrls.push(url);
      });
  }

  return fallbackUrls;
};

const LOCAL_FALLBACK_BASE_URLS = getLocalFallbackBaseUrls();
let activeBaseUrlIndex = 0;

// Create axios instance with base configuration
const api = axios.create({
  baseURL: LOCAL_FALLBACK_BASE_URLS[activeBaseUrlIndex]
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const isNetworkError = !error.response && !!error.config;
    const canRetryOnAlternateBase = !error.config?._retryOnAlternateBase
      && activeBaseUrlIndex < LOCAL_FALLBACK_BASE_URLS.length - 1;

    if (isNetworkError && canRetryOnAlternateBase) {
      activeBaseUrlIndex += 1;
      const nextBaseUrl = LOCAL_FALLBACK_BASE_URLS[activeBaseUrlIndex];
      api.defaults.baseURL = nextBaseUrl;

      const retryConfig = {
        ...error.config,
        baseURL: nextBaseUrl,
        _retryOnAlternateBase: true
      };

      return api.request(retryConfig);
    }

    if (error.response?.status === 401) {
      // Don't clobber the login/register flow on bad credentials —
      // those pages need to render their own error states without
      // a hard navigation wiping React state.
      const requestUrl = error.config?.url || '';
      const isAuthRequest = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register');

      if (!isAuthRequest) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
