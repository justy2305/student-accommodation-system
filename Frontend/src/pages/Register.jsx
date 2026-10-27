import { useState } from "react";
import { Link } from "react-router-dom";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import PasswordField from "../components/ui/PasswordField";
import TextField from "../components/ui/TextField";
import useAuth from "../context/useAuth";
import AuthLayout from "../layouts/AuthLayout";
import { getErrorMessage } from "../services/api";
import {
  MIN_PASSWORD_LENGTH,
  focusFirstError,
  hasErrors,
  validateRegistration,
} from "../utils/validation";

const FIELD_ORDER = ["firstName", "lastName", "email", "phone", "password", "confirmPassword"];

const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
};

export default function Register() {
  const { register } = useAuth();

  const [values, setValues] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    const errors = validateRegistration(values);

    setFormError("");
    setFieldErrors(errors);

    if (hasErrors(errors)) {
      focusFirstError(form, errors, FIELD_ORDER);
      return;
    }

    setIsSubmitting(true);

    try {
      // The backend logs the new student in; GuestRoute then redirects to the dashboard
      await register({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        password: values.password,
      });
    } catch (error) {
      const message = getErrorMessage(error, "We couldn't create your account. Please try again.");
      setIsSubmitting(false);

      // Email already registered: show it on the email field itself
      if (error.response?.status === 409) {
        setFieldErrors({ email: message });
        form.elements.namedItem("email")?.focus();
      } else {
        setFormError(message);
      }
    }
  };

  return (
    <AuthLayout
      title="Find your home"
      subtitle="Create your student account to save homes and apply for accommodation."
      headerAction={
        <>
          <span className="site-header__prompt">Already have an account?</span>
          <Link to="/login" className="btn btn--secondary btn--sm">
            Log in
          </Link>
        </>
      }
    >
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {formError && (
          <Alert variant="error" title="Registration failed">
            {formError}
          </Alert>
        )}

        <div className="auth-form__row">
          <TextField
            id="firstName"
            name="firstName"
            label="First name"
            placeholder="Your name"
            autoComplete="given-name"
            value={values.firstName}
            onChange={handleChange}
            error={fieldErrors.firstName}
            required
          />
          <TextField
            id="lastName"
            name="lastName"
            label="Last name"
            placeholder="Your surname"
            autoComplete="family-name"
            value={values.lastName}
            onChange={handleChange}
            error={fieldErrors.lastName}
            required
          />
        </div>

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

        <TextField
          id="phone"
          name="phone"
          type="tel"
          label="Phone number"
          optional
          placeholder="+264 81 234 5678"
          autoComplete="tel"
          value={values.phone}
          onChange={handleChange}
          error={fieldErrors.phone}
        />

        <PasswordField
          id="password"
          name="password"
          label="Password"
          placeholder="Create a password"
          autoComplete="new-password"
          value={values.password}
          onChange={handleChange}
          error={fieldErrors.password}
          hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
          required
        />

        <PasswordField
          id="confirmPassword"
          name="confirmPassword"
          label="Confirm password"
          placeholder="Type your password again"
          autoComplete="new-password"
          value={values.confirmPassword}
          onChange={handleChange}
          error={fieldErrors.confirmPassword}
          required
        />

        <Button
          type="submit"
          fullWidth
          isLoading={isSubmitting}
          loadingText="Creating your account…"
          className="auth-form__submit"
        >
          Create account
        </Button>
      </form>

      <p className="auth-card__switch">
        Already have an account?{" "}
        <Link to="/login" className="text-link">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}
