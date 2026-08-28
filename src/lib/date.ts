/** Today's date as YYYY-MM-DD in UTC — matches the UTC day boundaries used for eventDate bucketing everywhere else. */
export function todayIsoUTC(): string {
  return new Date().toISOString().slice(0, 10);
}
