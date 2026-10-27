import { Link } from "react-router-dom";
import { formatRelativeTime } from "../utils/format";
import { BellIcon, CheckCircleIcon, ClockIcon, XCircleIcon } from "./icons";

// The backend message ends with the new status, e.g. "...updated to: Approved."
function iconFor(message = "") {
  if (message.includes("Approved")) return CheckCircleIcon;
  if (message.includes("Rejected")) return XCircleIcon;
  if (message.includes("Under Review")) return ClockIcon;
  return BellIcon;
}

// "Your updates" card in the dashboard's right column (latest 3).
// The full notifications page is Phase 20.
export default function UpdatesPanel({ notifications, now }) {
  const unreadCount = notifications.filter((notification) => !notification.is_read).length;
  const latest = notifications.slice(0, 3);

  return (
    <section className="panel" aria-labelledby="updates-title">
      <div className="panel__header">
        <h2 id="updates-title" className="panel__title">
          Your updates
        </h2>
        {unreadCount > 0 && <span className="pill">{unreadCount} new</span>}
      </div>

      {latest.length === 0 ? (
        <p className="panel__text">No updates yet. We'll let you know when something changes.</p>
      ) : (
        <ul className="updates">
          {latest.map((notification) => {
            const Icon = iconFor(notification.message);
            return (
              <li
                key={notification.id}
                className={`update${notification.is_read ? "" : " update--unread"}`}
              >
                <Icon className="update__icon" size={18} />
                <div>
                  <p className="update__message">
                    {!notification.is_read && <span className="visually-hidden">Unread: </span>}
                    {notification.message}
                  </p>
                  <p className="update__time">{formatRelativeTime(notification.created_at, now)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Link to="/notifications" className="text-link panel__link">
        View all notifications
      </Link>
    </section>
  );
}
