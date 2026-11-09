// Dropdown with the same label, hint and error layout as TextField
export default function SelectField({
  id,
  label,
  error,
  hint,
  optional = false,
  options,
  placeholder = "Choose one",
  ...selectProps
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

      <div className="field__control">
        <select
          id={id}
          className="field__input field__select"
          aria-invalid={error ? "true" : undefined}
          aria-describedby={describedBy}
          {...selectProps}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
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
