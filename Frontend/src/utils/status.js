// Maps the backend statuses (see applicationStatusController.js) to how the
// dashboard shows them: badge colour, label and a short explanation.
const APPLICATION_STATUS = {
  Pending: {
    badge: "neutral",
    label: "Pending",
    description: "Submitted. Waiting for the housing team to review it.",
  },
  "Under Review": {
    badge: "warning",
    label: "Under review",
    description: "The housing team is reviewing your application. No action is needed right now.",
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
