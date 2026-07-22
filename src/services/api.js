import axios from 'axios';

/**
 * Updates the access token in localStorage
 */
export const setAccessToken = (token) => {
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
};

/**
 * Gets the current access token from localStorage
 */
export const getAccessToken = () => {
  return localStorage.getItem('token');
};

/**
 * Updates the exam session ID in sessionStorage
 */
export const setExamSessionId = (sessionId) => {
  if (sessionId) {
    sessionStorage.setItem('examSessionId', sessionId);
  } else {
    sessionStorage.removeItem('examSessionId');
  }
};

/**
 * Gets the current exam session ID from sessionStorage
 */
export const getExamSessionId = () => {
  return sessionStorage.getItem('examSessionId');
};

// Create Axios Instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Inject the access token & session ID into headers
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token && !config.headers['Authorization']) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    const sessionId = getExamSessionId();
    if (sessionId && !config.headers['x-session-id']) {
      config.headers['x-session-id'] = sessionId;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Wrap Axios error format into a standard error representation
api.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
