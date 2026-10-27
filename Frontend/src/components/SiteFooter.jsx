export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <p>© {year} FindMyhome · Student living, made simpler.</p>
      </div>
    </footer>
  );
}
