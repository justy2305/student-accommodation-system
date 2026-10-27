// With a label it announces itself to screen readers; without one it is decorative.
export default function Spinner({ size = "md", label }) {
  if (label) {
    return (
      <span role="status" className="spinner-wrap">
        <span className={`spinner spinner--${size}`} aria-hidden="true" />
        <span className="visually-hidden">{label}</span>
      </span>
    );
  }

  return <span className={`spinner spinner--${size}`} aria-hidden="true" />;
}
