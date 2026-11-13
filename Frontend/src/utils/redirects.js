// Where students land after logging in (matches the Figma dashboard route)
export const DASHBOARD_PATH = "/applications";

// Send the student back to the page they were trying to open, or to their
// dashboard. Only paths inside this site are allowed (no "//other-site").
export function getPostLoginPath(fromPath) {
  const isSafeInternalPath =
    typeof fromPath === "string" && fromPath.startsWith("/") && !fromPath.startsWith("//");

  if (!isSafeInternalPath || fromPath === "/login" || fromPath === "/register") {
    return DASHBOARD_PATH;
  }

  return fromPath;
}
