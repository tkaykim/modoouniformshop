// KST helpers
export const KST_TZ = 'Asia/Seoul';

export function toKstDate(date: Date): Date {
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  const kstOffset = 9 * 60 * 60000; // UTC+9
  return new Date(utc + kstOffset);
}

export function todayKstISODate(): string {
  const d = toKstDate(new Date());
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function toKstDateTimeLocalString(date: Date): string {
  const d = toKstDate(date);
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  const hh = `${d.getHours()}`.padStart(2, '0');
  const mm = `${d.getMinutes()}`.padStart(2, '0');
  return `${y}-${m}-${day}T${hh}:${mm}`;
}

// Convert an input from <input type="datetime-local"> (assumed KST) to ISO with +09:00
export function kstLocalToISO(local: string): string {
  // local like '2025-08-12T14:30'
  if (!/T\d{2}:\d{2}/.test(local)) return local;
  return `${local}:00+09:00`;
}

