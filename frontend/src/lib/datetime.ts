// Splits an instant into date/time parts as seen in the exam's own timezone,
// so editing an exam doesn't shift its schedule when the browser is elsewhere.
export function zonedParts(iso: string, tz: string) {
  const fmt = (timeZone?: string) => new Intl.DateTimeFormat("en-CA", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date(iso));
  let parts;
  try { parts = fmt(tz); } catch { parts = fmt(undefined); }
  const g = (t: string) => parts.find(p => p.type === t)?.value || "";
  return { date: `${g("year")}-${g("month")}-${g("day")}`, time: `${g("hour")}:${g("minute")}` };
}

// "14:30" -> "02:30 PM" (the backend's expected time format)
export function to12h(time: string) {
  const [hr, min] = time.split(":");
  let h = parseInt(hr, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h.toString().padStart(2, "0")}:${min} ${ampm}`;
}
