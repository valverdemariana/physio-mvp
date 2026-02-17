import { getToken } from "./auth";

export function requireToken() {
  const token = getToken();
  if (!token) window.location.href = "/login";
}
