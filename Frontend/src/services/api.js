import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
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
