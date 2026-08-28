// Rework reason options shown in the entry UI. Kept as a small code-level
// config rather than a database table — Department Settings doesn't expose
// reason management (out of scope for now), and this keeps the picker
// simple while still being genuinely department-specific and not a single
// generic reason.

export interface ReworkReasonOption {
  label: string;
  responsibility: "DEPARTMENT_FAULT" | "EXTERNAL_NOT_FAULT";
}

// Shared across every department — none of these are the department's own fault.
const EXTERNAL_REASONS: ReworkReasonOption[] = [
  { label: "Doctor specification changed", responsibility: "EXTERNAL_NOT_FAULT" },
  { label: "Customer change", responsibility: "EXTERNAL_NOT_FAULT" },
  { label: "Material issue", responsibility: "EXTERNAL_NOT_FAULT" },
  { label: "Upstream department issue", responsibility: "EXTERNAL_NOT_FAULT" },
  { label: "Other external reason", responsibility: "EXTERNAL_NOT_FAULT" },
];

/**
 * Department-caused reasons for a given department. Every department gets
 * at least "<name> error" (matches the product spec's examples); a
 * department can be given more department-fault reasons here later without
 * touching the schema or the UI.
 */
function departmentFaultReasons(departmentName: string): ReworkReasonOption[] {
  return [{ label: `${departmentName} error`, responsibility: "DEPARTMENT_FAULT" }];
}

export function getReworkReasonOptions(departmentName: string): ReworkReasonOption[] {
  return [...departmentFaultReasons(departmentName), ...EXTERNAL_REASONS];
}
