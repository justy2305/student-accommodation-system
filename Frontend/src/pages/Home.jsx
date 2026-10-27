import { Link } from "react-router-dom";
import SiteFooter from "../components/SiteFooter";
import SiteHeader from "../components/SiteHeader";
import { ArrowRightIcon } from "../components/icons";
import useAuth from "../context/useAuth";
import { getHomePathForRole } from "../utils/redirects";

// Temporary landing page. Phase 17 replaces it with the Explore page
// (search bar, filter chips and listing grid) from the Figma design.
export default function Home() {
  const { user } = useAuth();

  return (
    <div className="page">
      <SiteHeader>
        {user ? (
          <Link to={getHomePathForRole(user.role)} className="btn btn--secondary btn--sm">
            My dashboard
          </Link>
        ) : (
          <>
            <Link to="/login" className="text-link">
              Log in
            </Link>
            <Link to="/register" className="btn btn--primary btn--sm">
              Create account
            </Link>
          </>
        )}
      </SiteHeader>

      <main className="page__main home-hero">
        <h1>Your next chapter starts here.</h1>
        <p>Find a student home that fits your campus, your budget and you.</p>

        <div className="home-hero__actions">
          {user ? (
            <Link to={getHomePathForRole(user.role)} className="btn btn--primary">
              Go to my dashboard <ArrowRightIcon size={18} />
            </Link>
          ) : (
            <>
              <Link to="/register" className="btn btn--primary">
                Create your account <ArrowRightIcon size={18} />
              </Link>
              <Link to="/login" className="btn btn--secondary">
                Log in
              </Link>
            </>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
