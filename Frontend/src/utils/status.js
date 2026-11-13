// Maps the application statuses to how the dashboard shows them: badge
// colour, label and a short explanation. Statuses are changed by the
// automatic review on the server (about 1 minute per step).
const APPLICATION_STATUS = {
  Pending: {
    badge: "neutral",
    label: "Pending",
    description: "Submitted. The automatic review starts in about a minute.",
  },
  "Under Review": {
    badge: "warning",
    label: "Under review",
    description: "We're checking room availability. You'll get a decision in about a minute.",
  },
  Approved: {
    badge: "success",
    label: "Approved",
    description: "Congratulations! Your application was approved.",
  },
  Rejected: {
    badge: "error",
    label: "Rejected",
    description: "This application wasn't successful this time.",
  },
};

export function getStatusInfo(status) {
  return (
    APPLICATION_STATUS[status] ?? {
      badge: "neutral",
      label: status || "Submitted",
      description: "",
    }
  );
}

// Approved and Rejected are finished, so they go under "Past applications"
export function isActiveApplication(status) {
  return status !== "Approved" && status !== "Rejected";
}
