// "A 5-minute walk to NUST main campus and 6.5 km to UNAM. Shared rooms…"
// → "A 5-minute walk to NUST main campus and 6.5 km to UNAM."
export function getFirstSentence(text = "") {
  const match = text.match(/^.*?\.(\s|$)/);
  return (match ? match[0] : text).trim();
}

// "/images/studentstay/single-room-1.jpeg" → "Single room 1"
export function describePhoto(url = "") {
  const file = url.split("/").pop()?.replace(/\.[a-z0-9]+$/i, "") ?? "";
  const words = file.replace(/[-_]+/g, " ").trim();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : "Photo";
}

// Room types as stored in the database → how they read on screen
export const ROOM_TYPE_LABELS = {
  Single: "Single room",
  Shared: "Shared room",
  Triple: "Triple room",
};

export function getRoomTypeLabel(type) {
  return ROOM_TYPE_LABELS[type] ?? type;
}

// 0.4 → "0.4 km", 10 → "10 km"
export function formatDistance(km) {
  const value = Number(km);
  if (km === null || km === undefined || !Number.isFinite(value)) return null;
  return `${value.toLocaleString("en-US", { maximumFractionDigits: 1 })} km`;
}

// Room availability text: "3 available", "Available" or "Full"
export function getRoomAvailability(room) {
  if (!room.is_available || room.available_rooms === 0) return { label: "Full", isFull: true };
  if (room.available_rooms > 0) return { label: `${room.available_rooms} available`, isFull: false };
  return { label: "Available", isFull: false };
}
