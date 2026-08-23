import type { CollectionConfig } from 'payload'

export const Services: CollectionConfig = {
  slug: 'services',
  labels: { singular: 'Услуга', plural: 'Услуги' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'price', 'durationMin', 'active'],
  },
  access: {
    read: () => true, // публичный каталог услуг
  },
  fields: [
    { name: 'name', label: 'Название', type: 'text', required: true },
    { name: 'description', label: 'Описание', type: 'textarea' },
    { name: 'price', label: 'Цена, ₽', type: 'number', required: true, min: 0 },
    {
      name: 'durationMin',
      label: 'Длительность, минут',
      type: 'number',
      required: true,
      defaultValue: 60,
      admin: { description: 'Шаг сетки записи равен длительности услуги' },
    },
    { name: 'active', label: 'Показывать на сайте', type: 'checkbox', defaultValue: true },
  ],
}
