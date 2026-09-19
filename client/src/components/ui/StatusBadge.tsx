const STYLES: Record<string, string> = {
  PLANNING: "bg-concrete-200 text-concrete-700",
  ACTIVE: "bg-signal-green/10 text-signal-green",
  ON_HOLD: "bg-safety/15 text-safety-dark",
  COMPLETED: "bg-blueprint-100 text-blueprint-700",
  CANCELLED: "bg-signal-red/10 text-signal-red",
  NOT_STARTED: "bg-concrete-200 text-concrete-700",
  IN_PROGRESS: "bg-safety/15 text-safety-dark",
  PLANNED: "bg-concrete-200 text-concrete-700",
  ORDERED: "bg-safety/15 text-safety-dark",
  ALLOCATED: "bg-safety/15 text-safety-dark",
  PARTIALLY_FULFILLED: "bg-safety/15 text-safety-dark",
  FULFILLED: "bg-signal-green/10 text-signal-green",
  LOW: "bg-concrete-200 text-concrete-700",
  MEDIUM: "bg-safety/15 text-safety-dark",
  HIGH: "bg-signal-red/10 text-signal-red",
  CRITICAL: "bg-signal-red/20 text-signal-red",
  PASSED: "bg-signal-green/10 text-signal-green",
  FAILED: "bg-signal-red/10 text-signal-red",
  PENDING: "bg-concrete-200 text-concrete-700",
  INVESTIGATING: "bg-safety/15 text-safety-dark",
  CLOSED: "bg-signal-green/10 text-signal-green",
  OPEN: "bg-safety/15 text-safety-dark",
};

const LABELS: Record<string, string> = {
  PLANNING: "Planning",
  ACTIVE: "Active",
  ON_HOLD: "On hold",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  NOT_STARTED: "Not started",
  IN_PROGRESS: "In progress",
  PLANNED: "Planned",
  ORDERED: "Ordered",
  ALLOCATED: "Allocated",
  PARTIALLY_FULFILLED: "Partially fulfilled",
  FULFILLED: "Fulfilled",
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
  PASSED: "Passed",
  FAILED: "Failed",
  PENDING: "Pending",
  INVESTIGATING: "Investigating",
  CLOSED: "Closed",
  OPEN: "Open",
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${
        STYLES[status] || "bg-concrete-200 text-concrete-700"
      }`}
    >
      {LABELS[status] || status}
    </span>
  );
}
