import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuth from "../context/useAuth";
import PageLoader from "./PageLoader";

// Only logged-in students get through. This is for the user experience only:
// the API checks the login token on every protected request.
export default function ProtectedRoute({ children }) {
  const { user, authEvent, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <PageLoader />;
  }

  if (!user) {
    // Logged out on purpose: no "come back here" link
    if (authEvent === "loggedOut") {
      return <Navigate to="/login" replace state={{ notice: "loggedOut" }} />;
    }

    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname + location.search,
          notice: authEvent === "expired" ? "sessionExpired" : "loginRequired",
        }}
      />
    );
  }

  return children ?? <Outlet />;
}
