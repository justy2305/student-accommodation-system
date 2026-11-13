// Date helpers for lease periods. Dates are "YYYY-MM-DD" strings, the same
// format PostgreSQL DATE columns use in this project.

// Lease lengths a student can choose
const LEASE_MONTHS = [3, 6, 10, 12];

// How far ahead a move-in date can be
const MAX_MONTHS_AHEAD = 6;

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const toIsoDate = (year, month, day) =>
  `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

// true for a real calendar date written as YYYY-MM-DD
const isValidIsoDate = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

// Today on the server's clock
const todayIso = () => {
  const now = new Date();
  return toIsoDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
};

// "2026-01-31" + 1 month → "2026-02-28" (stays inside the shorter month)
const addMonths = (isoDate, months) => {
  const [year, month, day] = isoDate.split("-").map(Number);
  const total = month - 1 + months;
  const targetYear = year + Math.floor(total / 12);
  const targetMonth = total % 12; // 0-11
  const lastDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  return toIsoDate(targetYear, targetMonth + 1, Math.min(day, lastDay));
};

// Last day of a lease: move-in plus the lease length, minus one day.
// "2026-12-01" for 12 months → "2027-11-30"
const getLeaseEnd = (moveInDate, months) => {
  const end = new Date(`${addMonths(moveInDate, months)}T00:00:00Z`);
  end.setUTCDate(end.getUTCDate() - 1);
  return end.toISOString().slice(0, 10);
};

// "2026-12-01" → "1 Dec 2026"
const formatDate = (isoDate) => {
  const [year, month, day] = isoDate.split("-").map(Number);
  return `${day} ${MONTH_NAMES[month - 1]} ${year}`;
};

// Checks a chosen move-in date and lease length. Returns an error message or null.
const validateLeaseChoice = (moveInDate, leaseMonths) => {
  if (!isValidIsoDate(moveInDate)) {
    return "Choose a move-in date (YYYY-MM-DD)";
  }

  const today = todayIso();
  if (moveInDate < today) {
    return "The move-in date can't be in the past";
  }

  if (moveInDate > addMonths(today, MAX_MONTHS_AHEAD)) {
    return `The move-in date must be within ${MAX_MONTHS_AHEAD} months from today`;
  }

  if (!LEASE_MONTHS.includes(leaseMonths)) {
    return `Choose a lease length of ${LEASE_MONTHS.join(", ")} months`;
  }

  return null;
};

module.exports = {
  LEASE_MONTHS,
  MAX_MONTHS_AHEAD,
  isValidIsoDate,
  todayIso,
  addMonths,
  getLeaseEnd,
  formatDate,
  validateLeaseChoice,
};
