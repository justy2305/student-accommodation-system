import { Link } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";

// Holding page for sidebar links whose screens arrive in later phases,
// so the links work instead of bouncing to the home page.
export default function ComingSoon({ title, description }) {
  return (
    <DashboardLayout>
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-header__title">{title}</h1>
          <p className="dashboard-header__subtitle">{description}</p>
        </div>
      </div>

      <div className="empty-state">
        <p className="empty-state__title">Coming soon</p>
        <p className="empty-state__text">This page is still being built.</p>
        <Link to="/applications" className="btn btn--secondary btn--sm">
          Back to my applications
        </Link>
      </div>
    </DashboardLayout>
  );
}
