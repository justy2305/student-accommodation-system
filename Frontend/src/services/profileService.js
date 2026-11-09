import api from "./api";

// GET /api/users/me → the logged-in user's full profile
export async function getMyProfile() {
  const { data } = await api.get("/users/me");
  return data.profile;
}

// PUT /api/users/me → save the profile; returns the saved version
export async function updateMyProfile(profile) {
  const { data } = await api.put("/users/me", profile);
  return data.profile;
}
