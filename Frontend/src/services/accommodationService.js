import api from "./api";

// GET /api/accommodations/search with any of:
// search, roomType, minPrice, maxPrice, available, facilities (array), campus, maxDistance.
// Each accommodation includes cover_image, image_count, room_types, distances,
// facilities, price_from (cheapest matching room) and campus_distance_km.
export async function searchAccommodations(filters = {}) {
  const params = {};
  for (const [key, value] of Object.entries(filters)) {
    if (Array.isArray(value)) {
      if (value.length > 0) params[key] = value.join(",");
    } else if (value !== undefined && value !== null && value !== "" && value !== false) {
      params[key] = value;
    }
  }

  const { data } = await api.get("/accommodations/search", { params });
  return data.accommodations ?? [];
}

// GET /api/accommodations/filters → { room_types, facilities, campuses }
export async function getFilterOptions() {
  const { data } = await api.get("/accommodations/filters");
  return data;
}

// GET /api/accommodations/:id
export async function getAccommodation(id) {
  const { data } = await api.get(`/accommodations/${id}`);
  return data.accommodation;
}

// GET /api/accommodation-images/:id, in the order they were added (cover first)
export async function getAccommodationImages(id) {
  const { data } = await api.get(`/accommodation-images/${id}`);
  return [...(data.images ?? [])].sort((a, b) => a.id - b.id);
}
