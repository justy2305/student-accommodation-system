import SiteFooter from "../components/SiteFooter";
import SiteHeader from "../components/SiteHeader";
import { GraduationCapIcon } from "../components/icons";

// Centred form card in the style of the Figma "Make this your next home" card.
export default function AuthLayout({ title, subtitle, headerAction, children }) {
  return (
    <div className="page">
      <SiteHeader>{headerAction}</SiteHeader>

      <main className="auth-main">
        <section className="auth-card" aria-labelledby="auth-title">
          <span className="tag">
            <GraduationCapIcon size={16} />
            Built for student living
          </span>
          <h1 id="auth-title" className="auth-card__title">
            {title}
          </h1>
          {subtitle && <p className="auth-card__subtitle">{subtitle}</p>}
          {children}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
