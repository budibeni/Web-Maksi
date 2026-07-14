import axios from "axios";
import Cookies from "js-cookie";
import { APP_URL } from "./app";
import { AUTH_COOKIE_NAME } from "./auth";

const axiosInstance = axios.create({
  baseURL: `${APP_URL}/api`,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor for Requests
axiosInstance.interceptors.request.use(
  (config) => {
    const token = Cookies.get(AUTH_COOKIE_NAME);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor for Responses
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;
