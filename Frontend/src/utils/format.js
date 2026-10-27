const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

// 3200 → "N$ 3,200"
export function formatPrice(value) {
  const amount = Number(value);
  if (value === null || value === undefined || !Number.isFinite(amount)) return null;
  return `N$ ${amount.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

// "2026-10-20T08:42:00Z" → "20 Oct 2026"
export function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : dateFormatter.format(date);
}

// "1 hour ago", "Yesterday", "3 days ago", then a normal date
export function formatRelativeTime(value, now) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime()) || !now) return formatDate(value);

  const minutes = Math.round((now - date) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

  const days = Math.round(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;

  return formatDate(date);
}

// Reference shown on each application card, e.g. "FMH-2026-0007"
export function formatApplicationReference(application) {
  const year = new Date(application.created_at).getFullYear();
  const number = String(application.id).padStart(4, "0");
  return `FMH-${Number.isNaN(year) ? "0000" : year}-${number}`;
}
