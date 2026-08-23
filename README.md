# BRITVA — barbershop with online booking

[![CI](https://github.com/Davidsedaliana/barbershop-booking/actions/workflows/ci.yml/badge.svg)](https://github.com/Davidsedaliana/barbershop-booking/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

**A complete booking system for a barbershop: public site, five-step booking
wizard with live slot availability, and an admin panel for the owner.**
Built with Next.js 15 + Payload CMS 3 + SQLite — runs locally with two commands,
no external services.

[Русская версия →](README.ru.md)

![Booking flow demo](docs/booking-demo.gif)

## Features

- **Five-step booking wizard**: service → barber → day → time → contacts.
  Only the chosen barber's working days are shown; the slot grid step equals
  the service duration (60-min haircut → hourly slots, 45-min kids cut → 45-min grid)
- **Live availability**: a custom `/api/appointments/slots` endpoint subtracts
  taken intervals (respecting *their* service durations) and past hours for today
- **Double-booking guard**: a collection hook rejects a taken slot with a
  human-readable error — race between two clients is resolved safely
- **Admin panel** (Payload CMS): the owner manages services, barbers with
  per-day shifts, and appointments with statuses — zero admin code written
- **Pure slot logic** extracted to `src/lib/slots.ts` — 10 unit tests (vitest)

## Quick start

```
npm ci
cp .env.example .env    # set your own PAYLOAD_SECRET
npm run dev             # http://localhost:3000
npm run seed            # demo data: services, barbers, admin
```

Admin: http://localhost:3000/admin — demo login `admin@britva.demo` / `britva-demo`
(created by the seed; change it for anything public).

## Telegram bot

The same booking flow is also available as a **Telegram bot** (`bot/`, aiogram 3) —
it talks to the very same Payload API the website uses: same slot logic, same
double-booking guard, bookings land in the same admin panel. If a slot gets taken
mid-dialog, the bot offers fresh times instead of failing.

```
cd bot
pip install -r requirements.txt
cp .env.example .env        # BOT_TOKEN от @BotFather
python -m britva_bot.main   # long polling; сайт должен быть запущен
```

## How it works

```
Next.js (App Router)                     bot/ (aiogram 3)
├── (frontend)  landing + booking wizard   └── same API, FSM dialog
├── (payload)   Payload admin & REST API ◄──────┘
└── collections
    ├── Services      price, duration (= slot grid step)
    ├── Barbers       per-weekday shifts
    └── Appointments  public create + double-booking guard hook
                      └── GET /slots  free time calculation
```

Storage is a single SQLite file — perfect for demos and small businesses;
swapping to Postgres is a one-line adapter change in `payload.config.ts`.

## Tests

```
npm run test:int   # vitest: slot math + API integration
npm run lint
```

## License

[MIT](LICENSE)
