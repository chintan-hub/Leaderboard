// Point categories shown in the Award Points form. Kept as a small
// code-level config (same "string key resolved in code" pattern as
// Department.scoringRule used) rather than a database table — flexible
// enough for now without over-engineering into an HR category-management
// module. A category's `direction` decides which list it appears under when
// the admin picks +1 or -1.

export interface PointCategoryOption {
  value: string;
  label: string;
}

export const POSITIVE_CATEGORIES: PointCategoryOption[] = [
  { value: "DOCTOR_PRAISE", label: "Doctor Praise" },
  { value: "HELPING_TEAMMATE", label: "Helping a Teammate" },
  { value: "ABOVE_AND_BEYOND", label: "Going Above & Beyond" },
  { value: "EXCELLENT_RESPONSIBILITY", label: "Excellent Responsibility" },
  { value: "POSITIVE_BEHAVIOUR", label: "Positive Behaviour" },
  { value: "OTHER_RECOGNITION", label: "Other Recognition" },
];

export const NEGATIVE_CATEGORIES: PointCategoryOption[] = [
  { value: "LATE_MARK", label: "Late Mark" },
  { value: "PROTOCOL_VIOLATION", label: "Protocol Violation" },
  { value: "ATTENDANCE_PUNCTUALITY", label: "Attendance / Punctuality Issue" },
  { value: "FAILURE_TO_FOLLOW_PROCESS", label: "Failure to Follow Process" },
  { value: "BEHAVIOURAL_ISSUE", label: "Behavioural Issue" },
  { value: "DOCTOR_COMPLAINT", label: "Doctor Complaint" },
  { value: "OTHER_ACCOUNTABILITY", label: "Other Accountability" },
];

const ALL_CATEGORIES = [...POSITIVE_CATEGORIES, ...NEGATIVE_CATEGORIES];
const LABEL_BY_VALUE = new Map(ALL_CATEGORIES.map((c) => [c.value, c.label]));
const VALID_VALUES = new Set(ALL_CATEGORIES.map((c) => c.value));

export function isValidCategory(value: string): boolean {
  return VALID_VALUES.has(value);
}

/** Falls back to the raw stored value for a category no longer in the list above, rather than hiding it. */
export function getCategoryLabel(value: string | null): string | null {
  if (!value) return null;
  return LABEL_BY_VALUE.get(value) ?? value;
}
