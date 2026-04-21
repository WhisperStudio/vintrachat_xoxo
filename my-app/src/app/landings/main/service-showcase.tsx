'use client'

import { BookingCalendar, CarouselShell, ImagePlaceholder, type ShowcaseProps, type SlideSpec } from './website-showcases.shared'

function shell(slides: SlideSpec[], onClose?: () => void) {
  return (
    <CarouselShell
      title="Services & Hospitality"
      subtitle="Three homepage styles for appointment-led businesses"
      slides={slides}
      navItems={['Bookings', 'Services', 'Contact']}
      footerNote="Booking calendar, service cards, and contact paths"
      onClose={onClose}
    />
  )
}

function SalonPage() {
  return (
    <div style={{ height: '100%', overflow: 'auto', background: '#FBF7F4', color: '#1D1513', padding: 18, fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
      <div style={{ display: 'grid', gridTemplateColumns: '0.95fr 1.05fr', gap: 16 }}>
        <div style={{ background: '#1D1513', color: '#FBF7F4', borderRadius: 20, padding: 16 }}>
          <div style={{ fontSize: 11, letterSpacing: 4, textTransform: 'uppercase', color: '#C7A589' }}>Hair studio</div>
          <h2 style={{ margin: '10px 0 8px', fontSize: 32, lineHeight: 1.05 }}>Atelier Coif</h2>
          <p style={{ margin: 0, color: 'rgba(251,247,244,0.72)', fontSize: 14, lineHeight: 1.7 }}>A polished booking-first homepage for a beauty studio.</p>
          <div style={{ marginTop: 16 }}>
            <ImagePlaceholder title="Salon hero photo" subtitle="Swap in stylist / interior image" height={200} />
          </div>
        </div>
        <div style={{ display: 'grid', gap: 10 }}>
          {[
            ['Cut & Style', '60 min booking'],
            ['Full Color', '120 min booking'],
            ['Balayage', '150 min booking'],
          ].map(([title, desc]) => (
            <div key={title} style={{ background: '#fff', borderRadius: 18, padding: 14, border: '1px solid rgba(29,21,19,0.10)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '72px 1fr', gap: 12, alignItems: 'center' }}>
                <ImagePlaceholder title="Service" subtitle="Add a photo or icon" height={62} />
                <div>
                  <div style={{ fontWeight: 800 }}>{title}</div>
                  <div style={{ color: '#7D6B61', fontSize: 12, marginTop: 4 }}>{desc}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '72px 1fr', gap: 12, alignItems: 'start' }}>
        <div style={{ background: '#fff', borderRadius: 18, padding: 14, border: '1px solid rgba(29,21,19,0.10)', textAlign: 'center' }}>
          <div style={{ fontSize: 26 }}>📅</div>
          <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#7D6B61', marginTop: 6 }}>Book</div>
        </div>
        <BookingCalendar theme={{ background: '#FBF7F4', panel: '#1D1513', surface: '#FFFFFF', accent: '#8A6A4A', text: '#1D1513', muted: '#7D6B61', border: 'rgba(29,21,19,0.12)' }} title="Salon booking" subtitle="Choose a day and a time" />
      </div>
    </div>
  )
}

function TradesPage() {
  return (
    <div style={{ height: '100%', overflow: 'auto', background: '#F0F4F8', color: '#162A3E', padding: 18, fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', gap: 16 }}>
        <div style={{ background: '#1A3C5E', color: '#fff', borderRadius: 20, padding: 16 }}>
          <div style={{ fontSize: 11, letterSpacing: 4, textTransform: 'uppercase', color: '#F5A623' }}>Tradesperson</div>
          <h2 style={{ margin: '10px 0 8px', fontSize: 32, lineHeight: 1.05 }}>NordFix Pro</h2>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.72)', fontSize: 14, lineHeight: 1.7 }}>A confident local business homepage focused on calls and quotes.</p>
          <div style={{ marginTop: 16 }}>
            <ImagePlaceholder title="Truck / work photo" subtitle="Replace with work vehicle or job photo" height={200} />
          </div>
        </div>
        <div style={{ display: 'grid', gap: 10 }}>
          {[
            ['Emergency callout', 'Response within 90 minutes'],
            ['Heating service', 'Installations and repairs'],
            ['Certificates', 'Landlord and compliance'],
          ].map(([title, desc]) => (
            <div key={title} style={{ background: '#fff', borderRadius: 18, padding: 14, border: '1px solid rgba(26,60,94,0.10)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '72px 1fr', gap: 12, alignItems: 'center' }}>
                <ImagePlaceholder title="Job image" subtitle="Add before / after image" height={62} />
                <div>
                  <div style={{ fontWeight: 800 }}>{title}</div>
                  <div style={{ color: '#617185', fontSize: 12, marginTop: 4 }}>{desc}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '72px 1fr', gap: 12, alignItems: 'start' }}>
        <div style={{ background: '#fff', borderRadius: 18, padding: 14, border: '1px solid rgba(26,60,94,0.10)', textAlign: 'center' }}>
          <div style={{ fontSize: 26 }}>📅</div>
          <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#617185', marginTop: 6 }}>Book</div>
        </div>
        <BookingCalendar theme={{ background: '#F0F4F8', panel: '#1A3C5E', surface: '#FFFFFF', accent: '#1A3C5E', text: '#162A3E', muted: '#617185', border: 'rgba(26,60,94,0.10)' }} title="Booking system" subtitle="Pick a service window" />
      </div>
    </div>
  )
}

function HotelPage() {
  return (
    <div style={{ height: '100%', overflow: 'auto', background: '#08111C', color: '#F3F8FF', padding: 18, fontFamily: "'Georgia', serif" }}>
      <div style={{ display: 'grid', gridTemplateColumns: '0.95fr 1.05fr', gap: 16 }}>
        <div style={{ background: '#0F1C2C', color: '#F3F8FF', borderRadius: 20, padding: 16, border: '1px solid rgba(78,168,222,0.14)' }}>
          <div style={{ fontSize: 11, letterSpacing: 4, textTransform: 'uppercase', color: '#D4AF37' }}>Boutique hotel</div>
          <h2 style={{ margin: '10px 0 8px', fontSize: 32, lineHeight: 1.05, fontWeight: 400 }}>Villa Solstice</h2>
          <p style={{ margin: 0, color: 'rgba(243,248,255,0.68)', fontSize: 14, lineHeight: 1.7 }}>A premium booking homepage for stays, spa, and dining.</p>
          <div style={{ marginTop: 16 }}>
            <ImagePlaceholder title="Hotel hero" subtitle="Replace with a view / room photo" height={200} />
          </div>
        </div>
        <div style={{ display: 'grid', gap: 10 }}>
          {[
            ['Caldera Suite', 'Sea view / luxury suite'],
            ['Spa access', 'Wellness packages'],
            ['Dining', 'Breakfast and tasting menu'],
          ].map(([title, desc]) => (
            <div key={title} style={{ background: '#111B2C', borderRadius: 18, padding: 14, border: '1px solid rgba(78,168,222,0.12)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '72px 1fr', gap: 12, alignItems: 'center' }}>
                <ImagePlaceholder title="Room photo" subtitle="Add a room or amenity image" height={62} />
                <div>
                  <div style={{ fontWeight: 800 }}>{title}</div>
                  <div style={{ color: '#A7B9CC', fontSize: 12, marginTop: 4 }}>{desc}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function ServiceShowcase({ onClose }: ShowcaseProps) {
  return shell(
    [
      { label: 'Salon', node: <SalonPage /> },
      { label: 'Trades', node: <TradesPage /> },
      { label: 'Hotel', node: <HotelPage /> },
    ],
    onClose
  )
}
