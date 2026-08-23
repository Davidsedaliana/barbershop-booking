/** Чистая логика расчёта слотов записи — без БД, покрыта юнит-тестами. */

export type BusyInterval = { startMin: number; durationMin: number }

/** «10:30» -> 630. Бросает на мусоре. */
export function parseTime(value: string): number {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim())
  if (!match) throw new Error(`Неверное время: «${value}»`)
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) throw new Error(`Неверное время: «${value}»`)
  return hours * 60 + minutes
}

/** 630 -> «10:30» */
export function formatTime(totalMin: number): string {
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function intervalsOverlap(aStart: number, aDur: number, bStart: number, bDur: number): boolean {
  return aStart < bStart + bDur && bStart < aStart + aDur
}

/**
 * Свободные слоты смены: сетка с шагом durationMin от начала смены,
 * слот должен целиком помещаться в смену и не пересекаться с занятыми.
 * minStartMin — «не раньше чем» (для сегодняшней даты — текущее время).
 */
export function availableSlots(options: {
  workStart: string
  workEnd: string
  durationMin: number
  busy: BusyInterval[]
  minStartMin?: number
}): string[] {
  const start = parseTime(options.workStart)
  const end = parseTime(options.workEnd)
  const { durationMin, busy, minStartMin = 0 } = options
  if (durationMin <= 0 || end <= start) return []

  const slots: string[] = []
  for (let t = start; t + durationMin <= end; t += durationMin) {
    if (t < minStartMin) continue
    const clash = busy.some((b) => intervalsOverlap(t, durationMin, b.startMin, b.durationMin))
    if (!clash) slots.push(formatTime(t))
  }
  return slots
}
