import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import PasswordField from "../components/ui/PasswordField";
import TextField from "../components/ui/TextField";
import useAuth from "../context/useAuth";
import AuthLayout from "../layouts/AuthLayout";
import { getErrorMessage } from "../services/api";
import { focusFirstError, hasErrors, validateLogin } from "../utils/validation";

const FIELD_ORDER = ["email", "password"];

const NOTICES = {
  loginRequired: { variant: "info", text: "Please log in to continue." },
  sessionExpired: { variant: "info", text: "Your session has expired. Please log in again." },
  loggedOut: { variant: "success", text: "You've been logged out. See you soon." },
};

export default function Login() {
  const { login } = useAuth();
  const location = useLocation();

  const [values, setValues] = useState({ email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const notice = NOTICES[location.state?.notice];

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((previous) => ({ ...previous, [name]: value }));

    if (fieldErrors[name]) {
      setFieldErrors((previous) => ({ ...previous, [name]: undefined }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    const form = event.currentTarget;
    const errors = validateLogin(values);

    setFormError("");
    setFieldErrors(errors);

    if (hasErrors(errors)) {
      focusFirstError(form, errors, FIELD_ORDER);
      return;
    }

    setIsSubmitting(true);

    try {
      // On success GuestRoute redirects (back to the page they wanted, or the dashboard)
      await login({ email: values.email.trim(), password: values.password });
    } catch (error) {
      setFormError(getErrorMessage(error, "We couldn't log you in. Please try again."));
      setValues((previous) => ({ ...previous, password: "" }));
      setIsSubmitting(false);
      form.elements.namedItem("password")?.focus();
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      headerAction={
        <>
          <Link to="/register" className="btn btn--secondary btn--sm">
            Create account
          </Link>
        </>
      }
    >
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {formError ? (
          <Alert variant="error" title="Login failed">
            {formError}
          </Alert>
        ) : (
          notice && <Alert variant={notice.variant}>{notice.text}</Alert>
        )}

        <TextField
          id="email"
          name="email"
          type="email"
          label="Email address"
          placeholder="name@example.com"
          autoComplete="email"
          inputMode="email"
          value={values.email}
          onChange={handleChange}
          error={fieldErrors.email}
          required
        />

        <PasswordField
          id="password"
          name="password"
          label="Password"
          placeholder="Enter your password"
          autoComplete="current-password"
          value={values.password}
          onChange={handleChange}
          error={fieldErrors.password}
          required
        />

        <Button
          type="submit"
          fullWidth
          isLoading={isSubmitting}
          loadingText="Logging in…"
          className="auth-form__submit"
        >
          Log in
        </Button>
      </form>

      <p className="auth-card__switch">
        Don't have an account?{" "}
        <Link to="/register" className="text-link">
          Create one
        </Link>
      </p>
    </AuthLayout>
  );
}
