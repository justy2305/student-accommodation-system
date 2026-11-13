import { useEffect, useRef, useState } from "react";
import { CheckCircleIcon, GraduationCapIcon, UserIcon } from "../components/icons";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import SelectField from "../components/ui/SelectField";
import TextField from "../components/ui/TextField";
import useAuth from "../context/useAuth";
import DashboardLayout from "../layouts/DashboardLayout";
import { getErrorMessage } from "../services/api";
import { getMyNotifications } from "../services/notificationService";
import { getMyProfile, updateMyProfile } from "../services/profileService";
import { formatDate } from "../utils/format";
import {
  getFullName,
  getInitials,
  getUniversityName,
  getYearLabel,
  UNIVERSITIES,
  YEARS_OF_STUDY,
} from "../utils/user";
import { focusFirstError, hasErrors } from "../utils/validation";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[0-9\s-]{7,20}$/;
const STUDENT_NUMBER_PATTERN = /^[A-Za-z0-9-]{4,20}$/;

const UNIVERSITY_OPTIONS = [...UNIVERSITIES, { value: "other", label: "Other university" }];

// Order of the fields on screen, so the first error gets focus
const FIELD_ORDER = [
  "first_name",
  "last_name",
  "email",
  "phone",
  "university",
  "other_university",
  "student_number",
  "programme",
  "year_of_study",
];

// API profile → form values (inputs always hold strings)
function profileToForm(profile) {
  const institution = profile.institution ?? "";
  const isListed = UNIVERSITIES.some((university) => university.value === institution);

  return {
    first_name: profile.first_name ?? "",
    last_name: profile.last_name ?? "",
    email: profile.email ?? "",
    phone: profile.phone ?? "",
    university: institution === "" ? "" : isListed ? institution : "other",
    other_university: institution !== "" && !isListed ? institution : "",
    student_number: profile.student_number ?? "",
    programme: profile.programme ?? "",
    year_of_study: profile.year_of_study ? String(profile.year_of_study) : "",
  };
}

// Form values → what PUT /api/users/me expects
function formToPayload(form) {
  const institution =
    form.university === "other" ? form.other_university.trim() : form.university;

  return {
    first_name: form.first_name.trim(),
    last_name: form.last_name.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
    institution,
    student_number: form.student_number.trim(),
    programme: form.programme.trim(),
    year_of_study: form.year_of_study === "" ? null : Number(form.year_of_study),
  };
}

function validateProfile(form) {
  const email = form.email.trim();
  const phone = form.phone.trim();
  const studentNumber = form.student_number.trim();

  return {
    first_name: form.first_name.trim() ? undefined : "Enter your first name.",
    last_name: form.last_name.trim() ? undefined : "Enter your last name.",
    email: !email
      ? "Enter your email address."
      : EMAIL_PATTERN.test(email)
        ? undefined
        : "Enter a valid email address, like name@example.com.",
    phone:
      phone && !PHONE_PATTERN.test(phone)
        ? "Enter a valid phone number, like +264 81 234 5678."
        : undefined,
    other_university:
      form.university === "other" && !form.other_university.trim()
        ? "Enter the name of your university."
        : undefined,
    student_number:
      studentNumber && !STUDENT_NUMBER_PATTERN.test(studentNumber)
        ? "Use 4 to 20 letters or numbers, like 224012345."
        : undefined,
  };
}

// The API names fields like the database; map them back to form fields
function mapServerErrors(errors, form) {
  if (!errors) return {};
  const { institution, ...rest } = errors;
  if (!institution) return rest;
  return { ...rest, [form.university === "other" ? "other_university" : "university"]: institution };
}

function isSameForm(a, b) {
  return FIELD_ORDER.every((name) => a[name] === b[name]);
}

export default function Profile() {
  const { updateUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(null);
  const [loadState, setLoadState] = useState("loading"); // loading | ready | error
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  const [errors, setErrors] = useState({});
  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const formRef = useRef(null);

  useEffect(() => {
    let isCurrent = true;

    getMyProfile()
      .then((loaded) => {
        if (!isCurrent) return;
        setProfile(loaded);
        setForm(profileToForm(loaded));
        setLoadState("ready");
      })
      .catch((error) => {
        if (!isCurrent) return;
        setLoadError(getErrorMessage(error, "We couldn't load your profile."));
        setLoadState("error");
      });

    // Only for the bell badge in the navbar; the page works without it
    getMyNotifications()
      .then((notifications) => {
        if (isCurrent) setUnreadCount(notifications.filter((item) => !item.is_read).length);
      })
      .catch(() => {});

    return () => {
      isCurrent = false;
    };
  }, [reloadKey]);

  const isDirty = Boolean(profile && form && !isSameForm(form, profileToForm(profile)));

  // Warn before closing or reloading the tab with unsaved changes
  useEffect(() => {
    if (!isDirty) return undefined;
    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setJustSaved(false);
    // Clear a field's error as soon as the student edits it
    if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }));
    if (name === "university" && errors.other_university) {
      setErrors((current) => ({ ...current, other_university: undefined }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaveError("");
    setJustSaved(false);

    const clientErrors = validateProfile(form);
    if (hasErrors(clientErrors)) {
      setErrors(clientErrors);
      focusFirstError(formRef.current, clientErrors, FIELD_ORDER);
      return;
    }

    setIsSaving(true);
    try {
      const saved = await updateMyProfile(formToPayload(form));
      setProfile(saved);
      setForm(profileToForm(saved));
      setErrors({});
      setJustSaved(true);
      updateUser({
        first_name: saved.first_name,
        last_name: saved.last_name,
        email: saved.email,
        phone: saved.phone,
        institution: saved.institution,
      });
    } catch (error) {
      const fieldErrors = mapServerErrors(error.response?.data?.errors, form);
      if (hasErrors(fieldErrors)) {
        setErrors(fieldErrors);
        focusFirstError(formRef.current, fieldErrors, FIELD_ORDER);
      } else {
        setSaveError(getErrorMessage(error, "We couldn't save your profile. Please try again."));
      }
    } finally {
      setIsSaving(false);
    }
  };

  const retry = () => {
    setLoadState("loading");
    setReloadKey((key) => key + 1);
  };

  return (
    <DashboardLayout unreadCount={unreadCount}>
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-header__title">My profile</h1>
        </div>
      </div>

      {loadState === "loading" && <ProfileSkeleton />}

      {loadState === "error" && (
        <div className="dashboard-error">
          <Alert variant="error" title="Something went wrong">
            {loadError}
          </Alert>
          <Button variant="secondary" className="btn--sm" onClick={retry}>
            Try again
          </Button>
        </div>
      )}

      {loadState === "ready" && (
        <>
          <ProfileSummary profile={profile} />

          <form ref={formRef} className="profile-form" onSubmit={handleSubmit} noValidate>
            {saveError && (
              <Alert variant="error" title="Your changes weren't saved">
                {saveError}
              </Alert>
            )}

            <section className="profile-section" aria-labelledby="personal-heading">
              <div className="profile-section__header">
                <h2 id="personal-heading" className="profile-section__title">
                  Personal details
                </h2>
                <p className="profile-section__text">Your name and how we can reach you.</p>
              </div>

              <div className="profile-grid">
                <TextField
                  id="first_name"
                  name="first_name"
                  label="First name"
                  autoComplete="given-name"
                  value={form.first_name}
                  onChange={handleChange}
                  error={errors.first_name}
                  maxLength={100}
                />
                <TextField
                  id="last_name"
                  name="last_name"
                  label="Last name"
                  autoComplete="family-name"
                  value={form.last_name}
                  onChange={handleChange}
                  error={errors.last_name}
                  maxLength={100}
                />
                <TextField
                  id="email"
                  name="email"
                  type="email"
                  label="Email address"
                  autoComplete="email"
                  value={form.email}
                  onChange={handleChange}
                  error={errors.email}
                  hint="You log in with this email."
                  maxLength={255}
                />
                <TextField
                  id="phone"
                  name="phone"
                  type="tel"
                  label="Phone number"
                  autoComplete="tel"
                  placeholder="+264 81 234 5678"
                  value={form.phone}
                  onChange={handleChange}
                  error={errors.phone}
                  optional
                />
              </div>
            </section>

            <section className="profile-section" aria-labelledby="studies-heading">
              <div className="profile-section__header">
                <h2 id="studies-heading" className="profile-section__title">
                  Studies
                </h2>
                <p className="profile-section__text">Where and what you study.</p>
              </div>

              <div className="profile-grid">
                <div className={`profile-grid__wide${form.university === "other" ? "" : " profile-grid__wide--full"}`}>
                  <SelectField
                    id="university"
                    name="university"
                    label="University"
                    placeholder="Choose your university"
                    options={UNIVERSITY_OPTIONS}
                    value={form.university}
                    onChange={handleChange}
                    error={errors.university}
                    optional
                  />
                </div>
                {form.university === "other" && (
                  <TextField
                    id="other_university"
                    name="other_university"
                    label="University name"
                    autoComplete="organization"
                    value={form.other_university}
                    onChange={handleChange}
                    error={errors.other_university}
                    maxLength={100}
                  />
                )}
                <TextField
                  id="student_number"
                  name="student_number"
                  label="Student number"
                  placeholder="224012345"
                  value={form.student_number}
                  onChange={handleChange}
                  error={errors.student_number}
                  maxLength={20}
                  optional
                />
                <SelectField
                  id="year_of_study"
                  name="year_of_study"
                  label="Year of study"
                  placeholder="Choose your year"
                  options={YEARS_OF_STUDY}
                  value={form.year_of_study}
                  onChange={handleChange}
                  error={errors.year_of_study}
                  optional
                />
                <div className="profile-grid__wide profile-grid__wide--full">
                  <TextField
                    id="programme"
                    name="programme"
                    label="Programme"
                    placeholder="Bachelor of Computer Science"
                    value={form.programme}
                    onChange={handleChange}
                    error={errors.programme}
                    maxLength={150}
                    optional
                  />
                </div>
              </div>
            </section>

            <div className="profile-actions">
              {justSaved && !isDirty && (
                <p className="profile-actions__status" role="status">
                  <CheckCircleIcon size={18} />
                  Your profile is saved.
                </p>
              )}
              <Button type="submit" isLoading={isSaving} loadingText="Saving…" disabled={!isDirty}>
                Save
              </Button>
            </div>
          </form>

        </>
      )}
    </DashboardLayout>
  );
}

function ProfileSummary({ profile }) {
  const details = [
    profile.institution && getUniversityName(profile.institution),
    profile.year_of_study && getYearLabel(profile.year_of_study),
  ].filter(Boolean);

  return (
    <section className="profile-summary" aria-label="Account summary">
      <span className="avatar avatar--lg" aria-hidden="true">
        {getInitials(profile)}
      </span>

      <div className="profile-summary__body">
        <p className="profile-summary__name">{getFullName(profile)}</p>
        <p className="profile-summary__email">{profile.email}</p>
        <ul className="profile-summary__meta">
          {details.length > 0 ? (
            <li>
              <GraduationCapIcon size={16} />
              {details.join(" · ")}
            </li>
          ) : (
            <li>
              <GraduationCapIcon size={16} />
              University not added yet
            </li>
          )}
          <li>
            <UserIcon size={16} />
            Student since {formatDate(profile.created_at)}
          </li>
        </ul>
      </div>
    </section>
  );
}

function ProfileSkeleton() {
  return (
    <div className="dashboard-skeleton" aria-busy="true" aria-label="Loading your profile">
      <div className="skeleton skeleton--card" />
      <div className="skeleton skeleton--card" />
      <div className="skeleton skeleton--card" />
    </div>
  );
}
