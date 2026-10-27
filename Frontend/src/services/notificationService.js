import api from "./api";

// GET /api/notifications → the logged-in user's notifications, newest first.
export async function getMyNotifications() {
  const { data } = await api.get("/notifications");
  return data.notifications ?? [];
}
