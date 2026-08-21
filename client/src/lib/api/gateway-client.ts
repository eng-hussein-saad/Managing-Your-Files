import axios from "axios";
/** Calls only the same-origin login, refresh, and logout gateway operations. */
export const gatewayClient = axios.create({
  baseURL: "/api/auth",
  headers: { "Content-Type": "application/json" },
});
