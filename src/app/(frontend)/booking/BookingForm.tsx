'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'

type Service = { id: number | string; name: string; price: number; durationMin: number }
type Barber = { id: number | string; name: string; title: string; workDays: string[] }

const WEEKDAY_SHORT = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб']
const MONTHS = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']

function nextDays(count: number): { iso: string; label: string; weekday: string }[] {
  const days = []
  const now = new Date()
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i)
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    days.push({
      iso,
      label: `${d.getDate()} ${MONTHS[d.getMonth()]}`,
      weekday: String(d.getDay()),
    })
  }
  return days
}

export function BookingForm({ services, barbers }: { services: Service[]; barbers: Barber[] }) {
  const [serviceId, setServiceId] = useState<Service['id'] | null>(null)
  const [barberId, setBarberId] = useState<Barber['id'] | null>(null)
  const [date, setDate] = useState<string | null>(null)
  const [slots, setSlots] = useState<string[] | null>(null)
  const [time, setTime] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const days = useMemo(() => nextDays(14), [])
  const barber = barbers.find((b) => b.id === barberId)
  const service = services.find((s) => s.id === serviceId)
  const workingDays = useMemo(
    () => (barber ? days.filter((d) => barber.workDays.includes(d.weekday)) : days),
    [barber, days],
  )

  const loadSlots = useCallback(async () => {
    if (!serviceId || !barberId || !date) return
    setSlots(null)
    setTime(null)
    const res = await fetch(
      `/api/appointments/slots?barber=${barberId}&service=${serviceId}&date=${date}`,
    )
    const data = await res.json()
    setSlots(data.slots ?? [])
  }, [serviceId, barberId, date])

  useEffect(() => {
    void loadSlots()
  }, [loadSlots])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: name.trim(),
          phone: phone.trim(),
          service: serviceId,
          barber: barberId,
          date,
          time,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.errors?.[0]?.message || 'Не получилось создать запись')
      }
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Что-то пошло не так')
      void loadSlots() // слот могли занять — обновляем сетку
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <div className="booking-done">
        <h2>Ждём тебя! ✂️</h2>
        <p>
          {service?.name} · {barber?.name} · {date && days.find((d) => d.iso === date)?.label} в{' '}
          {time}
        </p>
        <p className="muted">Если планы изменятся — позвони, перенесём без вопросов.</p>
      </div>
    )
  }

  return (
    <form className="booking-form" onSubmit={submit}>
      <fieldset>
        <legend>1. Услуга</legend>
        <div className="choice-grid">
          {services.map((s) => (
            <button
              type="button"
              key={s.id}
              className={`choice ${serviceId === s.id ? 'selected' : ''}`}
              onClick={() => setServiceId(s.id)}
            >
              <span>{s.name}</span>
              <span className="choice-meta">
                {s.price.toLocaleString('ru-RU')} ₽ · {s.durationMin} мин
              </span>
            </button>
          ))}
        </div>
      </fieldset>

      {serviceId && (
        <fieldset>
          <legend>2. Барбер</legend>
          <div className="choice-grid">
            {barbers.map((b) => (
              <button
                type="button"
                key={b.id}
                className={`choice ${barberId === b.id ? 'selected' : ''}`}
                onClick={() => setBarberId(b.id)}
              >
                <span>{b.name}</span>
                {b.title && <span className="choice-meta">{b.title}</span>}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {barberId && (
        <fieldset>
          <legend>3. День</legend>
          <div className="day-strip">
            {workingDays.map((d) => (
              <button
                type="button"
                key={d.iso}
                className={`day ${date === d.iso ? 'selected' : ''}`}
                onClick={() => setDate(d.iso)}
              >
                <span className="day-week">{WEEKDAY_SHORT[Number(d.weekday)]}</span>
                <span>{d.label}</span>
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {date && (
        <fieldset>
          <legend>4. Время</legend>
          {slots === null && <p className="muted">Смотрим расписание…</p>}
          {slots?.length === 0 && (
            <p className="muted">На этот день всё занято — попробуй соседний.</p>
          )}
          {!!slots?.length && (
            <div className="slot-grid">
              {slots.map((s) => (
                <button
                  type="button"
                  key={s}
                  className={`slot ${time === s ? 'selected' : ''}`}
                  onClick={() => setTime(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </fieldset>
      )}

      {time && (
        <fieldset>
          <legend>5. Контакты</legend>
          <div className="contact-row">
            <input
              required
              placeholder="Имя"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              required
              placeholder="Телефон"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          {error && <p className="form-error">{error}</p>}
          <button className="btn btn-accent btn-lg" disabled={busy} type="submit">
            {busy ? 'Записываем…' : `Записаться на ${time}`}
          </button>
        </fieldset>
      )}
    </form>
  )
}
