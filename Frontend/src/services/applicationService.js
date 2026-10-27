import api from "./api";

// GET /api/applications/my → the logged-in student's applications, newest first.
// Each one includes accommodation_name, accommodation_location,
// accommodation_price and accommodation_image (first photo, or null).
export async function getMyApplications() {
  const { data } = await api.get("/applications/my");
  return data.applications ?? [];
}
