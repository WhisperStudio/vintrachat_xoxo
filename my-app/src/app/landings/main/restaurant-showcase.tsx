'use client'

import { CarouselShell, ImagePlaceholder, type ShowcaseProps, type SlideSpec } from './website-showcases.shared'

function shell(slides: SlideSpec[], onClose?: () => void) {
  return <CarouselShell title="Restaurant" subtitle="Three homepage styles for restaurants and cafes" slides={slides} onClose={onClose} />
}

function FineDiningPage() {
  const bg = '#120F0B'
  const surface = '#1E1711'
  const accent = '#C89B52'
  const soft = '#F3E2BE'
  return (
    <div style={{ height: '100%', overflow: 'auto', background: bg, color: soft, fontFamily: "'Georgia', serif", padding: 18 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 16 }}>
        <div style={{ background: surface, borderRadius: 20, padding: 18, border: '1px solid rgba(200,155,82,0.14)' }}>
          <div style={{ fontSize: 11, letterSpacing: 4, textTransform: 'uppercase', color: accent }}>Michelin dining</div>
          <h2 style={{ margin: '10px 0 8px', fontSize: 34, lineHeight: 1.05, fontWeight: 400 }}>L'Etoile d'Or</h2>
          <p style={{ margin: 0, color: 'rgba(243,226,190,0.78)', fontSize: 14, lineHeight: 1.7 }}>
            A premium homepage that puts reservations first and feels like the home of a serious fine dining brand.
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
            <button style={{ background: accent, color: '#1b140f', border: 'none', borderRadius: 999, padding: '10px 16px', fontWeight: 700 }}>Reserve table</button>
            <button style={{ background: 'transparent', color: soft, border: '1px solid rgba(243,226,190,0.22)', borderRadius: 999, padding: '10px 16px', fontWeight: 700 }}>View menu</button>
          </div>
        </div>
        <ImagePlaceholder title="Hero image" subtitle="Replace with a chef or restaurant exterior photo" height={220} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 16 }}>
        {[
          ['3 stars', 'Fine dining'],
          ['12 courses', 'Seasonal menu'],
          ['48 seats', 'Book early'],
        ].map(([value, label]) => (
          <div key={label} style={{ background: surface, borderRadius: 16, padding: 14, border: '1px solid rgba(200,155,82,0.12)' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: accent }}>{value}</div>
            <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(243,226,190,0.55)' }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
        {[
          ['Oyster & Caviar', 'Brittany oyster, Oscietra caviar, champagne gelee'],
          ['Foie Gras en Croute', 'Duck foie gras, black truffle, brioche'],
          ['Wagyu A5 Tenderloin', 'Japanese A5, bone marrow jus, truffle pomme'],
        ].map(([name, desc]) => (
          <div key={name} style={{ display: 'flex', gap: 14, alignItems: 'center', background: '#18120d', borderRadius: 16, padding: 14, border: '1px solid rgba(200,155,82,0.12)' }}>
            <div style={{ width: 86, flexShrink: 0 }}>
              <ImagePlaceholder title="Dish photo" subtitle="Swap in plated food" height={72} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{name}</div>
              <div style={{ fontSize: 12, color: 'rgba(243,226,190,0.68)', lineHeight: 1.5 }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function BistroPage() {
  const bg = '#FBF4ED'
  const accent = '#C76D22'
  const text = '#221714'
  const surface = '#FFF9F3'
  return (
    <div style={{ height: '100%', overflow: 'auto', background: bg, color: text, fontFamily: "'Helvetica Neue', Arial, sans-serif", padding: 18 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: accent, fontWeight: 700 }}>Neighborhood bistro</div>
          <h2 style={{ margin: '10px 0 8px', fontSize: 30, lineHeight: 1.05, fontWeight: 900 }}>Bistro Nord</h2>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: '#6F5E51' }}>
            A warm, friendly homepage for lunch, takeaway, and dinner bookings.
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
            <button style={{ background: accent, color: '#fff', border: 'none', borderRadius: 999, padding: '11px 16px', fontWeight: 800 }}>Book a table</button>
            <button style={{ background: '#fff', color: text, border: '1px solid rgba(0,0,0,0.08)', borderRadius: 999, padding: '11px 16px', fontWeight: 800 }}>Order takeaway</button>
          </div>
        </div>
        <div style={{ display: 'grid', gap: 10 }}>
          <ImagePlaceholder title="Restaurant exterior" subtitle="Replace with storefront / patio photo" height={150} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              ['Lunch', 'Daily specials and quick service'],
              ['Dinner', 'Table service and tasting options'],
            ].map(([title, desc]) => (
              <div key={title} style={{ background: surface, borderRadius: 16, padding: 14, border: '1px solid rgba(199,109,34,0.12)' }}>
                <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>{title}</div>
                <div style={{ fontSize: 12, color: '#7F6B5D', lineHeight: 1.5 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 10 }}>
        <div style={{ display: 'grid', gap: 10 }}>
          {[
            ['Lunch menu', 'Simple daily dishes with clear pricing.'],
            ['Takeaway', 'Fast pickup flow with opening hours.'],
            ['Events', 'Private rooms and celebrations.'],
          ].map(([title, desc]) => (
            <div key={title} style={{ background: surface, borderRadius: 16, padding: 14, border: '1px solid rgba(199,109,34,0.12)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 800 }}>{title}</div>
                  <div style={{ fontSize: 12, color: '#7F6B5D', marginTop: 4 }}>{desc}</div>
                </div>
                <div style={{ width: 70 }}>
                  <ImagePlaceholder title="Photo" subtitle="Food or room image" height={54} />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ background: '#2B1A12', borderRadius: 18, padding: 14, color: '#FFF9F3' }}>
          <div style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: '#D6A36A' }}>Opening hours</div>
          <div style={{ fontSize: 22, fontWeight: 900, marginTop: 8 }}>Open 11:00 - 23:00</div>
          <div style={{ marginTop: 12 }}>
            <ImagePlaceholder title="Menu board" subtitle="Swap in a blackboard / hero food image" height={170} />
          </div>
        </div>
      </div>
    </div>
  )
}

function CafeBarPage() {
  const bg = '#F9F4ED'
  const accent = '#C27A2B'
  const dark = '#2A1A12'
  return (
    <div style={{ height: '100%', overflow: 'auto', background: bg, color: dark, fontFamily: "'Georgia', serif", padding: 18 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '0.95fr 1.05fr', gap: 16, alignItems: 'stretch' }}>
        <div style={{ background: dark, color: '#F9F4ED', borderRadius: 20, padding: 16 }}>
          <div style={{ fontSize: 11, letterSpacing: 4, textTransform: 'uppercase', color: '#D5A46A' }}>Cafe / bar / bakery</div>
          <h2 style={{ margin: '10px 0 8px', fontSize: 32, lineHeight: 1.05, fontWeight: 400 }}>Harbor Coffee</h2>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: 'rgba(249,244,237,0.72)' }}>
            A cozy homepage that can feel like a cafe in the day and a bar at night.
          </p>
          <div style={{ marginTop: 16 }}>
            <ImagePlaceholder title="Ambience photo" subtitle="Swap in interior / bar photo" height={210} />
          </div>
        </div>
        <div style={{ display: 'grid', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
            {[
              ['Cardamom Latte', '$6.50'],
              ['Negroni Spritz', '$13.00'],
              ['Matcha Tonic', '$7.00'],
              ['Passion Colada', '$11.50'],
            ].map(([name, price]) => (
              <div key={name} style={{ background: '#fff', borderRadius: 16, padding: 12, border: '1px solid rgba(194,122,43,0.12)' }}>
                <ImagePlaceholder title="Drink photo" subtitle="Swap in drink / pastry photo" height={74} />
                <div style={{ fontWeight: 800, marginTop: 10 }}>{name}</div>
                <div style={{ color: accent, fontSize: 13, fontWeight: 700, marginTop: 4 }}>{price}</div>
              </div>
            ))}
          </div>
          <div style={{ background: '#fff', borderRadius: 16, padding: 14, border: '1px solid rgba(194,122,43,0.12)' }}>
            <div style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: accent, fontWeight: 700 }}>From the bakery</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10, marginTop: 10 }}>
              {['Cinnamon Knot', 'Almond Croissant', 'Chocolate Bun'].map((item) => (
                <div key={item} style={{ background: '#2B1A12', borderRadius: 14, padding: 10, color: '#F9F4ED' }}>
                  <ImagePlaceholder title="Bakery" subtitle="Pastry photo placeholder" height={54} />
                  <div style={{ fontSize: 12, fontWeight: 700, marginTop: 8 }}>{item}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function RestaurantShowcase({ onClose }: ShowcaseProps) {
  return shell(
    [
      { label: 'Fine dining', node: <FineDiningPage /> },
      { label: 'Bistro', node: <BistroPage /> },
      { label: 'Cafe bar', node: <CafeBarPage /> },
    ],
    onClose
  )
}
