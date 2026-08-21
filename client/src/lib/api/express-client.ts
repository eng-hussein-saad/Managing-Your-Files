import axios from "axios";
import { accessToken } from "../../features/auth/auth-store";
import { publicEnv } from "../config/public-env";
/** Calls normal Express APIs directly from the browser. */
export const expressClient = axios.create({
  baseURL: publicEnv().NEXT_PUBLIC_API_BASE_URL,
  withCredentials: false,
});
expressClient.interceptors.request.use((config) => {
  const token = accessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
