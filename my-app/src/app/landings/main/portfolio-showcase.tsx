'use client'

import { CarouselShell, ImagePlaceholder, type ShowcaseProps, type SlideSpec } from './website-showcases.shared'

function shell(slides: SlideSpec[], onClose?: () => void) {
  return <CarouselShell title="Portfolio" subtitle="Three personal brand homepage styles" slides={slides} onClose={onClose} />
}

function ArtistPage() {
  return (
    <div style={{ height: '100%', overflow: 'auto', background: '#0C0C0D', color: '#F5F5F5', padding: 18, fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <ImagePlaceholder title="Artist portrait" subtitle="Replace with a strong portrait photo" height={190} />
          </div>
          {['Series I', 'Void Studies', 'Aqua Forms', 'Growth No.3'].map((item, index) => (
            <div key={item} style={{ background: index % 2 === 0 ? '#17171B' : '#111113', borderRadius: 16, padding: 12, border: '1px solid rgba(255,255,255,0.08)' }}>
              <ImagePlaceholder title="Artwork" subtitle="Use a piece from this series" height={120} />
              <div style={{ marginTop: 10, fontWeight: 800 }}>{item}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gap: 10 }}>
          <div style={{ background: '#151518', borderRadius: 18, padding: 16, border: '1px solid rgba(139,92,246,0.18)' }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 4, color: '#8B5CF6' }}>Visual artist</div>
            <h2 style={{ margin: '10px 0 8px', fontSize: 30, lineHeight: 1.05 }}>Mara Chen</h2>
            <p style={{ margin: 0, color: '#A6A6B2', fontSize: 14, lineHeight: 1.7 }}>
              Dark gallery feel with a bold portfolio grid and a clear commission path.
            </p>
          </div>
          <div style={{ background: '#151518', borderRadius: 18, padding: 16, border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 3, color: '#A6A6B2' }}>Available for commissions</div>
            <div style={{ marginTop: 10 }}>
              <ImagePlaceholder title="Commission banner" subtitle="Swap in a custom banner image" height={140} />
            </div>
          </div>
          <div style={{ background: '#151518', borderRadius: 18, padding: 16, border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'grid', gap: 8 }}>
              {['Selected exhibitions', 'Press mentions', 'Contact and booking'].map((item) => (
                <div key={item} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 8 }}>
                  <span>{item}</span>
                  <span style={{ color: '#8B5CF6' }}>{'->'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function DesignerPage() {
  return (
    <div style={{ height: '100%', overflow: 'auto', background: '#F6F7FB', color: '#1B1F24', padding: 18, fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
      <div style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: 16 }}>
        <div style={{ background: '#1D2C3A', color: '#fff', borderRadius: 20, padding: 16 }}>
          <div style={{ fontSize: 11, letterSpacing: 4, textTransform: 'uppercase', color: '#6FB2FF' }}>Product designer</div>
          <h2 style={{ margin: '10px 0 8px', fontSize: 30, lineHeight: 1.05 }}>James Whitfield</h2>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.72)', fontSize: 14, lineHeight: 1.7 }}>
            A clean consulting homepage for designers, speakers, and advisors.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 14 }}>
            {[
              ['12+', 'Years'],
              ['340k', 'Followers'],
              ['28', 'Awards'],
            ].map(([value, label]) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: 10 }}>
                <div style={{ fontSize: 18, fontWeight: 900 }}>{value}</div>
                <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 10 }}>
          <div style={{ background: '#fff', borderRadius: 18, padding: 14, border: '1px solid rgba(29,44,58,0.08)' }}>
            <ImagePlaceholder title="Hero case study" subtitle="Replace with a laptop / UI screenshot" height={170} />
            <div style={{ marginTop: 12, fontWeight: 800, fontSize: 18 }}>Product design that drives growth.</div>
            <div style={{ marginTop: 6, color: '#617185', fontSize: 14, lineHeight: 1.7 }}>
              Case-study style homepage with strong trust and a direct booking CTA.
            </div>
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {['Case studies', 'Speaking', 'About me'].map((item) => (
              <div key={item} style={{ background: '#fff', borderRadius: 18, padding: 14, border: '1px solid rgba(29,44,58,0.08)' }}>
                <div style={{ fontWeight: 800 }}>{item}</div>
                <div style={{ marginTop: 8 }}>
                  <ImagePlaceholder title="Preview" subtitle="Add a relevant image here" height={74} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function AuthorPage() {
  return (
    <div style={{ height: '100%', overflow: 'auto', background: '#FFFDF7', color: '#1A1A1A', padding: 18, fontFamily: "'Georgia', serif" }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.95fr', gap: 16 }}>
        <div style={{ background: '#2D1B69', borderRadius: 20, padding: 16, color: '#fff' }}>
          <div style={{ fontSize: 11, letterSpacing: 4, textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)' }}>Author</div>
          <h2 style={{ margin: '10px 0 8px', fontSize: 32, fontWeight: 400 }}>Sophia Vance</h2>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.72)', fontSize: 14, lineHeight: 1.7 }}>
            A literary homepage that sells the latest book first and keeps events easy to find.
          </p>
          <div style={{ marginTop: 16 }}>
            <ImagePlaceholder title="Book cover hero" subtitle="Replace with the latest cover art" height={190} />
          </div>
        </div>
        <div style={{ display: 'grid', gap: 10 }}>
          {[
            ['The Salt Between Us', 'Latest novel and featured release'],
            ['Paper Meridian', 'Previous book with press highlights'],
            ['Reading dates', 'Event card and ticket link'],
          ].map(([title, desc]) => (
            <div key={title} style={{ background: '#fff', borderRadius: 18, padding: 14, border: '1px solid rgba(45,27,105,0.10)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 800, fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>{title}</div>
                  <div style={{ marginTop: 4, color: '#6F677B', fontFamily: "'Helvetica Neue', Arial, sans-serif", fontSize: 13 }}>{desc}</div>
                </div>
                <div style={{ width: 72 }}>
                  <ImagePlaceholder title="Cover" subtitle="Placeholder image" height={62} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function PortfolioShowcase({ onClose }: ShowcaseProps) {
  return shell(
    [
      { label: 'Artist', node: <ArtistPage /> },
      { label: 'Designer', node: <DesignerPage /> },
      { label: 'Author', node: <AuthorPage /> },
    ],
    onClose
  )
}
