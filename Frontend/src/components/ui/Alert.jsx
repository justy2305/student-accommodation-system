import { AlertCircleIcon, CheckCircleIcon, InfoIcon } from "../icons";

const ICONS = {
  error: AlertCircleIcon,
  success: CheckCircleIcon,
  info: InfoIcon,
};

// Pink alert box from the Figma design ("Your application is with the housing team.")
export default function Alert({ variant = "error", title, children }) {
  const Icon = ICONS[variant] ?? InfoIcon;

  return (
    <div className={`alert alert--${variant}`} role={variant === "error" ? "alert" : "status"}>
      <Icon className="alert__icon" size={20} />
      <div className="alert__content">
        {title && <p className="alert__title">{title}</p>}
        {children && <p className="alert__body">{children}</p>}
      </div>
    </div>
  );
}
