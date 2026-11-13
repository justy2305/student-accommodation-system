import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuth from "../context/useAuth";
import { getPostLoginPath } from "../utils/redirects";
import PageLoader from "./PageLoader";

// Wraps Login and Register. As soon as there is a user (already logged in, or
// the form just succeeded) this sends them on: back to the page they were
// trying to open, or to their dashboard. All post-login redirects happen here.
export default function GuestRoute({ children }) {
  const { user, authEvent, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <PageLoader />;
  }

  if (user) {
    return (
      <Navigate
        to={getPostLoginPath(location.state?.from)}
        replace
        state={authEvent === "registered" ? { notice: "registered" } : undefined}
      />
    );
  }

  return children ?? <Outlet />;
}
