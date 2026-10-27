// Label above a bordered input, as in the Figma application form.
// `children` render inside the input box (used for the show-password button).
export default function TextField({
  id,
  label,
  error,
  hint,
  optional = false,
  children,
  ...inputProps
}) {
  const showHint = hint && !error;
  const describedBy =
    [showHint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;

  return (
    <div className={`field${error ? " field--invalid" : ""}`}>
      <label className="field__label" htmlFor={id}>
        {label}
        {optional && <span className="field__optional"> (optional)</span>}
      </label>

      <div className={`field__control${children ? " field__control--with-action" : ""}`}>
        <input
          id={id}
          className="field__input"
          aria-invalid={error ? "true" : undefined}
          aria-describedby={describedBy}
          {...inputProps}
        />
        {children}
      </div>

      {showHint && (
        <p id={`${id}-hint`} className="field__hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="field__error">
          {error}
        </p>
      )}
    </div>
  );
}
