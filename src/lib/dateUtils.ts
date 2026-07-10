export function getParisDate(dateInput: Date | string | number): Date {
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return date;
  
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  });
  
  const parts = formatter.formatToParts(date);
  const partMap = Object.fromEntries(parts.map(p => [p.type, p.value]));
  
  const hour = Number(partMap.hour);
  return new Date(
    Number(partMap.year),
    Number(partMap.month) - 1,
    Number(partMap.day),
    hour === 24 ? 0 : hour,
    Number(partMap.minute),
    Number(partMap.second)
  );
}

export function parseParisDate(dateStr: string, timeStr: string): Date {
  const utcDate = new Date(`${dateStr}T${timeStr}:00Z`);
  if (isNaN(utcDate.getTime())) return utcDate;

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  });
  
  const parts = formatter.formatToParts(utcDate);
  const partMap = Object.fromEntries(parts.map(p => [p.type, p.value]));
  
  const hour = Number(partMap.hour);
  const parisDate = new Date(Date.UTC(
    Number(partMap.year),
    Number(partMap.month) - 1,
    Number(partMap.day),
    hour === 24 ? 0 : hour,
    Number(partMap.minute),
    Number(partMap.second)
  ));
  
  const offsetMs = parisDate.getTime() - utcDate.getTime();
  const targetUtcTime = utcDate.getTime() - offsetMs;
  return new Date(targetUtcTime);
}
