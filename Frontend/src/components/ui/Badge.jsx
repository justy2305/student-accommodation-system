// Small rounded status label: variant = neutral | warning | success | error
export default function Badge({ variant = "neutral", children }) {
  return <span className={`badge badge--${variant}`}>{children}</span>;
}
