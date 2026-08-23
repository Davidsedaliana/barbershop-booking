import { getPayload } from 'payload'
import React from 'react'

import config from '@/payload.config'

import { BookingForm } from './BookingForm'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Запись — BRITVA',
}

export default async function BookingPage() {
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
    <section className="section booking-page">
      <h1>Онлайн-запись</h1>
      <BookingForm
        services={services.docs.map((s) => ({
          id: s.id,
          name: s.name,
          price: s.price,
          durationMin: s.durationMin,
        }))}
        barbers={barbers.docs.map((b) => ({
          id: b.id,
          name: b.name,
          title: b.title ?? '',
          workDays: (b.workDays ?? []) as string[],
        }))}
      />
    </section>
  )
}
