import axios from "axios";

const DEFAULT_API_URL = "http://localhost:4000/api";

/**
 * Resolves the API base URL from Vite configuration with a local default.
 *
 * @returns {string} API base URL used by Axios.
 */
export function getApiBaseUrl() {
  return import.meta.env.VITE_API_URL || DEFAULT_API_URL;
}

/**
 * Shared Axios client for all task manager API requests.
 */
export const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
});
