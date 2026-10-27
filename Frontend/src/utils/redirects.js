// Where each role lands after logging in (matches the Figma dashboard routes)
export function getHomePathForRole(role) {
  return role === "admin" ? "/admin" : "/applications";
}

// Send the user back to the page they were trying to open, unless it is a
// page their role can't use.
export function getPostLoginPath(user, fromPath) {
  const isSafeInternalPath =
    typeof fromPath === "string" && fromPath.startsWith("/") && !fromPath.startsWith("//");

  if (!isSafeInternalPath || fromPath === "/login" || fromPath === "/register") {
    return getHomePathForRole(user.role);
  }

  if (fromPath.startsWith("/admin") && user.role !== "admin") {
    return getHomePathForRole(user.role);
  }

  return fromPath;
}
