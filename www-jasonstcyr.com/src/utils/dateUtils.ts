export function isDatePath(segments: string[]): boolean {
  if (segments.length !== 4) return false;
  const [year, month, day] = segments;

  // Check if first three segments are numbers
  if (!/^\d{4}$/.test(year) || !/^\d{2}$/.test(month) || !/^\d{2}$/.test(day)) {
    return false;
  }

  // Validate date
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  return (
    date.getFullYear() === parseInt(year) &&
    date.getMonth() === parseInt(month) - 1 &&
    date.getDate() === parseInt(day)
  );
} 