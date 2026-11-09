import api from "./api";

// GET /api/applications/my → the logged-in student's applications, newest first.
// Each one includes accommodation_name, accommodation_location,
// accommodation_price and accommodation_image (first photo, or null).
export async function getMyApplications() {
  const { data } = await api.get("/applications/my");
  return data.applications ?? [];
}

// POST /api/applications → apply for an accommodation as the logged-in student
export async function applyForAccommodation(accommodationId) {
  const { data } = await api.post("/applications", { accommodation_id: accommodationId });
  return data.application;
}

// PATCH /api/applications/:id/sign-lease → the student signs their lease agreement
export async function signLease(applicationId) {
  const { data } = await api.patch(`/applications/${applicationId}/sign-lease`);
  return data.application;
}
