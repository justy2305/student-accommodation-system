import axios from "axios";

const api = axios.create({
  // In development, always go through the Vite proxy (/api → localhost:5000,
  // see vite.config.js), so the browser never makes a cross-origin call and the
  // login cookie just works. VITE_API_URL is only used for production builds.
  baseURL: import.meta.env.DEV ? "/api" : import.meta.env.VITE_API_URL || "/api",
  // Send the httpOnly session cookie with every request
  withCredentials: true,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Turns any Axios error into a message that is safe to show the user.
export function getErrorMessage(error, fallback = "Something went wrong. Please try again.") {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  if (error?.code === "ECONNABORTED") {
    return "The server took too long to respond. Please try again.";
  }

  if (error?.response?.status >= 500 || !error?.response) {
    return "We can't reach the server right now. Check that the backend is running and try again.";
  }

  return fallback;
}

export default api;
