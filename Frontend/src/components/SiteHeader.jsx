import Logo from "./Logo";

// Slim version of the Figma navbar. The full Explore / Saved / My applications
// navigation arrives with the dashboard in Phase 16.
export default function SiteHeader({ children }) {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Logo />
        {children && <div className="site-header__actions">{children}</div>}
      </div>
    </header>
  );
}
