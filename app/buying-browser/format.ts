export function formatThb(value: number | null | undefined) {
  return value === null || value === undefined ? "Pending" : `THB ${value.toLocaleString("en-US")}`;
}

export function formatMileage(value: number | null | undefined) {
  return value === null || value === undefined ? "Need Review" : `${value.toLocaleString("en-US")} km`;
}

export function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Pending";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Bangkok" }).format(date);
}

export function customerInitials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "NK";
}
