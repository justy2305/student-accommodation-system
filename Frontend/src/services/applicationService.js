import api from "./api";

// GET /api/applications/my → the logged-in student's applications, newest first.
// Each one includes accommodation_name, accommodation_location,
// accommodation_price and accommodation_image (first photo, or null).
export async function getMyApplications() {
  const { data } = await api.get("/applications/my");
  return data.applications ?? [];
}

// POST /api/applications → apply for one room type at an accommodation
export async function applyForAccommodation(accommodationId, roomType) {
  const { data } = await api.post("/applications", {
    accommodation_id: accommodationId,
    room_type: roomType,
  });
  return data.application;
}

// PATCH /api/applications/:id/sign-lease → the student signs their lease agreement
export async function signLease(applicationId) {
  const { data } = await api.patch(`/applications/${applicationId}/sign-lease`);
  return data.application;
}

// DELETE /api/applications/:id → withdraw a Pending or Under Review application
export async function withdrawApplication(applicationId) {
  await api.delete(`/applications/${applicationId}`);
}
