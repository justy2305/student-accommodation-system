import { Link } from "react-router-dom";
import useAuth from "../context/useAuth";
import Navbar from "./Navbar";
import SiteHeader from "./SiteHeader";

// Public pages: the full navbar for logged-in users, log in / sign up otherwise
export default function AppHeader() {
  const { user } = useAuth();

  if (user) return <Navbar />;

  return (
    <SiteHeader>
      <Link to="/login" className="text-link">
        Log in
      </Link>
      <Link to="/register" className="btn btn--primary btn--sm site-header__signup">
        Create account
      </Link>
    </SiteHeader>
  );
}
