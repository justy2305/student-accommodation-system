import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import ApplicationCard from "../components/ApplicationCard";
import StatCard from "../components/StatCard";
import UpdatesPanel from "../components/UpdatesPanel";
import { ArrowUpRightIcon, BellIcon, CheckCircleIcon, FileTextIcon, HeartIcon } from "../components/icons";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import useAuth from "../context/useAuth";
import DashboardLayout from "../layouts/DashboardLayout";
import { getErrorMessage } from "../services/api";
import { getMyApplications } from "../services/applicationService";
import { getMyNotifications } from "../services/notificationService";
import { formatDate } from "../utils/format";
import { isActiveApplication } from "../utils/status";

const TABS = [
  { id: "active", label: "Active" },
  { id: "past", label: "Past applications" },
];

const EMPTY_MESSAGES = {
  active: {
    title: "No active applications",
    text: "Find a home you like and apply. Your applications will show up here so you can track them.",
  },
  past: {
    title: "No past applications yet",
    text: "Approved and rejected applications will move here.",
  },
};

export default function StudentDashboard() {
  const { user } = useAuth();
  const location = useLocation();

  const [data, setData] = useState({ applications: [], notifications: [], loadedAt: null });
  const [loadState, setLoadState] = useState("loading"); // loading | ready | error
  const [errorMessage, setErrorMessage] = useState("");
  const [activeTab, setActiveTab] = useState("active");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isCurrent = true;

    // Notifications are optional: if only they fail, the page still shows applications
    Promise.allSettled([getMyApplications(), getMyNotifications()]).then(
      ([applicationsResult, notificationsResult]) => {
        if (!isCurrent) return;

        if (applicationsResult.status === "rejected") {
          setErrorMessage(
            getErrorMessage(applicationsResult.reason, "We couldn't load your applications.")
          );
          setLoadState("error");
          return;
        }

        setData({
          applications: applicationsResult.value,
          notifications:
            notificationsResult.status === "fulfilled" ? notificationsResult.value : [],
          loadedAt: new Date(),
        });
        setLoadState("ready");
      }
    );

    return () => {
      isCurrent = false;
    };
  }, [reloadKey]);

  const retry = () => {
    setLoadState("loading");
    setReloadKey((key) => key + 1);
  };

  const { applications, notifications, loadedAt } = data;
  const activeApplications = applications.filter((app) => isActiveApplication(app.status));
  const pastApplications = applications.filter((app) => !isActiveApplication(app.status));
  const approvedCount = applications.filter((app) => app.status === "Approved").length;
  const unreadCount = notifications.filter((notification) => !notification.is_read).length;

  const tabCounts = { active: activeApplications.length, past: pastApplications.length };
  const shownApplications = activeTab === "active" ? activeApplications : pastApplications;
  const isReady = loadState === "ready";

  return (
    <DashboardLayout
      unreadCount={unreadCount}
      aside={
        isReady && (
          <>
            <UpdatesPanel notifications={notifications} now={loadedAt} />

            <section className="panel panel--warm" aria-labelledby="options-title">
              <HeartIcon className="panel__icon" size={22} />
              <h2 id="options-title" className="panel__title">
                Keep your options open
              </h2>
              <p className="panel__text">
                Browse more student homes while you wait to hear back from the housing teams.
              </p>
              <Link to="/" className="text-link panel__link">
                Explore homes
              </Link>
            </section>
          </>
        )
      }
    >
      {location.state?.notice === "registered" && (
        <Alert variant="success" title="Your account is ready">
          Welcome to FindMyhome. You're logged in.
        </Alert>
      )}

      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-header__title">Your next chapter, in progress.</h1>
          <p className="dashboard-header__subtitle">
            Hi {user?.first_name ?? "there"}, keep an eye on your applications and we'll keep you in
            the loop.
          </p>
        </div>
        <Link to="/" className="btn btn--secondary btn--sm">
          Explore homes <ArrowUpRightIcon size={16} />
        </Link>
      </div>

      {loadState === "loading" && <DashboardSkeleton />}

      {loadState === "error" && (
        <div className="dashboard-error">
          <Alert variant="error" title="Something went wrong">
            {errorMessage}
          </Alert>
          <Button variant="secondary" className="btn--sm" onClick={retry}>
            Try again
          </Button>
        </div>
      )}

      {isReady && (
        <>
          <div className="stat-grid">
            <StatCard
              icon={FileTextIcon}
              value={activeApplications.length}
              label={activeApplications.length === 1 ? "Active application" : "Active applications"}
            />
            <StatCard icon={CheckCircleIcon} value={approvedCount} label="Approved" />
            <StatCard
              icon={BellIcon}
              value={unreadCount}
              label={unreadCount === 1 ? "Unread update" : "Unread updates"}
            />
          </div>

          <section aria-label="Your applications">
            <div className="tabs-bar">
              <div className="tabs" role="tablist" aria-label="Applications">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    id={`tab-${tab.id}`}
                    className="tab"
                    aria-selected={activeTab === tab.id}
                    aria-controls="applications-panel"
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.label} ({tabCounts[tab.id]})
                  </button>
                ))}
              </div>
              <p className="tabs-bar__date">{formatDate(loadedAt)}</p>
            </div>

            <div
              id="applications-panel"
              role="tabpanel"
              aria-labelledby={`tab-${activeTab}`}
              className="application-list"
            >
              {shownApplications.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-state__icon">
                    <FileTextIcon size={22} />
                  </span>
                  <p className="empty-state__title">{EMPTY_MESSAGES[activeTab].title}</p>
                  <p className="empty-state__text">{EMPTY_MESSAGES[activeTab].text}</p>
                  {activeTab === "active" && (
                    <Link to="/" className="btn btn--primary btn--sm">
                      Explore homes
                    </Link>
                  )}
                </div>
              ) : (
                shownApplications.map((application) => (
                  <ApplicationCard key={application.id} application={application} />
                ))
              )}
            </div>
          </section>
        </>
      )}
    </DashboardLayout>
  );
}

function DashboardSkeleton() {
  return (
    <div className="dashboard-skeleton" role="status">
      <span className="visually-hidden">Loading your applications</span>
      <div className="stat-grid" aria-hidden="true">
        <div className="skeleton skeleton--stat" />
        <div className="skeleton skeleton--stat" />
        <div className="skeleton skeleton--stat" />
      </div>
      <div className="skeleton skeleton--card" aria-hidden="true" />
    </div>
  );
}
