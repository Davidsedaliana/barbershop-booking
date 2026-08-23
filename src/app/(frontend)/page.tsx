import { getPayload } from 'payload'
import Link from 'next/link'
import React from 'react'

import config from '@/payload.config'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const payload = await getPayload({ config: await config })

  const [services, barbers] = await Promise.all([
    payload.find({
      collection: 'services',
      where: { active: { equals: true } },
      sort: 'price',
      limit: 20,
    }),
    payload.find({
      collection: 'barbers',
      where: { active: { equals: true } },
      limit: 10,
    }),
  ])

  return (
    <>
      <section className="hero">
        <p className="eyebrow">Барбершоп в Ереване</p>
        <h1>
          Стрижка, после которой
          <br />
          <em>оборачиваются</em>
        </h1>
        <p className="hero-sub">
          Никаких звонков и «перезвоните позже» — выбери мастера, день и время, остальное за нами.
        </p>
        <div className="hero-actions">
          <Link href="/booking" className="btn btn-accent btn-lg">
            Записаться онлайн
          </Link>
          <a href="#services" className="btn btn-ghost btn-lg">
            Смотреть услуги
          </a>
        </div>
      </section>

      <section className="section" id="services">
        <h2>Услуги и цены</h2>
        <div className="cards">
          {services.docs.map((s) => (
            <div className="card" key={s.id}>
              <div className="card-head">
                <h3>{s.name}</h3>
                <span className="price">{s.price.toLocaleString('ru-RU')} ₽</span>
              </div>
              {s.description && <p className="muted">{s.description}</p>}
              <p className="duration">{s.durationMin} минут</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section" id="barbers">
        <h2>Барберы</h2>
        <div className="cards barbers">
          {barbers.docs.map((b) => (
            <div className="card barber-card" key={b.id}>
              <div className="barber-avatar" aria-hidden>
                {b.name.slice(0, 1)}
              </div>
              <h3>{b.name}</h3>
              {b.title && <p className="barber-title">{b.title}</p>}
              {b.bio && <p className="muted">{b.bio}</p>}
            </div>
          ))}
        </div>
      </section>

      <section className="section cta">
        <h2>Свободные окна разлетаются</h2>
        <p className="muted">Запись занимает меньше минуты — без регистрации и звонков.</p>
        <Link href="/booking" className="btn btn-accent btn-lg">
          Выбрать время
        </Link>
      </section>
    </>
  )
}
