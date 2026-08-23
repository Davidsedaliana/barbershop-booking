import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'

import { availableSlots, parseTime } from '../lib/slots'

export const Appointments: CollectionConfig = {
  endpoints: [
    {
      // GET /api/appointments/slots?barber=<id>&service=<id>&date=YYYY-MM-DD
      path: '/slots',
      method: 'get',
      handler: async (req) => {
        const barberId = req.query.barber as string
        const serviceId = req.query.service as string
        const date = req.query.date as string
        if (!barberId || !serviceId || !/^\d{4}-\d{2}-\d{2}$/.test(date || '')) {
          return Response.json({ error: 'Нужны barber, service и date (YYYY-MM-DD)' }, { status: 400 })
        }

        const [barber, service] = await Promise.all([
          req.payload.findByID({ collection: 'barbers', id: barberId }),
          req.payload.findByID({ collection: 'services', id: serviceId }),
        ])

        // getDay() всегда возвращает 0–6, каст к литеральному типу безопасен
        const weekday = String(
          new Date(`${date}T00:00:00`).getDay(),
        ) as NonNullable<import('../payload-types').Barber['workDays']>[number]
        if (!barber.active || !(barber.workDays || []).includes(weekday)) {
          return Response.json({ slots: [], reason: 'day_off' })
        }

        const taken = await req.payload.find({
          collection: 'appointments',
          where: {
            and: [
              { barber: { equals: barberId } },
              { date: { equals: date } },
              { status: { not_equals: 'cancelled' } },
            ],
          },
          depth: 1,
          limit: 200,
        })
        const busy = taken.docs.map((a) => ({
          startMin: parseTime(a.time),
          durationMin: typeof a.service === 'object' && a.service ? a.service.durationMin : 60,
        }))

        // на сегодняшнюю дату не предлагаем прошедшее время
        const now = new Date()
        const isToday = date === now.toISOString().slice(0, 10)
        const minStartMin = isToday ? now.getHours() * 60 + now.getMinutes() : 0

        const slots = availableSlots({
          workStart: barber.workStart || '10:00',
          workEnd: barber.workEnd || '20:00',
          durationMin: service.durationMin,
          busy,
          minStartMin,
        })
        return Response.json({ slots })
      },
    },
  ],
  slug: 'appointments',
  labels: { singular: 'Запись', plural: 'Записи' },
  admin: {
    useAsTitle: 'customerName',
    defaultColumns: ['date', 'time', 'customerName', 'barber', 'service', 'status'],
  },
  access: {
    // клиент создаёт запись с сайта; читать и менять может только админ
    create: () => true,
    read: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  hooks: {
    beforeValidate: [
      async ({ data, req, operation }) => {
        // защита от двойного бронирования: тот же барбер, дата и время
        if (operation !== 'create' || !data?.barber || !data?.date || !data?.time) {
          return data
        }
        const clash = await req.payload.find({
          collection: 'appointments',
          where: {
            and: [
              { barber: { equals: data.barber } },
              { date: { equals: data.date } },
              { time: { equals: data.time } },
              { status: { not_equals: 'cancelled' } },
            ],
          },
          limit: 1,
        })
        if (clash.totalDocs > 0) {
          throw new APIError('Это время уже занято — выбери другой слот', 400)
        }
        return data
      },
    ],
  },
  fields: [
    { name: 'customerName', label: 'Имя клиента', type: 'text', required: true },
    { name: 'phone', label: 'Телефон', type: 'text', required: true },
    {
      name: 'service',
      label: 'Услуга',
      type: 'relationship',
      relationTo: 'services',
      required: true,
    },
    {
      name: 'barber',
      label: 'Барбер',
      type: 'relationship',
      relationTo: 'barbers',
      required: true,
    },
    {
      name: 'date',
      label: 'Дата (ГГГГ-ММ-ДД)',
      type: 'text',
      required: true,
      // строка вместо типа date: сравнения equals работают одинаково
      // в хуке, endpoint'е и любой таймзоне
      validate: (value: unknown) =>
        typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
          ? true
          : 'Формат даты: ГГГГ-ММ-ДД',
    },
    { name: 'time', label: 'Время', type: 'text', required: true },
    {
      name: 'status',
      label: 'Статус',
      type: 'select',
      defaultValue: 'new',
      options: [
        { label: 'Новая', value: 'new' },
        { label: 'Подтверждена', value: 'confirmed' },
        { label: 'Выполнена', value: 'done' },
        { label: 'Отменена', value: 'cancelled' },
      ],
    },
    { name: 'comment', label: 'Комментарий', type: 'textarea' },
  ],
}
