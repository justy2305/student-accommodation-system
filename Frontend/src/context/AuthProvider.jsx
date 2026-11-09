import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../services/api";
import * as authService from "../services/authService";
import AuthContext from "./AuthContext";

// `event` records what last changed the session ("loggedIn", "registered",
// "loggedOut", "expired"). It is stored with the user in ONE state object so
// both update together, and the route guards use it to choose where to
// redirect and which message to show.
const SIGNED_OUT = { user: null, event: null };

export default function AuthProvider({ children }) {
  const [session, setSession] = useState(SIGNED_OUT);
  const [isLoading, setIsLoading] = useState(true);

  // Restore the session from the cookie when the app first loads
  useEffect(() => {
    let isActive = true;

    authService
      .getCurrentUser()
      .then((currentUser) => {
        if (isActive) setSession({ user: currentUser, event: null });
      })
      .catch(() => {
        if (isActive) setSession(SIGNED_OUT);
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

  // If any API call later says the session has expired, sign the user out
  useEffect(() => {
    const interceptorId = api.interceptors.response.use(
      (response) => response,
      (error) => {
        const url = error.config?.url ?? "";
        if (error.response?.status === 401 && !url.startsWith("/auth/")) {
          setSession((current) => (current.user ? { user: null, event: "expired" } : current));
        }
        return Promise.reject(error);
      }
    );

    return () => api.interceptors.response.eject(interceptorId);
  }, []);

  const login = useCallback(async (credentials) => {
    const user = await authService.login(credentials);
    setSession({ user, event: "loggedIn" });
    return user;
  }, []);

  const register = useCallback(async (details) => {
    const user = await authService.register(details);
    setSession({ user, event: "registered" });
    return user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setSession({ user: null, event: "loggedOut" });
    }
  }, []);

  // After the profile is saved, so the navbar and sidebar show the new details
  const updateUser = useCallback((fields) => {
    setSession((current) =>
      current.user ? { ...current, user: { ...current.user, ...fields } } : current
    );
  }, []);

  const value = useMemo(
    () => ({
      user: session.user,
      authEvent: session.event,
      isLoading,
      login,
      register,
      logout,
      updateUser,
    }),
    [session, isLoading, login, register, logout, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
