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
