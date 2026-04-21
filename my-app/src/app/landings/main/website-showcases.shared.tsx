'use client'

import { useMemo, useState, type ReactNode } from 'react'

export interface ShowcaseProps {
  onClose?: () => void
}

export type Theme = {
  background: string
  panel: string
  surface: string
  accent: string
  text: string
  muted: string
  border: string
}

export type Stat = {
  value: string
  label: string
}

export type Card = {
  title: string
  desc: string
  meta?: string
}

export type SlideSpec = {
  label: string
  node: ReactNode
}

export type HomepageConfig = {
  brand: string
  tagline: string
  url: string
  heroTag: string
  headline: string
  subhead: string
  primary: string
  secondary?: string
  navItems?: string[]
  stats: Stat[]
  featuredTitle: string
  featuredName: string
  featuredText: string
  featuredPoints: string[]
  cardsTitle: string
  cards: Card[]
  footerNote: string
  theme: Theme
}

export function NavClose({ onClose }: { onClose?: () => void }) {
  return (
    <button
      onClick={onClose}
      aria-label="Close showcase"
      style={{
        position: 'absolute',
        top: 12,
        right: 12,
        zIndex: 10,
        background: 'rgba(0,0,0,0.18)',
        border: 'none',
        borderRadius: '50%',
        width: 32,
        height: 32,
        cursor: 'pointer',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 16,
      }}
    >
      x
    </button>
  )
}

export function ImagePlaceholder({
  title,
  subtitle,
  height = 180,
}: {
  title: string
  subtitle?: string
  height?: number
}) {
  return (
    <div
      style={{
        height,
        borderRadius: 18,
        border: '1px dashed rgba(255,255,255,0.35)',
        background:
          'linear-gradient(135deg, rgba(255,255,255,0.10), rgba(255,255,255,0.03))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: 14,
      }}
    >
      <div>
        <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 1.1, textTransform: 'uppercase' }}>
          {title}
        </div>
        {subtitle ? (
          <div style={{ fontSize: 11, opacity: 0.75, marginTop: 4, lineHeight: 1.5 }}>{subtitle}</div>
        ) : null}
      </div>
    </div>
  )
}

export function ShowcaseHeader({
  title,
  subtitle,
  theme,
  navItems,
}: {
  title: string
  subtitle: string
  theme: Theme
  navItems: string[]
}) {
  return (
    <header style={{ background: theme.panel, borderBottom: `1px solid ${theme.border}`, padding: '14px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: theme.accent, fontWeight: 700 }}>{subtitle}</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: theme.text, marginTop: 4, letterSpacing: -0.4 }}>{title}</div>
        </div>
        <nav style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {navItems.map((item) => (
            <span key={item} style={{ fontSize: 12, color: theme.muted, fontWeight: 700 }}>
              {item}
            </span>
          ))}
        </nav>
      </div>
    </header>
  )
}

export function ShowcaseFooter({
  theme,
  note,
}: {
  theme: Theme
  note: string
}) {
  return (
    <footer style={{ background: theme.panel, borderTop: `1px solid ${theme.border}`, padding: '12px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ color: theme.muted, fontSize: 12 }}>
          {note}
        </div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          {['Privacy', 'Terms', 'Contact'].map((item) => (
            <span key={item} style={{ color: theme.muted, fontSize: 12, fontWeight: 700 }}>
              {item}
            </span>
          ))}
        </div>
      </div>
    </footer>
  )
}

export function BookingCalendar({
  theme,
  title = 'Book a time',
  subtitle = 'Select a day and available hour',
}: {
  theme: Theme
  title?: string
  subtitle?: string
}) {
  const today = useMemo(() => new Date(), [])
  const [selectedDayIndex, setSelectedDayIndex] = useState(0)
  const [selectedHour, setSelectedHour] = useState<number | null>(10)

  const days = useMemo(() => {
    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date(today)
      date.setDate(today.getDate() + index)
      const unavailable = index === 1 || index === 4
      const blockedHours = index === 0 ? [9, 13] : index === 2 ? [11, 15] : [8, 12]
      return {
        date,
        unavailable,
        blockedHours,
      }
    })
  }, [today])

  const selectedDay = days[selectedDayIndex] || days[0]
  const hours = Array.from({ length: 9 }, (_, index) => index + 8)

  const formatDay = (date: Date) =>
    new Intl.DateTimeFormat('no-NO', { weekday: 'short', day: '2-digit', month: 'short' }).format(date)

  return (
    <section style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 18, padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: theme.accent, fontWeight: 700 }}>{title}</div>
          <div style={{ fontSize: 18, fontWeight: 800, marginTop: 4 }}>{subtitle}</div>
        </div>
        <div style={{ fontSize: 12, color: theme.muted }}>
          Today: {new Intl.DateTimeFormat('no-NO', { dateStyle: 'medium' }).format(today)}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, marginTop: 14 }}>
        {days.map((day, index) => {
          const active = index === selectedDayIndex
          return (
            <button
              key={day.date.toISOString()}
              onClick={() => {
                setSelectedDayIndex(index)
                setSelectedHour(null)
              }}
              disabled={day.unavailable}
              style={{
                border: `1px solid ${active ? theme.accent : theme.border}`,
                borderRadius: 14,
                padding: '10px 8px',
                background: active ? `${theme.accent}18` : 'transparent',
                color: day.unavailable ? theme.muted : theme.text,
                cursor: day.unavailable ? 'not-allowed' : 'pointer',
                textAlign: 'left',
                opacity: day.unavailable ? 0.45 : 1,
              }}
            >
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2 }}>{formatDay(day.date)}</div>
              <div style={{ fontSize: 13, fontWeight: 800, marginTop: 4 }}>{day.unavailable ? 'Unavailable' : 'Available'}</div>
            </button>
          )
        })}
      </div>

      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: 12, color: theme.muted, marginBottom: 10 }}>
          {formatDay(selectedDay.date)} {selectedDay.unavailable ? 'is closed' : 'is open 08:00 - 16:00'}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
          {hours.map((hour) => {
            const unavailable = selectedDay.unavailable || selectedDay.blockedHours.includes(hour) || hour < 8 || hour > 16
            const active = selectedHour === hour
            return (
              <button
                key={hour}
                onClick={() => setSelectedHour(hour)}
                disabled={unavailable}
                style={{
                  border: `1px solid ${active ? theme.accent : theme.border}`,
                  borderRadius: 12,
                  padding: '10px 8px',
                  background: active ? `${theme.accent}18` : 'transparent',
                  color: unavailable ? theme.muted : theme.text,
                  cursor: unavailable ? 'not-allowed' : 'pointer',
                  opacity: unavailable ? 0.4 : 1,
                  fontWeight: 700,
                }}
              >
                {hour.toString().padStart(2, '0')}:00
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ marginTop: 14, borderRadius: 14, padding: 12, background: `${theme.accent}12`, color: theme.text, border: `1px solid ${theme.border}` }}>
        {selectedDay.unavailable
          ? 'This day is not bookable.'
          : selectedHour
            ? `Selected: ${formatDay(selectedDay.date)} at ${selectedHour.toString().padStart(2, '0')}:00`
            : 'Pick an available time to continue.'}
      </div>
    </section>
  )
}

export function CarouselShell({
  title,
  subtitle,
  slides,
  navItems = ['Overview', 'Examples', 'Contact'],
  footerNote = 'Preview showcase only',
  onClose,
}: {
  title: string
  subtitle: string
  slides: SlideSpec[]
  navItems?: string[]
  footerNote?: string
  onClose?: () => void
}) {
  const [index, setIndex] = useState(0)

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#111', position: 'relative' }}>
      <NavClose onClose={onClose} />
      <div style={{ padding: '12px 16px', background: '#151515', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 11, color: '#888', letterSpacing: 2, textTransform: 'uppercase' }}>{title}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginTop: 2 }}>{subtitle}</div>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', color: '#B8B8B8', fontSize: 12, fontWeight: 700 }}>
            {navItems.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
          <div style={{ fontSize: 12, color: '#9A9A9A' }}>
            {index + 1} / {slides.length}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden' }}>
        {slides.map((slide, slideIndex) => (
          <div
            key={slide.label}
            style={{
              position: 'absolute',
              inset: 0,
              opacity: slideIndex === index ? 1 : 0,
              transform: slideIndex === index ? 'translateX(0)' : 'translateX(14px)',
              transition: 'opacity 0.3s ease, transform 0.3s ease',
              pointerEvents: slideIndex === index ? 'auto' : 'none',
            }}
          >
            {slide.node}
          </div>
        ))}
      </div>

      <div style={{ padding: '10px 14px', background: '#131313', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ color: '#9A9A9A', fontSize: 12 }}>{footerNote}</div>
          <div style={{ color: '#9A9A9A', fontSize: 12 }}>Use the tabs to switch examples</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {slides.map((slide, slideIndex) => (
            <button
              key={slide.label}
              onClick={() => setIndex(slideIndex)}
              style={{
                border: 'none',
                cursor: 'pointer',
                borderRadius: 999,
                padding: '7px 12px',
                fontSize: 12,
                fontWeight: 700,
                background: slideIndex === index ? '#fff' : 'rgba(255,255,255,0.08)',
                color: slideIndex === index ? '#111' : '#fff',
              }}
            >
              {slide.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export function HomepagePage({ config }: { config: HomepageConfig }) {
  return (
    <div
      style={{
        height: '100%',
        overflow: 'auto',
        background: config.theme.background,
        color: config.theme.text,
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
      }}
    >
      <div style={{ background: config.theme.panel, borderBottom: `1px solid ${config.theme.border}` }}>
        <div style={{ padding: '10px 14px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff5f57', display: 'inline-block' }} />
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ffbd2e', display: 'inline-block' }} />
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#28c840', display: 'inline-block' }} />
          <div
            style={{
              marginLeft: 8,
              flex: 1,
              borderRadius: 6,
              background: 'rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.66)',
              fontSize: 11,
              padding: '6px 10px',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
            }}
          >
            {config.url}
          </div>
          <div style={{ fontSize: 10, color: config.theme.accent, letterSpacing: 2, textTransform: 'uppercase' }}>
            {config.heroTag}
          </div>
        </div>

        <div style={{ padding: '14px 18px 16px', display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 4 }}>
              {config.tagline}
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.4, color: '#fff' }}>{config.brand}</div>
          </div>

          <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'rgba(255,255,255,0.68)' }}>
            {(config.navItems || ['Home', 'About', 'Contact']).map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: 18, display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', gap: 16, alignItems: 'stretch' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div
            style={{
              display: 'inline-flex',
              alignSelf: 'flex-start',
              background: config.theme.surface,
              color: config.theme.accent,
              border: `1px solid ${config.theme.border}`,
              borderRadius: 999,
              padding: '5px 12px',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1.4,
              textTransform: 'uppercase',
            }}
          >
            {config.heroTag}
          </div>

          <div style={{ fontSize: 'clamp(24px, 3vw, 34px)', lineHeight: 1.05, fontWeight: 900, letterSpacing: -0.9 }}>
            {config.headline}
          </div>

          <p style={{ margin: 0, color: config.theme.muted, fontSize: 14, lineHeight: 1.7, maxWidth: 420 }}>{config.subhead}</p>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              style={{
                background: config.theme.accent,
                color: '#fff',
                border: 'none',
                borderRadius: 999,
                padding: '12px 18px',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {config.primary}
            </button>
            {config.secondary ? (
              <button
                style={{
                  background: 'transparent',
                  color: config.theme.text,
                  border: `1px solid ${config.theme.border}`,
                  borderRadius: 999,
                  padding: '12px 18px',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {config.secondary}
              </button>
            ) : null}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
            {config.stats.map((stat) => (
              <div
                key={stat.label}
                style={{
                  background: config.theme.surface,
                  border: `1px solid ${config.theme.border}`,
                  borderRadius: 14,
                  padding: '12px 10px',
                }}
              >
                <div style={{ fontWeight: 900, fontSize: 18, color: config.theme.text, marginBottom: 2 }}>{stat.value}</div>
                <div style={{ fontSize: 10, color: config.theme.muted, letterSpacing: 1, textTransform: 'uppercase' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            background: config.theme.surface,
            border: `1px solid ${config.theme.border}`,
            borderRadius: 20,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div style={{ fontSize: 11, color: config.theme.accent, letterSpacing: 2.4, textTransform: 'uppercase' }}>{config.featuredTitle}</div>
          <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.4 }}>{config.featuredName}</div>
          <div style={{ fontSize: 13, lineHeight: 1.65, color: config.theme.muted }}>{config.featuredText}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
            {config.featuredPoints.map((point) => (
              <div key={point} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span style={{ color: config.theme.accent, fontSize: 12, lineHeight: 1.8 }}>•</span>
                <span style={{ fontSize: 13, color: config.theme.text, lineHeight: 1.6 }}>{point}</span>
              </div>
            ))}
          </div>
          <div
            style={{
              marginTop: 'auto',
              borderRadius: 14,
              background: `linear-gradient(135deg, ${config.theme.accent}22, ${config.theme.accent}10)`,
              border: `1px solid ${config.theme.border}`,
              padding: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
            }}
          >
            <div>
              <div style={{ fontSize: 11, color: config.theme.muted, textTransform: 'uppercase', letterSpacing: 1.8 }}>Homepage ready</div>
              <div style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>{config.footerNote}</div>
            </div>
            <div style={{ color: config.theme.accent, fontSize: 20, fontWeight: 900 }}>{'->'}</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 18px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginBottom: 10 }}>
          <div style={{ fontSize: 11, color: config.theme.muted, textTransform: 'uppercase', letterSpacing: 2.2 }}>{config.cardsTitle}</div>
          <div style={{ fontSize: 11, color: config.theme.muted }}>{config.url}</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
          {config.cards.map((card) => (
            <div
              key={card.title}
              style={{
                background: config.theme.surface,
                border: `1px solid ${config.theme.border}`,
                borderRadius: 16,
                padding: '12px 12px 13px',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 4 }}>{card.title}</div>
              <div style={{ fontSize: 12, color: config.theme.muted, lineHeight: 1.55 }}>{card.desc}</div>
              {card.meta ? (
                <div style={{ fontSize: 10, color: config.theme.accent, textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 8 }}>
                  {card.meta}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
