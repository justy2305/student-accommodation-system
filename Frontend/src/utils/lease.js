// Lease dates arrive from the API as plain "YYYY-MM-DD" text. They are turned
// into local dates (midnight), so a lease never shifts by a day because of the
// time zone.

const DAY_MS = 24 * 60 * 60 * 1000;

const longDate = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

export function parseDateOnly(value) {
  if (typeof value !== "string") return null;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  const [, year, month, day] = match.map(Number);
  return new Date(year, month - 1, day);
}

export function formatDateOnly(value) {
  const date = parseDateOnly(value);
  return date ? longDate.format(date) : "";
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function daysBetween(from, to) {
  return Math.round((to - from) / DAY_MS);
}

function addMonths(date, months) {
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(date.getDate(), lastDay));
  return target;
}

// Whole months and leftover days from `from` to `to` (from <= to)
function monthsAndDays(from, to) {
  let months = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
  if (addMonths(from, months) > to) months -= 1;
  const days = daysBetween(addMonths(from, months), to);
  return { months, days };
}

function plural(count, word) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

// Where the student is in their lease:
// { phase: "upcoming" | "active" | "ended", label, detail, percent }
export function getLeaseProgress(leaseStart, leaseEnd, now) {
  const start = parseDateOnly(leaseStart);
  const end = parseDateOnly(leaseEnd);
  if (!start || !end || !now) return null;

  const today = startOfDay(now);
  const totalDays = Math.max(daysBetween(start, end), 1);

  if (today < start) {
    const days = daysBetween(today, start);
    return {
      phase: "upcoming",
      label: days === 1 ? "Starts tomorrow" : `Starts in ${plural(days, "day")}`,
      detail: `Move-in on ${formatDateOnly(leaseStart)}`,
      percent: 0,
    };
  }

  if (today > end) {
    return {
      phase: "ended",
      label: "Lease ended",
      detail: `Ended on ${formatDateOnly(leaseEnd)}`,
      percent: 100,
    };
  }

  const daysLeft = daysBetween(today, end);
  const { months, days } = monthsAndDays(today, end);
  let label;
  if (daysLeft === 0) label = "Last day today";
  else if (months === 0) label = `${plural(daysLeft, "day")} left`;
  else label = days === 0 ? `${plural(months, "month")} left` : `${plural(months, "month")}, ${plural(days, "day")} left`;

  return {
    phase: "active",
    label,
    detail: `Until ${formatDateOnly(leaseEnd)}`,
    percent: Math.min(100, Math.round((daysBetween(start, today) / totalDays) * 100)),
  };
}

// ---- Choosing a lease when applying (the backend checks the same rules) ----

// Lease lengths a student can choose, and how far ahead they can move in
export const LEASE_MONTHS = [3, 6, 10, 12];
export const MAX_MONTHS_AHEAD = 6;

const toIsoDate = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

// Same month arithmetic as the backend: stays inside a shorter month
function addMonthsKeepDay(date, months) {
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  return new Date(target.getFullYear(), target.getMonth(), Math.min(date.getDate(), lastDay));
}

// Earliest and latest move-in dates ("YYYY-MM-DD") for the date field
export function getMoveInRange(today = new Date()) {
  const start = startOfDay(today);
  return { min: toIsoDate(start), max: toIsoDate(addMonthsKeepDay(start, MAX_MONTHS_AHEAD)) };
}

// Suggested move-in: the 1st of next month
export function getDefaultMoveIn(today = new Date()) {
  return toIsoDate(new Date(today.getFullYear(), today.getMonth() + 1, 1));
}

// Last day of the lease: move-in + months - 1 day. "2026-12-01", 12 → "2027-11-30"
export function getLeaseEndDate(moveIn, months) {
  const start = parseDateOnly(moveIn);
  if (!start || !months) return null;
  const end = addMonthsKeepDay(start, months);
  end.setDate(end.getDate() - 1);
  return toIsoDate(end);
}
