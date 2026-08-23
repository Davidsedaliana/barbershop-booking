/**
 * Демо-данные барбершопа «BRITVA»: услуги, барберы, админ.
 * Запуск: npm run seed  (идемпотентно — существующее не дублирует)
 */
import config from '@payload-config'
import { getPayload } from 'payload'

const SERVICES = [
  { name: 'Мужская стрижка', price: 1500, durationMin: 60, description: 'Консультация, мытьё, стрижка ножницами и машинкой, укладка' },
  { name: 'Стрижка машинкой', price: 1000, durationMin: 30, description: 'Одна насадка или fade без ножниц' },
  { name: 'Оформление бороды', price: 1000, durationMin: 30, description: 'Форма, контуры, горячее полотенце, масло' },
  { name: 'Комплекс: стрижка + борода', price: 2200, durationMin: 90, description: 'Полный сервис со скидкой от суммы услуг' },
  { name: 'Королевское бритьё', price: 1800, durationMin: 45, description: 'Опасная бритва, распаривание, уход' },
  { name: 'Детская стрижка (до 12 лет)', price: 1200, durationMin: 45, description: 'Терпеливо и весело' },
]

const BARBERS = [
  { name: 'Арам', title: 'Основатель', bio: '12 лет за креслом, четыре чемпионата барберов', workDays: ['2', '3', '4', '5', '6'], workStart: '10:00', workEnd: '20:00' },
  { name: 'Давид', title: 'Топ-барбер', bio: 'Фейды и классика. Стрижёт под винил', workDays: ['1', '2', '3', '4', '5'], workStart: '11:00', workEnd: '21:00' },
  { name: 'Тигран', title: 'Барбер', bio: 'Молодой и дотошный: контуры — бритвой', workDays: ['3', '4', '5', '6', '0'], workStart: '10:00', workEnd: '19:00' },
]

async function seed() {
  const payload = await getPayload({ config })

  const admins = await payload.find({ collection: 'users', limit: 1 })
  if (admins.totalDocs === 0) {
    await payload.create({
      collection: 'users',
      data: { email: 'admin@britva.demo', password: 'britva-demo' },
    })
    console.log('Админ создан: admin@britva.demo / britva-demo')
  }

  for (const service of SERVICES) {
    const existing = await payload.find({
      collection: 'services',
      where: { name: { equals: service.name } },
      limit: 1,
    })
    if (existing.totalDocs === 0) {
      await payload.create({ collection: 'services', data: service })
      console.log(`Услуга: ${service.name}`)
    }
  }

  for (const barber of BARBERS) {
    const existing = await payload.find({
      collection: 'barbers',
      where: { name: { equals: barber.name } },
      limit: 1,
    })
    if (existing.totalDocs === 0) {
      await payload.create({ collection: 'barbers', data: barber })
      console.log(`Барбер: ${barber.name}`)
    }
  }

  console.log('Сид завершён')
  process.exit(0)
}

seed().catch((e) => {
  console.error(e)
  process.exit(1)
})
