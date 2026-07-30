import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Necessary for HTTP-Only cookie sharing
});

let accessToken = null;

/**
 * Sets the active JWT access token in memory and updates 
 * the default authorization header for all subsequent API requests.
 */
export const setAccessToken = (token) => {
  accessToken = token;
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// Response interceptor to handle silent token refreshing automatically
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't intercept login or refresh requests themselves
      if (
        originalRequest.url?.includes('/api/auth/login') || 
        originalRequest.url?.includes('/api/auth/refresh-token')
      ) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        // Call the refresh token endpoint. The browser sends the secure refresh cookie automatically.
        const res = await axios.post('http://localhost:8080/api/auth/refresh-token', {}, {
          withCredentials: true,
        });

        const newAccessToken = res.data.accessToken;
        setAccessToken(newAccessToken);

        // Update the Authorization header for the original request
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

        // Retry original request with the new access token
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails (e.g. cookie expired), clear state
        setAccessToken(null);
        
        // Dispatch custom event to notify context of session expiration
        window.dispatchEvent(new Event('auth-session-expired'));
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
