export const MIN_PASSWORD_LENGTH = 8;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[0-9\s-]{7,20}$/;

export function hasErrors(errors) {
  return Object.values(errors).some(Boolean);
}

function validateEmail(email) {
  const trimmed = email.trim();
  if (!trimmed) return "Enter your email address.";
  if (!EMAIL_PATTERN.test(trimmed)) return "Enter a valid email address, like name@example.com.";
  return undefined;
}

export function validateLogin({ email, password }) {
  return {
    email: validateEmail(email),
    password: password ? undefined : "Enter your password.",
  };
}

export function validateRegistration({ firstName, lastName, email, phone, password, confirmPassword }) {
  const errors = {
    firstName: firstName.trim() ? undefined : "Enter your first name.",
    lastName: lastName.trim() ? undefined : "Enter your last name.",
    email: validateEmail(email),
    phone:
      phone.trim() && !PHONE_PATTERN.test(phone.trim())
        ? "Enter a valid phone number, like +264 81 234 5678."
        : undefined,
    password: undefined,
    confirmPassword: undefined,
  };

  if (!password) {
    errors.password = "Create a password.";
  } else if (password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  }

  if (!confirmPassword) {
    errors.confirmPassword = "Confirm your password.";
  } else if (confirmPassword !== password) {
    errors.confirmPassword = "Passwords don't match.";
  }

  return errors;
}

// Focus the first field with an error so keyboard and screen-reader users land on it
export function focusFirstError(form, errors, fieldOrder) {
  const firstInvalid = fieldOrder.find((name) => errors[name]);
  if (firstInvalid) form.elements.namedItem(firstInvalid)?.focus();
}
