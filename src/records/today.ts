export function formatCalendarDay(
  year: number,
  month: number,
  day: number,
): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function localToday(): string {
  const now = new Date();
  return formatCalendarDay(now.getFullYear(), now.getMonth() + 1, now.getDate());
}
