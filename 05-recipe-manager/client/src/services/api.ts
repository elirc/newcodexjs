import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:4005/api',
  withCredentials: true
});

/** Installs or clears the bearer token used by protected API calls. */
export function setAccessToken(token?: string): void {
  if (token) api.defaults.headers.common.Authorization = `Bearer ${token}`;
  else delete api.defaults.headers.common.Authorization;
}
