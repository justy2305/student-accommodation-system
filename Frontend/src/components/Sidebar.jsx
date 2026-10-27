import { NavLink } from "react-router-dom";
import useAuth from "../context/useAuth";
import { getInitials, getShortName } from "../utils/user";
import { BellIcon, FileTextIcon, HeartIcon, MessageCircleIcon, UserIcon } from "./icons";

const ITEMS = [
  { to: "/applications", label: "My applications", icon: FileTextIcon },
  { to: "/saved", label: "Saved homes", icon: HeartIcon },
  { to: "/notifications", label: "Notifications", icon: BellIcon },
  { to: "/profile", label: "My profile", icon: UserIcon },
];

const linkClass = ({ isActive }) => `sidebar__link${isActive ? " is-active" : ""}`;

export default function Sidebar() {
  const { user } = useAuth();

  return (
    <div className="sidebar">
      <div className="sidebar__profile">
        <span className="avatar" aria-hidden="true">
          {getInitials(user)}
        </span>
        <div>
          <p className="sidebar__name">{getShortName(user)}</p>
          <p className="sidebar__role">{user?.role === "admin" ? "Administrator" : "Student"}</p>
        </div>
      </div>

      <nav aria-label="Dashboard">
        <ul className="sidebar__nav">
          {ITEMS.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink to={to} className={linkClass}>
                <Icon size={18} />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="help-card">
        <MessageCircleIcon className="help-card__icon" size={22} />
        <p className="help-card__title">A little help settling in?</p>
        <p>Questions about an application? Contact the housing team listed on the accommodation.</p>
      </div>
    </div>
  );
}
