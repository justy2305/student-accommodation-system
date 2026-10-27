import Spinner from "./Spinner";

export default function Button({
  variant = "primary",
  type = "button",
  isLoading = false,
  loadingText,
  fullWidth = false,
  disabled,
  className = "",
  children,
  ...props
}) {
  const classes = ["btn", `btn--${variant}`, fullWidth && "btn--full", className]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {isLoading && <Spinner size="sm" />}
      {isLoading && loadingText ? loadingText : children}
    </button>
  );
}
