import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import ApplicationCard from "../components/ApplicationCard";
import MyAccommodationCard from "../components/MyAccommodationCard";
import StatCard from "../components/StatCard";
import { BellIcon, CheckCircleIcon, FileTextIcon } from "../components/icons";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import useAuth from "../context/useAuth";
import DashboardLayout from "../layouts/DashboardLayout";
import { getErrorMessage } from "../services/api";
import { getMyApplications } from "../services/applicationService";
import { getMyNotifications } from "../services/notificationService";
import { formatDate } from "../utils/format";
import { getLeaseProgress } from "../utils/lease";
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

  // While an application is still being reviewed, check every 15 seconds so
  // the new status appears without a refresh
  const hasOpenReview = data.applications.some(
    (app) => app.status === "Pending" || app.status === "Under Review"
  );

  useEffect(() => {
    if (!hasOpenReview) return undefined;

    const timer = setInterval(() => {
      Promise.all([getMyApplications(), getMyNotifications()])
        .then(([applications, notifications]) => {
          setData({ applications, notifications, loadedAt: new Date() });
        })
        .catch(() => {});
    }, 15000);

    return () => clearInterval(timer);
  }, [hasOpenReview]);

  const { applications, notifications, loadedAt } = data;
  const activeApplications = applications.filter((app) => isActiveApplication(app.status));
  const pastApplications = applications.filter((app) => !isActiveApplication(app.status));
  const approvedCount = applications.filter((app) => app.status === "Approved").length;
  const unreadCount = notifications.filter((notification) => !notification.is_read).length;

  // The student's current home: the newest approved application whose lease
  // hasn't ended (or has no dates yet); otherwise their newest approved one.
  const approvedApplications = applications.filter((app) => app.status === "Approved");
  const currentHome =
    approvedApplications.find(
      (app) => !app.lease_end || getLeaseProgress(app.lease_start, app.lease_end, loadedAt)?.phase !== "ended"
    ) ??
    approvedApplications[0] ??
    null;

  // After signing, swap in the updated application (keeping its accommodation details)
  const handleLeaseSigned = (updated) => {
    setData((previous) => ({
      ...previous,
      applications: previous.applications.map((app) => (app.id === updated.id ? { ...app, ...updated } : app)),
    }));
  };

  // After withdrawing, drop the application and its notifications (the
  // backend deletes those with it)
  const handleWithdrawn = (applicationId) => {
    setData((previous) => ({
      ...previous,
      applications: previous.applications.filter((app) => app.id !== applicationId),
      notifications: previous.notifications.filter((item) => item.application_id !== applicationId),
    }));
  };

  const tabCounts = { active: activeApplications.length, past: pastApplications.length };
  const shownApplications = activeTab === "active" ? activeApplications : pastApplications;
  const isReady = loadState === "ready";

  return (
    <DashboardLayout unreadCount={unreadCount}>
      {location.state?.notice === "applied" && (
        <Alert variant="success" title="Application sent">
          You'll get a decision in about 2 minutes. This page updates by itself, and we'll notify you.
        </Alert>
      )}

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
          {currentHome && (
            <MyAccommodationCard application={currentHome} now={loadedAt} onSigned={handleLeaseSigned} />
          )}

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
                  <ApplicationCard
                    key={application.id}
                    application={application}
                    onWithdrawn={handleWithdrawn}
                  />
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
