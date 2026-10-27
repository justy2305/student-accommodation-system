import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuth from "../context/useAuth";
import { getHomePathForRole } from "../utils/redirects";
import PageLoader from "./PageLoader";

// Only logged-in users get through. `allowedRoles` limits it further (e.g. ["admin"]).
// This is for the user experience only: the API must still check the token and role.
export default function ProtectedRoute({ allowedRoles, children }) {
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

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={getHomePathForRole(user.role)} replace />;
  }

  return children ?? <Outlet />;
}
