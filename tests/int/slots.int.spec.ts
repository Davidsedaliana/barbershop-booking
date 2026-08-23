import { describe, expect, it } from 'vitest'

import { availableSlots, formatTime, intervalsOverlap, parseTime } from '@/lib/slots'

describe('parseTime / formatTime', () => {
  it('разбирает и собирает время', () => {
    expect(parseTime('10:00')).toBe(600)
    expect(parseTime('09:05')).toBe(545)
    expect(formatTime(630)).toBe('10:30')
    expect(formatTime(545)).toBe('09:05')
  })

  it('бросает на мусоре', () => {
    expect(() => parseTime('25:00')).toThrow()
    expect(() => parseTime('10:75')).toThrow()
    expect(() => parseTime('вчера')).toThrow()
  })
})

describe('intervalsOverlap', () => {
  it('пересечение и касание', () => {
    expect(intervalsOverlap(600, 60, 630, 60)).toBe(true) // 10:00-11:00 x 10:30-11:30
    expect(intervalsOverlap(600, 60, 660, 60)).toBe(false) // встык — не пересекаются
    expect(intervalsOverlap(600, 90, 630, 30)).toBe(true) // вложенный
  })
})

describe('availableSlots', () => {
  const shift = { workStart: '10:00', workEnd: '13:00', durationMin: 60 }

  it('пустая смена даёт полную сетку', () => {
    expect(availableSlots({ ...shift, busy: [] })).toEqual(['10:00', '11:00', '12:00'])
  })

  it('слот должен целиком помещаться в смену', () => {
    expect(availableSlots({ workStart: '10:00', workEnd: '12:30', durationMin: 60, busy: [] }))
      .toEqual(['10:00', '11:00'])
  })

  it('занятый интервал выбивает пересекающиеся слоты', () => {
    // занято 11:00-12:00 услугой на 60 минут
    expect(availableSlots({ ...shift, busy: [{ startMin: 660, durationMin: 60 }] }))
      .toEqual(['10:00', '12:00'])
  })

  it('длинная чужая запись перекрывает несколько слотов', () => {
    // занято 10:30-12:00 (90 минут)
    expect(availableSlots({ ...shift, busy: [{ startMin: 630, durationMin: 90 }] }))
      .toEqual(['12:00'])
  })

  it('minStartMin отсекает прошедшее время (сегодня)', () => {
    expect(availableSlots({ ...shift, busy: [], minStartMin: parseTime('11:30') }))
      .toEqual(['12:00'])
  })

  it('нулевая длительность и вывернутая смена — пусто', () => {
    expect(availableSlots({ ...shift, durationMin: 0, busy: [] })).toEqual([])
    expect(availableSlots({ workStart: '20:00', workEnd: '10:00', durationMin: 60, busy: [] })).toEqual([])
  })
})
