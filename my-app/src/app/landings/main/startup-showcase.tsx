'use client'

import { CarouselShell, ImagePlaceholder, type ShowcaseProps, type SlideSpec } from './website-showcases.shared'

function shell(slides: SlideSpec[], onClose?: () => void) {
  return <CarouselShell title="Startup" subtitle="Three homepage styles for new products" slides={slides} onClose={onClose} />
}

function CoursePage() {
  return (
    <div style={{ height: '100%', overflow: 'auto', background: '#0D1524', color: '#F6FAFF', padding: 18, fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.95fr', gap: 16 }}>
        <div style={{ background: '#12203A', borderRadius: 20, padding: 16, border: '1px solid rgba(86,204,242,0.14)' }}>
          <div style={{ fontSize: 11, letterSpacing: 4, textTransform: 'uppercase', color: '#56CCF2' }}>Course startup</div>
          <h2 style={{ margin: '10px 0 8px', fontSize: 32, lineHeight: 1.05 }}>UpLevel Academy</h2>
          <p style={{ margin: 0, color: '#B7C7D9', fontSize: 14, lineHeight: 1.7 }}>A product page built to sell learning with strong proof and a course catalog.</p>
          <div style={{ marginTop: 16 }}>
            <ImagePlaceholder title="Hero screenshot" subtitle="Swap in a course dashboard or app screenshot" height={200} />
          </div>
        </div>
        <div style={{ display: 'grid', gap: 10 }}>
          {[
            ['AI Product Design', '32 lessons / Intermediate'],
            ['No-Code SaaS Builder', '28 lessons / Beginner'],
            ['Growth Marketing', '40 lessons / Advanced'],
          ].map(([title, desc]) => (
            <div key={title} style={{ background: '#161F34', borderRadius: 18, padding: 14, border: '1px solid rgba(86,204,242,0.12)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '76px 1fr', gap: 12, alignItems: 'center' }}>
                <ImagePlaceholder title="Course" subtitle="Replace with preview art" height={64} />
                <div>
                  <div style={{ fontWeight: 800 }}>{title}</div>
                  <div style={{ color: '#8EA3BA', fontSize: 12, marginTop: 4 }}>{desc}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function IdeaPage() {
  return (
    <div style={{ height: '100%', overflow: 'auto', background: '#FFFCF5', color: '#171717', padding: 18, fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
      <div style={{ display: 'grid', gridTemplateColumns: '0.95fr 1.05fr', gap: 16 }}>
        <div style={{ background: '#FFF4DA', borderRadius: 20, padding: 16, border: '1px solid rgba(255,107,0,0.12)' }}>
          <div style={{ fontSize: 11, letterSpacing: 4, textTransform: 'uppercase', color: '#FF6B00' }}>Innovation lab</div>
          <h2 style={{ margin: '10px 0 8px', fontSize: 32, lineHeight: 1.05 }}>Spark Loop</h2>
          <p style={{ margin: 0, color: '#6C6156', fontSize: 14, lineHeight: 1.7 }}>A community homepage for ideas, experiments, and traction.</p>
          <div style={{ marginTop: 16 }}>
            <ImagePlaceholder title="Idea board hero" subtitle="Replace with bold community image" height={200} />
          </div>
        </div>
        <div style={{ display: 'grid', gap: 10 }}>
          {[
            ['Solar water purifier', 'CleanTech / 234 votes'],
            ['AI tutor for ADHD', 'EdTech / 189 votes'],
            ['Micro-savings app', 'FinTech / 156 votes'],
          ].map(([title, desc]) => (
            <div key={title} style={{ background: '#fff', borderRadius: 18, padding: 14, border: '1px solid rgba(255,107,0,0.12)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr auto', gap: 12, alignItems: 'center' }}>
                <ImagePlaceholder title="Idea" subtitle="Placeholder image" height={60} />
                <div>
                  <div style={{ fontWeight: 800 }}>{title}</div>
                  <div style={{ color: '#746A5F', fontSize: 12, marginTop: 4 }}>{desc}</div>
                </div>
                <div style={{ color: '#FF6B00', fontWeight: 900 }}>+1</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function SaaSPage() {
  return (
    <div style={{ height: '100%', overflow: 'auto', background: '#0F1A2D', color: '#F6FAFF', padding: 18, fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ background: '#15233D', borderRadius: 20, padding: 16, border: '1px solid rgba(86,204,242,0.14)' }}>
          <div style={{ fontSize: 11, letterSpacing: 4, textTransform: 'uppercase', color: '#56CCF2' }}>SaaS launch</div>
          <h2 style={{ margin: '10px 0 8px', fontSize: 32, lineHeight: 1.05 }}>Novaris</h2>
          <p style={{ margin: 0, color: '#B7C7D9', fontSize: 14, lineHeight: 1.7 }}>A premium startup homepage with waitlist CTA and product trust cues.</p>
          <div style={{ marginTop: 16 }}>
            <ImagePlaceholder title="Product UI" subtitle="Replace with dashboard screenshot" height={200} />
          </div>
        </div>
        <div style={{ display: 'grid', gap: 10 }}>
          {[
            ['Security', 'SOC 2, GDPR, and privacy notes'],
            ['Analytics', 'Outcome metrics and usage'],
            ['Integrations', 'Works with the stack you already use'],
          ].map(([title, desc]) => (
            <div key={title} style={{ background: '#111B2B', borderRadius: 18, padding: 14, border: '1px solid rgba(86,204,242,0.12)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '72px 1fr', gap: 12, alignItems: 'center' }}>
                <ImagePlaceholder title="Module" subtitle="Placeholder visual" height={62} />
                <div>
                  <div style={{ fontWeight: 800 }}>{title}</div>
                  <div style={{ color: '#8EA3BA', fontSize: 12, marginTop: 4 }}>{desc}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function StartupShowcase({ onClose }: ShowcaseProps) {
  return shell(
    [
      { label: 'Courses', node: <CoursePage /> },
      { label: 'Ideas', node: <IdeaPage /> },
      { label: 'SaaS', node: <SaaSPage /> },
    ],
    onClose
  )
}

