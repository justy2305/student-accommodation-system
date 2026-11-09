import { NavLink } from "react-router-dom";
import useAuth from "../context/useAuth";
import { getInitials, getRoleLabel, getShortName } from "../utils/user";
import { BellIcon, FileTextIcon } from "./icons";

const ITEMS = [
  { to: "/applications", label: "My applications", icon: FileTextIcon },
  { to: "/notifications", label: "Notifications", icon: BellIcon },
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
          <p className="sidebar__role">{getRoleLabel(user)}</p>
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
    </div>
  );
}
