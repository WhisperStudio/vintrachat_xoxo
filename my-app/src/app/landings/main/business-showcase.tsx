'use client'

import { CarouselShell, ImagePlaceholder, type ShowcaseProps, type SlideSpec } from './website-showcases.shared'

function shell(slides: SlideSpec[], onClose?: () => void) {
  return <CarouselShell title="Business" subtitle="Three professional homepage styles" slides={slides} onClose={onClose} />
}

function RealEstatePage() {
  return (
    <div style={{ height: '100%', overflow: 'auto', background: '#F4F7FB', color: '#18211A', padding: 18, fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.95fr', gap: 16 }}>
        <div style={{ background: '#1C2B1A', borderRadius: 20, padding: 16, color: '#fff' }}>
          <div style={{ fontSize: 11, letterSpacing: 4, textTransform: 'uppercase', color: '#E8D9B0' }}>Real estate</div>
          <h2 style={{ margin: '10px 0 8px', fontSize: 32, lineHeight: 1.05 }}>Meridian Estates</h2>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.72)', fontSize: 14, lineHeight: 1.7 }}>A professional homepage that puts listings and valuation first.</p>
          <div style={{ marginTop: 16 }}>
            <ImagePlaceholder title="Featured property" subtitle="Swap in a house / apartment hero image" height={200} />
          </div>
        </div>
        <div style={{ display: 'grid', gap: 10 }}>
          {[
            ['Penthouse, Aker Brygge', 'Premium listing'],
            ['Family home, Frogner', 'Broad appeal'],
            ['Studio, Grunerlokka', 'Starter home'],
          ].map(([title, desc]) => (
            <div key={title} style={{ background: '#fff', borderRadius: 18, padding: 14, border: '1px solid rgba(24,33,26,0.10)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '72px 1fr', gap: 12, alignItems: 'center' }}>
                <ImagePlaceholder title="Property" subtitle="Add listing photo" height={62} />
                <div>
                  <div style={{ fontWeight: 800 }}>{title}</div>
                  <div style={{ color: '#66726A', fontSize: 12, marginTop: 4 }}>{desc}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function YachtPage() {
  return (
    <div style={{ height: '100%', overflow: 'auto', background: '#08111C', color: '#F3F8FF', padding: 18, fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
      <div style={{ display: 'grid', gridTemplateColumns: '0.95fr 1.05fr', gap: 16 }}>
        <div style={{ background: '#0F1C2C', borderRadius: 20, padding: 16, border: '1px solid rgba(78,168,222,0.14)' }}>
          <div style={{ fontSize: 11, letterSpacing: 4, textTransform: 'uppercase', color: '#4EA8DE' }}>Yacht brokerage</div>
          <h2 style={{ margin: '10px 0 8px', fontSize: 32, lineHeight: 1.05 }}>Nordic Yachts</h2>
          <p style={{ margin: 0, color: '#A7B9CC', fontSize: 14, lineHeight: 1.7 }}>A premium marine homepage for vessels, valuation, and brokerage.</p>
          <div style={{ marginTop: 16 }}>
            <ImagePlaceholder title="Yacht hero" subtitle="Replace with boat / marina photo" height={200} />
          </div>
        </div>
        <div style={{ display: 'grid', gap: 10 }}>
          {[
            ['Sunseeker Predator 74', 'Motor yacht'],
            ['Hallberg-Rassy 44', 'Sailing yacht'],
            ['Axopar 37 Sun-Top', 'Day cruiser'],
          ].map(([title, desc]) => (
            <div key={title} style={{ background: '#111B2C', borderRadius: 18, padding: 14, border: '1px solid rgba(78,168,222,0.12)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '72px 1fr', gap: 12, alignItems: 'center' }}>
                <ImagePlaceholder title="Vessel" subtitle="Add boat photo" height={62} />
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

function InsurancePage() {
  return (
    <div style={{ height: '100%', overflow: 'auto', background: '#F3F6FB', color: '#182034', padding: 18, fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.95fr', gap: 16 }}>
        <div style={{ background: '#1B2A6B', borderRadius: 20, padding: 16, color: '#fff' }}>
          <div style={{ fontSize: 11, letterSpacing: 4, textTransform: 'uppercase', color: '#B9C6FF' }}>Insurance</div>
          <h2 style={{ margin: '10px 0 8px', fontSize: 32, lineHeight: 1.05 }}>Nordguard</h2>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.72)', fontSize: 14, lineHeight: 1.7 }}>A trust-first homepage with clear quote paths and support info.</p>
          <div style={{ marginTop: 16 }}>
            <ImagePlaceholder title="Illustration" subtitle="Use a shield / family / home graphic" height={200} />
          </div>
        </div>
        <div style={{ display: 'grid', gap: 10 }}>
          {[
            ['Home & property', 'Popular cover'],
            ['Business liability', 'B2B cover'],
            ['Travel insurance', 'Cross sell'],
          ].map(([title, desc]) => (
            <div key={title} style={{ background: '#fff', borderRadius: 18, padding: 14, border: '1px solid rgba(27,42,107,0.10)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '72px 1fr', gap: 12, alignItems: 'center' }}>
                <ImagePlaceholder title="Cover" subtitle="Add icon or visual" height={62} />
                <div>
                  <div style={{ fontWeight: 800 }}>{title}</div>
                  <div style={{ color: '#65728C', fontSize: 12, marginTop: 4 }}>{desc}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function BusinessShowcase({ onClose }: ShowcaseProps) {
  return shell(
    [
      { label: 'Real estate', node: <RealEstatePage /> },
      { label: 'Yachts', node: <YachtPage /> },
      { label: 'Insurance', node: <InsurancePage /> },
    ],
    onClose
  )
}

