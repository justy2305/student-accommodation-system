export function getInitials(user) {
  return `${user?.first_name?.[0] ?? ""}${user?.last_name?.[0] ?? ""}`.toUpperCase() || "?";
}

export function getFullName(user) {
  return [user?.first_name, user?.last_name].filter(Boolean).join(" ");
}

// "Justina N." as in the Figma sidebar
export function getShortName(user) {
  const lastInitial = user?.last_name?.[0];
  return [user?.first_name, lastInitial && `${lastInitial}.`].filter(Boolean).join(" ");
}

// Universities students pick from on My profile. The short code is what is saved;
// any other university is saved as the name the student types.
export const UNIVERSITIES = [
  { value: "NUST", label: "Namibia University of Science and Technology (NUST)" },
  { value: "UNAM", label: "University of Namibia (UNAM)" },
  { value: "IUM", label: "International University of Management (IUM)" },
];

export const YEARS_OF_STUDY = [
  { value: "1", label: "1st year" },
  { value: "2", label: "2nd year" },
  { value: "3", label: "3rd year" },
  { value: "4", label: "4th year" },
  { value: "5", label: "5th year" },
  { value: "6", label: "Postgraduate" },
];

export function getUniversityName(institution) {
  return UNIVERSITIES.find((university) => university.value === institution)?.label ?? institution;
}

export function getYearLabel(yearOfStudy) {
  return YEARS_OF_STUDY.find((year) => year.value === String(yearOfStudy))?.label ?? null;
}

// Line under the name in the sidebar: "NUST student", or "Student"
export function getStudentLabel(user) {
  return user?.institution ? `${user.institution} student` : "Student";
}
