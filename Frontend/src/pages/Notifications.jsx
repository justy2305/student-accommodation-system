import { useEffect, useState } from "react";
import { BellIcon, CheckCircleIcon, ClockIcon, XCircleIcon } from "../components/icons";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import DashboardLayout from "../layouts/DashboardLayout";
import { getErrorMessage } from "../services/api";
import {
  getMyNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../services/notificationService";
import { formatRelativeTime } from "../utils/format";

// Picks the icon from the message the automatic review sent
function iconFor(message = "") {
  const text = message.toLowerCase();
  if (text.includes("approved")) return { Icon: CheckCircleIcon, tone: "success" };
  if (text.includes("not successful") || text.includes("rejected")) return { Icon: XCircleIcon, tone: "danger" };
  if (text.includes("under review")) return { Icon: ClockIcon, tone: "warning" };
  return { Icon: BellIcon, tone: "neutral" };
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loadState, setLoadState] = useState("loading"); // loading | ready | error
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [now] = useState(() => Date.now());

  useEffect(() => {
    let isCurrent = true;

    getMyNotifications()
      .then((list) => {
        if (!isCurrent) return;
        setNotifications(list);
        setLoadState("ready");
      })
      .catch((loadError) => {
        if (!isCurrent) return;
        setError(getErrorMessage(loadError, "We couldn't load your notifications."));
        setLoadState("error");
      });

    return () => {
      isCurrent = false;
    };
  }, [reloadKey]);

  const unreadCount = notifications.filter((notification) => !notification.is_read).length;

  const setRead = (ids) =>
    setNotifications((current) =>
      current.map((notification) =>
        ids === "all" || ids.includes(notification.id)
          ? { ...notification, is_read: true }
          : notification
      )
    );

  // Clicking an unread notification marks it as read straight away;
  // if the request fails it goes back to unread.
  const handleOpen = async (notification) => {
    if (notification.is_read) return;
    setRead([notification.id]);
    try {
      await markNotificationAsRead(notification.id);
    } catch {
      setNotifications((current) =>
        current.map((item) => (item.id === notification.id ? { ...item, is_read: false } : item))
      );
    }
  };

  const handleMarkAll = async () => {
    setIsMarkingAll(true);
    setError("");
    try {
      await markAllNotificationsAsRead();
      setRead("all");
    } catch (markError) {
      setError(getErrorMessage(markError, "We couldn't mark your notifications as read."));
    } finally {
      setIsMarkingAll(false);
    }
  };

  const retry = () => {
    setLoadState("loading");
    setReloadKey((key) => key + 1);
  };

  return (
    <DashboardLayout>
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-header__title">Notifications</h1>
          {loadState === "ready" && (
            <p className="dashboard-header__subtitle">
              {unreadCount > 0 ? `You have ${unreadCount} unread` : "You're all caught up"}
            </p>
          )}
        </div>
        {loadState === "ready" && unreadCount > 0 && (
          <Button
            variant="secondary"
            className="btn--sm"
            onClick={handleMarkAll}
            isLoading={isMarkingAll}
            loadingText="Marking…"
          >
            Mark all as read
          </Button>
        )}
      </div>

      {loadState === "loading" && (
        <div className="dashboard-skeleton" aria-busy="true" aria-label="Loading your notifications">
          <div className="skeleton skeleton--card" />
        </div>
      )}

      {loadState === "error" && (
        <div className="dashboard-error">
          <Alert variant="error" title="Something went wrong">
            {error}
          </Alert>
          <Button variant="secondary" className="btn--sm" onClick={retry}>
            Try again
          </Button>
        </div>
      )}

      {loadState === "ready" && error && <Alert variant="error">{error}</Alert>}

      {loadState === "ready" && notifications.length === 0 && (
        <div className="empty-state">
          <span className="empty-state__icon" aria-hidden="true">
            <BellIcon size={24} />
          </span>
          <p className="empty-state__title">No notifications yet</p>
          <p className="empty-state__text">
            We'll let you know here when there's an update on your applications.
          </p>
        </div>
      )}

      {loadState === "ready" && notifications.length > 0 && (
        <ul className="notification-list">
          {notifications.map((notification) => {
            const { Icon, tone } = iconFor(notification.message);
            const isUnread = !notification.is_read;

            return (
              <li key={notification.id}>
                <button
                  type="button"
                  className={`notification${isUnread ? " notification--unread" : ""}`}
                  onClick={() => handleOpen(notification)}
                  aria-label={isUnread ? `Unread: ${notification.message} Mark as read.` : undefined}
                >
                  <span className={`notification__icon notification__icon--${tone}`} aria-hidden="true">
                    <Icon size={18} />
                  </span>
                  <span className="notification__body">
                    <span className="notification__message">{notification.message}</span>
                    <span className="notification__time">
                      {formatRelativeTime(notification.created_at, now)}
                    </span>
                  </span>
                  {isUnread && <span className="notification__dot" aria-hidden="true" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </DashboardLayout>
  );
}
