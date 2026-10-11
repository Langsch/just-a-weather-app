const formatters = new Map<string, Intl.DateTimeFormat>()

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  let formatter = formatters.get(timeZone)
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
    formatters.set(timeZone, formatter)
  }
  return formatter
}

/** Instante → ISO local sem fuso (`2026-10-10T14:05`), no formato que o Open-Meteo usa. */
export function toLocalIso(date: Date, timeZone: string): string {
  const parts: Record<string, string> = {}
  for (const { type, value } of formatterFor(timeZone).formatToParts(date)) parts[type] = value
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`
}

/** `2026-10-10T14:05` → `2026-10-10T14:00`. */
export function floorToHour(localIso: string): string {
  return `${localIso.slice(0, 13)}:00`
}

/** `2026-10-10T14:05` → `2026-10-10`. */
export function datePart(localIso: string): string {
  return localIso.slice(0, 10)
}
