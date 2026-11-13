import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import SiteFooter from "../components/SiteFooter";

// Navbar + three columns (sidebar | main | right column) + footer,
// as in the Figma "Student application tracking dashboard" frame.
export default function DashboardLayout({ aside, children }) {
  return (
    <div className="page">
      <Navbar />

      <div className={`dashboard${aside ? "" : " dashboard--no-aside"}`}>
        <div className="dashboard__sidebar">
          <Sidebar />
        </div>

        <main className="dashboard__main">{children}</main>

        {aside && (
          <aside className="dashboard__aside" aria-label="Updates">
            {aside}
          </aside>
        )}
      </div>

      <SiteFooter />
    </div>
  );
}
