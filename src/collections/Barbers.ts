import type { CollectionConfig } from 'payload'

export const WEEKDAYS = [
  { label: 'Понедельник', value: '1' },
  { label: 'Вторник', value: '2' },
  { label: 'Среда', value: '3' },
  { label: 'Четверг', value: '4' },
  { label: 'Пятница', value: '5' },
  { label: 'Суббота', value: '6' },
  { label: 'Воскресенье', value: '0' },
]

export const Barbers: CollectionConfig = {
  slug: 'barbers',
  labels: { singular: 'Барбер', plural: 'Барберы' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'title', 'active'],
  },
  access: {
    read: () => true, // публичная страница команды
  },
  fields: [
    { name: 'name', label: 'Имя', type: 'text', required: true },
    { name: 'title', label: 'Титул', type: 'text', admin: { description: 'Например: «топ-барбер», «основатель»' } },
    { name: 'photo', label: 'Фото', type: 'upload', relationTo: 'media' },
    { name: 'bio', label: 'Пара слов', type: 'textarea' },
    {
      name: 'workDays',
      label: 'Рабочие дни',
      type: 'select',
      hasMany: true,
      options: WEEKDAYS,
      defaultValue: ['2', '3', '4', '5', '6'],
    },
    { name: 'workStart', label: 'Начало смены', type: 'text', defaultValue: '10:00' },
    { name: 'workEnd', label: 'Конец смены', type: 'text', defaultValue: '20:00' },
    { name: 'active', label: 'Принимает записи', type: 'checkbox', defaultValue: true },
  ],
}
