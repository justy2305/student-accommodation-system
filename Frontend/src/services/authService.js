import api from "./api";

// The JWT never reaches JavaScript: the backend stores it in an httpOnly cookie
// and the browser sends it automatically. These calls only deal with the user.

export async function login({ email, password }) {
  const { data } = await api.post("/auth/login", { email, password });
  return data.user;
}

export async function register({ firstName, lastName, email, phone, password }) {
  const { data } = await api.post("/auth/register", {
    firstName,
    lastName,
    email,
    phone,
    password,
  });
  return data.user;
}

export async function logout() {
  await api.post("/auth/logout");
}

export async function getCurrentUser() {
  const { data } = await api.get("/auth/me");
  return data.user ?? null;
}
