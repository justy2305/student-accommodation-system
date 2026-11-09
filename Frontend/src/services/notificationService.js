import api from "./api";

// GET /api/notifications → the logged-in user's notifications, newest first.
export async function getMyNotifications() {
  const { data } = await api.get("/notifications");
  return data.notifications ?? [];
}

// PATCH /api/notifications/:id/read → mark one notification as read
export async function markNotificationAsRead(id) {
  await api.patch(`/notifications/${id}/read`);
}

// PATCH /api/notifications/read-all → mark every notification as read
export async function markAllNotificationsAsRead() {
  await api.patch("/notifications/read-all");
}
