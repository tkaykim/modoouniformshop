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

