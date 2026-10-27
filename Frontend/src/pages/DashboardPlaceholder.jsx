import { useState } from "react";
import { useLocation } from "react-router-dom";
import SiteFooter from "../components/SiteFooter";
import SiteHeader from "../components/SiteHeader";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import useAuth from "../context/useAuth";

// Landing spot after login/registration so the redirects can be tested.
// Phase 16 replaces it with the student dashboard; Phase 21 with the admin one.
export default function DashboardPlaceholder({ heading, comingIn }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const justRegistered = location.state?.notice === "registered";

  // ProtectedRoute sends the user to /login once the session is cleared
  const handleLogout = () => {
    setIsLoggingOut(true);
    logout();
  };

  return (
    <div className="page">
      <SiteHeader>
        <span className="avatar" aria-hidden="true">
          {user.first_name?.[0]}
          {user.last_name?.[0]}
        </span>
        <Button variant="secondary" className="btn--sm" onClick={handleLogout} isLoading={isLoggingOut}>
          Log out
        </Button>
      </SiteHeader>

      <main className="page__main placeholder">
        {justRegistered && (
          <Alert variant="success" title="Your account is ready">
            Welcome to FindMyhome. You're logged in.
          </Alert>
        )}

        <h1>{heading.replace("{name}", user.first_name ?? "there")}</h1>

        <div className="placeholder__card">
          <p>
            Logged in as <strong>{user.email}</strong> ({user.role}).
          </p>
          <p className="placeholder__muted">This page will be built in {comingIn}.</p>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
