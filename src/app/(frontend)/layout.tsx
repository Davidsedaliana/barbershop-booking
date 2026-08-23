import type { Metadata } from 'next'
import { Manrope, Oswald } from 'next/font/google'
import Link from 'next/link'
import React from 'react'

import './styles.css'

const display = Oswald({ subsets: ['latin', 'cyrillic'], variable: '--font-display' })
const body = Manrope({ subsets: ['latin', 'cyrillic'], variable: '--font-body' })

export const metadata: Metadata = {
  title: 'BRITVA — барбершоп с онлайн-записью',
  description:
    'Мужские стрижки, бороды и королевское бритьё. Запись онлайн за минуту — выбери мастера, день и время.',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="ru" className={`${display.variable} ${body.variable}`}>
      <body>
        <header className="site-header">
          <Link href="/" className="logo">
            BRITVA<span className="logo-dot">.</span>
          </Link>
          <nav className="site-nav">
            <Link href="/#services">Услуги</Link>
            <Link href="/#barbers">Барберы</Link>
            <Link href="/#contacts">Контакты</Link>
          </nav>
          <Link href="/booking" className="btn btn-accent">
            Записаться
          </Link>
        </header>
        <main>{children}</main>
        <footer className="site-footer" id="contacts">
          <div>
            <div className="logo">
              BRITVA<span className="logo-dot">.</span>
            </div>
            <p className="muted">Демо-проект: барбершоп с онлайн-записью на Next.js + Payload CMS</p>
          </div>
          <div className="footer-info">
            <p>Ереван, ул. Туманяна 12</p>
            <p>Ежедневно 10:00–21:00</p>
            <p>+374 99 00-00-00</p>
          </div>
        </footer>
      </body>
    </html>
  )
}
