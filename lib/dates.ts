/** Local calendar day key (YYYY-MM-DD). Avoids UTC off-by-one for PK / other offsets. */
export function localDayKey(date: Date | string = new Date()) {
  const d = typeof date === 'string' ? new Date(date) : date;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function startOfLocalDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function daysAgoLocal(n: number) {
  const d = startOfLocalDay();
  d.setDate(d.getDate() - n);
  return d;
}
