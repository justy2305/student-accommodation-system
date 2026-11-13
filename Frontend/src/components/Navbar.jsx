import { useEffect, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import useAuth from "../context/useAuth";
import { getFullName, getInitials } from "../utils/user";
import Logo from "./Logo";
import { BellIcon, LogOutIcon, MenuIcon, UserIcon } from "./icons";

const NAV_LINKS = [
  { to: "/", label: "Explore", end: true },
  { to: "/applications", label: "My applications" },
];

const navLinkClass = ({ isActive }) => `navbar__link${isActive ? " is-active" : ""}`;

// Full navbar from the Figma design (logged-in pages)
export default function Navbar() {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close the account menu on outside click or Escape
  useEffect(() => {
    if (!isMenuOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) setIsMenuOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setIsMenuOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="navbar">
      <div className="navbar__inner">
        <Logo />

        <nav className="navbar__links" aria-label="Main">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={navLinkClass}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="navbar__actions">
          <div className="account-menu" ref={menuRef}>
            <button
              type="button"
              className="account-menu__trigger"
              aria-expanded={isMenuOpen}
              aria-controls="account-menu"
              onClick={() => setIsMenuOpen((open) => !open)}
            >
              <MenuIcon size={18} />
              <span className="avatar avatar--sm" aria-hidden="true">
                {getInitials(user)}
              </span>
              <span className="visually-hidden">Account menu</span>
            </button>

            {isMenuOpen && (
              <div id="account-menu" className="account-menu__panel">
                <div className="account-menu__header">
                  <p className="account-menu__name">{getFullName(user)}</p>
                  <p className="account-menu__email">{user?.email}</p>
                </div>

                {/* On phones the main links live here, because the navbar links are hidden */}
                <nav className="account-menu__mobile-links" aria-label="Main">
                  {NAV_LINKS.map((link) => (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      end={link.end}
                      className="account-menu__item"
                      onClick={closeMenu}
                    >
                      {link.label}
                    </NavLink>
                  ))}
                  <div className="account-menu__divider" />
                </nav>

                <Link to="/notifications" className="account-menu__item" onClick={closeMenu}>
                  <BellIcon size={18} />
                  Notifications
                </Link>
                <Link to="/profile" className="account-menu__item" onClick={closeMenu}>
                  <UserIcon size={18} />
                  My profile
                </Link>
                <button type="button" className="account-menu__item" onClick={logout}>
                  <LogOutIcon size={18} />
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
