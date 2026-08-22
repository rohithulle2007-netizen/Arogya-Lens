/**
 * Arogya Lens — Date & Time Utility Helpers
 * Formats checkup dates and times across history cards, details, and dashboard views.
 */

/**
 * Format screening date nicely into "DD MMM YYYY" (e.g. "22 Aug 2026")
 */
export function formatScreeningDate(dateVal?: string | null, fallback: string = '--'): string {
  if (!dateVal) return fallback;
  try {
    // If ISO or YYYY-MM-DD
    if (typeof dateVal === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
      const parts = dateVal.split('-');
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      }
    }
    const d = new Date(dateVal);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    }
  } catch {
    // Fallback below
  }
  return String(dateVal);
}

/**
 * Format screening time into "HH:MM AM/PM" (e.g. "08:15 AM", "02:30 PM")
 */
export function formatScreeningTime(
  timeVal?: string | null,
  dateVal?: string | null,
  fallback: string = '--'
): string {
  if (!timeVal && !dateVal) return fallback;

  try {
    // If timeVal is "HH:MM:SS" or "HH:MM"
    if (typeof timeVal === 'string' && /^\d{1,2}:\d{2}(:\d{2})?/.test(timeVal)) {
      const parts = timeVal.split(':');
      let hours = parseInt(parts[0], 10);
      const minutes = parts[1];
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // 0 -> 12
      const paddedHours = hours < 10 ? `0${hours}` : hours;
      return `${paddedHours}:${minutes} ${ampm}`;
    }

    // If timeVal is already in AM/PM format (e.g. "10:30 AM")
    if (typeof timeVal === 'string' && /(AM|PM)/i.test(timeVal)) {
      return timeVal;
    }

    // If timeVal is ISO string or timestamp
    if (typeof timeVal === 'string' && timeVal.includes('T')) {
      const d = new Date(timeVal);
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      }
    }

    // If dateVal is an ISO timestamp containing time
    if (dateVal && typeof dateVal === 'string' && dateVal.includes('T')) {
      const d = new Date(dateVal);
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      }
    }
  } catch {
    // Fallback below
  }

  return timeVal ? String(timeVal) : fallback;
}

/**
 * Format date and time together (e.g. "22 Aug 2026, 08:15 AM")
 */
export function formatFullDateTime(
  dateVal?: string | null,
  timeVal?: string | null,
  fallback: string = '--'
): string {
  const d = formatScreeningDate(dateVal, '');
  const t = formatScreeningTime(timeVal, dateVal, '');

  if (d && t) return `${d}, ${t}`;
  if (d) return d;
  if (t) return t;
  return fallback;
}
