'use client'

import { useState } from 'react'

// ─── Shared types & nav ────────────────────────────────────────────────────

interface ShowcaseProps {
  onClose?: () => void
}

function Nav({ onClose }: { onClose?: () => void }) {
  return (
    <button
      onClick={onClose}
      style={{
        position: 'absolute', top: 12, right: 12, zIndex: 10,
        background: 'rgba(0,0,0,0.15)', border: 'none', borderRadius: '50%',
        width: 32, height: 32, cursor: 'pointer', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
      }}
    >✕</button>
  )
}

function InnerCarousel({ slides }: { slides: React.ReactNode[] }) {
  const [i, setI] = useState(0)
  return (
    <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {slides.map((s, idx) => (
          <div key={idx} style={{
            position: 'absolute', inset: 0,
            opacity: idx === i ? 1 : 0,
            transition: 'opacity 0.45s ease',
            pointerEvents: idx === i ? 'auto' : 'none',
          }}>{s}</div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '10px 0', background: 'rgba(0,0,0,0.04)' }}>
        {slides.map((_, idx) => (
          <button key={idx} onClick={() => setI(idx)} style={{
            width: idx === i ? 24 : 8, height: 8, borderRadius: 4,
            background: idx === i ? '#fff' : 'rgba(255,255,255,0.4)',
            border: 'none', cursor: 'pointer', transition: 'all 0.3s', padding: 0,
          }} />
        ))}
        <button onClick={() => setI((i - 1 + slides.length) % slides.length)} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.2)', border: 'none', color: '#fff', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', fontSize: 13 }}>‹</button>
        <button onClick={() => setI((i + 1) % slides.length)} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.2)', border: 'none', color: '#fff', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', fontSize: 13 }}>›</button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// RESTAURANT
// ═══════════════════════════════════════════════════════════════════

// 1. Fine dining
function FineRestaurant() {
  return (
    <div style={{ height: '100%', background: '#0D0D0D', color: '#E8D5B0', fontFamily: 'Georgia, serif', display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      <div style={{ position: 'relative', height: 180, background: 'linear-gradient(160deg,#1A1208 0%,#2C1A06 60%,#0D0D0D 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(180,120,30,0.18) 0%, transparent 70%)' }} />
        <div style={{ fontSize: 11, letterSpacing: 6, color: '#C4963A', marginBottom: 8, textTransform: 'uppercase' }}>Est. 1987 · Paris</div>
        <h1 style={{ fontSize: 32, fontWeight: 400, letterSpacing: 3, margin: 0, color: '#E8D5B0' }}>L'Étoile d'Or</h1>
        <div style={{ width: 40, height: 1, background: '#C4963A', margin: '10px auto' }} />
        <div style={{ fontSize: 11, letterSpacing: 3, color: '#8A7050', textTransform: 'uppercase' }}>Michelin ★★★</div>
      </div>
      <div style={{ flex: 1, padding: '20px 20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 11, letterSpacing: 4, color: '#C4963A', textTransform: 'uppercase', textAlign: 'center' }}>Tasting Menu</div>
        {[
          { name: 'Oyster & Caviar', desc: 'Brittany oyster, Oscietra caviar, champagne gelée', price: '€48' },
          { name: 'Foie Gras en Croûte', desc: 'Duck foie gras, black truffle, brioche', price: '€56' },
          { name: 'Wagyu A5 Tenderloin', desc: 'Japanese A5, bone marrow jus, truffle pomme', price: '€89' },
        ].map(d => (
          <div key={d.name} style={{ display: 'flex', gap: 12, paddingBottom: 14, borderBottom: '1px solid rgba(196,150,58,0.15)' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: '#E8D5B0', marginBottom: 3 }}>{d.name}</div>
              <div style={{ fontSize: 11, color: '#6A5A40', lineHeight: 1.5 }}>{d.desc}</div>
            </div>
            <div style={{ fontSize: 13, color: '#C4963A', fontWeight: 600, whiteSpace: 'nowrap' }}>{d.price}</div>
          </div>
        ))}
        <button style={{ background: 'transparent', border: '1px solid #C4963A', color: '#C4963A', borderRadius: 2, padding: '10px 0', fontSize: 11, letterSpacing: 4, textTransform: 'uppercase', cursor: 'pointer' }}>
          Reserve a Table
        </button>
      </div>
    </div>
  )
}

// 2. Fast food
function FastFoodRestaurant() {
  return (
    <div style={{ height: '100%', background: '#FFF200', fontFamily: "'Helvetica Neue', sans-serif", display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      <div style={{ background: '#E63000', padding: '16px 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ color: '#FFF200', fontWeight: 900, fontSize: 22, letterSpacing: -0.5 }}>BRGR°CO</div>
          <div style={{ color: 'rgba(255,242,0,0.7)', fontSize: 10, fontWeight: 700, letterSpacing: 2 }}>FAST & FRESH</div>
        </div>
        <div style={{ background: '#FFF200', borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 900, color: '#E63000' }}>🛵 Delivery</div>
      </div>
      <div style={{ background: '#E63000', padding: '0 16px 16px' }}>
        <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14 }}>🔍</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Search menu…</span>
        </div>
      </div>
      <div style={{ flex: 1, background: '#FFF200', padding: 14, display: 'flex', flexDirection: 'column', gap: 10, overflow: 'auto' }}>
        <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 2, color: '#E63000', textTransform: 'uppercase' }}>🔥 Best Sellers</div>
        {[
          { name: 'DOUBLE SMASH', desc: 'Double patty, smash sauce, pickles, onion', price: '$12.90', tag: '#1' },
          { name: 'CRISPY BIRD', desc: 'Fried chicken, slaw, sriracha honey', price: '$10.50', tag: 'NEW' },
          { name: 'VEGGIE FIRE', desc: 'Black bean patty, roasted pepper, aioli', price: '$9.90', tag: '' },
        ].map(d => (
          <div key={d.name} style={{ background: '#fff', borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 44, height: 44, borderRadius: 8, background: '#E63000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>🍔</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontWeight: 900, fontSize: 13 }}>{d.name}</span>
                {d.tag && <span style={{ background: '#E63000', color: '#FFF200', fontSize: 9, fontWeight: 900, padding: '1px 5px', borderRadius: 3 }}>{d.tag}</span>}
              </div>
              <div style={{ fontSize: 11, color: '#888' }}>{d.desc}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 900, fontSize: 13 }}>{d.price}</div>
              <button style={{ background: '#E63000', border: 'none', color: '#FFF200', borderRadius: 4, padding: '2px 8px', fontSize: 16, cursor: 'pointer', fontWeight: 900, lineHeight: 1 }}>+</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// 3. Café & bar
function CafeBar() {
  return (
    <div style={{ height: '100%', background: '#FAF7F2', fontFamily: "'Georgia', serif", display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      <div style={{ background: '#2C1810', padding: '18px 18px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#C4832A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>☕</div>
        <div>
          <div style={{ color: '#FAF7F2', fontWeight: 700, fontSize: 18, letterSpacing: 0.5 }}>Dusk & Dawn</div>
          <div style={{ color: '#C4832A', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' }}>Café · Bar · Bakery</div>
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(250,247,242,0.5)' }}>Open til 01:00</div>
      </div>
      <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 14, overflow: 'auto' }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: '#C4832A', textTransform: 'uppercase' }}>Signature Drinks</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { name: 'Cardamom Latte', emoji: '☕', price: '$6.50', tag: 'Hot / Iced' },
            { name: 'Negroni Spritz', emoji: '🍊', price: '$13.00', tag: 'Signature' },
            { name: 'Matcha Tonic', emoji: '🍵', price: '$7.00', tag: 'Bestseller' },
            { name: 'Passion Colada', emoji: '🥥', price: '$11.50', tag: 'Non-alc' },
          ].map(d => (
            <div key={d.name} style={{ background: '#fff', borderRadius: 10, padding: '12px 10px', border: '1px solid rgba(196,131,42,0.15)' }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>{d.emoji}</div>
              <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 2 }}>{d.name}</div>
              <div style={{ fontSize: 10, color: '#C4832A', marginBottom: 6 }}>{d.tag}</div>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#2C1810' }}>{d.price}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: '#2C1810', textTransform: 'uppercase', marginTop: 4 }}>From the Bakery</div>
        <div style={{ display: 'flex', gap: 10, overflow: 'hidden' }}>
          {[
            { name: 'Cinnamon Knot', emoji: '🌀', price: '$4' },
            { name: 'Almond Croissant', emoji: '🥐', price: '$5' },
            { name: 'Chocolate Bun', emoji: '🍫', price: '$4.50' },
          ].map(d => (
            <div key={d.name} style={{ background: '#2C1810', borderRadius: 10, padding: '10px 8px', textAlign: 'center', minWidth: 80, flex: 1 }}>
              <div style={{ fontSize: 22 }}>{d.emoji}</div>
              <div style={{ fontSize: 10, color: '#FAF7F2', fontWeight: 600, marginTop: 4 }}>{d.name}</div>
              <div style={{ fontSize: 11, color: '#C4832A', fontWeight: 700, marginTop: 2 }}>{d.price}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function RestaurantShowcase({ onClose }: ShowcaseProps) {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#111', position: 'relative' }}>
      <Nav onClose={onClose} />
      <div style={{ padding: '14px 16px 10px', background: '#1A1A1A', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ fontSize: 11, color: '#888', letterSpacing: 2, textTransform: 'uppercase' }}>Restaurant</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginTop: 2 }}>Three ways to serve food</div>
      </div>
      <InnerCarousel slides={[<FineRestaurant />, <FastFoodRestaurant />, <CafeBar />]} />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// PORTFOLIO
// ═══════════════════════════════════════════════════════════════════

// 1. Artist gallery
function ArtistGallery() {
  return (
    <div style={{ height: '100%', background: '#0A0A0A', color: '#fff', fontFamily: "'Helvetica Neue', sans-serif", display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      <div style={{ padding: '16px 16px 12px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontWeight: 900, fontSize: 20, letterSpacing: -0.5 }}>MARA CHEN</div>
        <div style={{ fontSize: 10, color: '#666', letterSpacing: 3, textTransform: 'uppercase' }}>Visual Artist</div>
      </div>
      <div style={{ flex: 1, padding: 12, display: 'flex', flexDirection: 'column', gap: 10, overflow: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { bg: 'linear-gradient(135deg,#FF6B35,#F7C59F)', label: 'Series I', year: '2024' },
            { bg: 'linear-gradient(135deg,#2C2C54,#706FD3)', label: 'Void Studies', year: '2023', tall: true },
            { bg: 'linear-gradient(135deg,#00B4D8,#0077B6)', label: 'Aqua Forms', year: '2024' },
            { bg: 'linear-gradient(135deg,#1B4332,#52B788)', label: 'Growth No.3', year: '2023' },
          ].map((p, i) => (
            <div key={i} style={{ borderRadius: 6, overflow: 'hidden', position: 'relative', aspectRatio: i === 1 ? undefined : '4/3', height: i === 1 ? 160 : undefined, background: p.bg }}>
              <div style={{ position: 'absolute', bottom: 6, left: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>{p.label}</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>{p.year}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
          <div style={{ fontSize: 11, color: '#666' }}>24 works · Mixed media</div>
          <button style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: 4, padding: '5px 12px', fontSize: 11, cursor: 'pointer' }}>View All</button>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '12px 14px' }}>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Available for commissions</div>
          <div style={{ fontSize: 12, color: '#fff' }}>Exhibitions: MoMA PS1 · Venice Biennale 2024</div>
        </div>
      </div>
    </div>
  )
}

// 2. Personal bio / professional
function PersonalBio() {
  return (
    <div style={{ height: '100%', background: '#F8F6F1', fontFamily: "'Georgia', serif", display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      <div style={{ background: '#1C2B3A', padding: '20px 18px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg,#5B9BD5,#2C7BE5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 12 }}>👤</div>
        <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: '0 0 4px', letterSpacing: -0.3 }}>James Whitfield</h2>
        <div style={{ color: '#5B9BD5', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' }}>Product Designer · Speaker · Advisor</div>
        <div style={{ display: 'flex', gap: 16, marginTop: 14 }}>
          {[['12+', 'Years Exp'], ['340k', 'Followers'], ['28', 'Awards']].map(([v, l]) => (
            <div key={l}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>{v}</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14, overflow: 'auto' }}>
        <p style={{ fontSize: 13, color: '#4A4A4A', lineHeight: 1.7, margin: 0 }}>
          I help companies build products people love. Previously at Google, Airbnb, and Stripe — now consulting independently across Europe and the US.
        </p>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: '#1C2B3A', textTransform: 'uppercase', marginBottom: 8 }}>Recent Work</div>
          {['Redesigned Stripe Checkout — +23% conversion', 'Led design system at Airbnb (2019–2022)', 'Speaker at Config 2024, Copenhagen'].map(item => (
            <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#2C7BE5', marginTop: 5, flexShrink: 0 }} />
              <div style={{ fontSize: 12, color: '#333', lineHeight: 1.5 }}>{item}</div>
            </div>
          ))}
        </div>
        <button style={{ background: '#1C2B3A', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 0', fontSize: 12, fontWeight: 600, cursor: 'pointer', letterSpacing: 0.5 }}>
          Download CV / Book a Call
        </button>
      </div>
    </div>
  )
}

// 3. Author portfolio
function AuthorPortfolio() {
  return (
    <div style={{ height: '100%', background: '#FFFDF7', fontFamily: "'Georgia', serif", display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      <div style={{ background: '#2D1B69', padding: '18px 18px 14px' }}>
        <div style={{ fontSize: 10, letterSpacing: 4, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6 }}>Author · Novelist · Essayist</div>
        <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 400, margin: '0 0 4px', letterSpacing: 0.5 }}>Sophia Vance</h1>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>NYT Bestselling Author · 3 novels published</div>
      </div>
      <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 14, overflow: 'auto' }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: '#2D1B69', textTransform: 'uppercase' }}>Books</div>
        {[
          { title: 'The Salt Between Us', year: '2024', genre: 'Literary Fiction', color: '#C84B31' },
          { title: 'Paper Meridian', year: '2022', genre: 'Historical Drama', color: '#2D6A4F' },
          { title: 'After the Archipelago', year: '2019', genre: 'Debut Novel', color: '#2D1B69' },
        ].map(b => (
          <div key={b.title} style={{ display: 'flex', gap: 12, alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
            <div style={{ width: 36, height: 50, borderRadius: 4, background: b.color, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 18 }}>📖</span>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#1A1A1A' }}>{b.title}</div>
              <div style={{ fontSize: 11, color: '#888' }}>{b.genre} · {b.year}</div>
              <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                {'★★★★★'.split('').map((s, i) => <span key={i} style={{ color: '#F0A500', fontSize: 10 }}>{s}</span>)}
              </div>
            </div>
          </div>
        ))}
        <div style={{ background: '#2D1B69', borderRadius: 8, padding: '12px 14px', color: '#fff' }}>
          <div style={{ fontSize: 11, marginBottom: 4, opacity: 0.7 }}>Next reading — Oslo, March 2025</div>
          <button style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: 5, padding: '6px 14px', fontSize: 11, cursor: 'pointer' }}>Get Tickets</button>
        </div>
      </div>
    </div>
  )
}

export function PortfolioShowcase({ onClose }: ShowcaseProps) {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#111', position: 'relative' }}>
      <Nav onClose={onClose} />
      <div style={{ padding: '14px 16px 10px', background: '#1A1A1A', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ fontSize: 11, color: '#888', letterSpacing: 2, textTransform: 'uppercase' }}>Portfolio</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginTop: 2 }}>Three ways to showcase yourself</div>
      </div>
      <InnerCarousel slides={[<ArtistGallery />, <PersonalBio />, <AuthorPortfolio />]} />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// NETTBUTIKK / E-COMMERCE
// ═══════════════════════════════════════════════════════════════════

// 1. Fashion / clothing
function FashionStore() {
  return (
    <div style={{ height: '100%', background: '#FAF9F7', fontFamily: "'Helvetica Neue', sans-serif", display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      <div style={{ background: '#fff', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E8E4DE' }}>
        <span style={{ fontWeight: 900, fontSize: 16, letterSpacing: 4, textTransform: 'uppercase' }}>MODE</span>
        <span style={{ fontSize: 12, color: '#888' }}>🛒 3</span>
      </div>
      <div style={{ padding: '10px 12px', display: 'flex', gap: 8, borderBottom: '1px solid #E8E4DE', background: '#fff', overflowX: 'auto' }}>
        {['All', 'New In', 'Coats', 'Knitwear', 'Trousers'].map(c => (
          <button key={c} style={{ background: c === 'All' ? '#111' : 'transparent', color: c === 'All' ? '#fff' : '#888', border: '1px solid #E0DDD8', borderRadius: 20, padding: '4px 12px', fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap' }}>{c}</button>
        ))}
      </div>
      <div style={{ flex: 1, padding: 12, overflow: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { name: 'Cashmere Coat', price: '$349', tag: 'NEW', bg: '#D6CCC2' },
            { name: 'Merino Turtleneck', price: '$129', tag: '', bg: '#2C2C2C' },
            { name: 'Wide Leg Trouser', price: '$189', tag: 'SALE', bg: '#8B7B6B' },
            { name: 'Linen Blazer', price: '$249', tag: '', bg: '#C4B99A' },
          ].map(p => (
            <div key={p.name} style={{ borderRadius: 8, overflow: 'hidden', background: '#fff', border: '1px solid #E8E4DE' }}>
              <div style={{ height: 110, background: p.bg, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
                👗
                {p.tag && <div style={{ position: 'absolute', top: 8, left: 8, background: p.tag === 'SALE' ? '#E63000' : '#111', color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 2 }}>{p.tag}</div>}
              </div>
              <div style={{ padding: '8px 10px 10px' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#222', marginBottom: 2 }}>{p.name}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{p.price}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// 2. Electronics
function ElectronicsStore() {
  return (
    <div style={{ height: '100%', background: '#0E0E14', fontFamily: "'Helvetica Neue', sans-serif", display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      <div style={{ background: '#16161E', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span style={{ fontWeight: 900, fontSize: 16, color: '#00D4FF', letterSpacing: 1 }}>VOLT°</span>
        <div style={{ display: 'flex', gap: 12, fontSize: 18 }}>
          <span style={{ cursor: 'pointer' }}>🔍</span>
          <span style={{ cursor: 'pointer' }}>🛒</span>
        </div>
      </div>
      <div style={{ background: 'linear-gradient(135deg,#1A1A2E,#16213E)', padding: '16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: '#00D4FF', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 4 }}>New Drop</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', letterSpacing: -0.5 }}>ProBook Ultra X1</div>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 10 }}>M4 chip · 24h battery · 2.1kg</div>
          <button style={{ background: '#00D4FF', border: 'none', borderRadius: 6, padding: '7px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', color: '#0E0E14' }}>Shop now — $1,899</button>
        </div>
        <div style={{ fontSize: 52 }}>💻</div>
      </div>
      <div style={{ flex: 1, padding: 12, display: 'flex', flexDirection: 'column', gap: 8, overflow: 'auto' }}>
        {[
          { name: 'AirPod Max Pro', price: '$549', specs: '40h · ANC · Spatial Audio', emoji: '🎧', hot: true },
          { name: 'UltraWatch S9', price: '$399', specs: 'AMOLED · GPS · 7-day battery', emoji: '⌚', hot: false },
          { name: 'TabX Pro 12"', price: '$849', specs: 'M4 · 13MP · Apple Pencil', emoji: '📱', hot: false },
        ].map(p => (
          <div key={p.name} style={{ background: '#16161E', borderRadius: 8, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10, border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: 28 }}>{p.emoji}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: '#fff' }}>{p.name}</span>
                {p.hot && <span style={{ background: '#FF3E3E', color: '#fff', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3 }}>HOT</span>}
              </div>
              <div style={{ fontSize: 10, color: '#555' }}>{p.specs}</div>
            </div>
            <div style={{ fontWeight: 700, color: '#00D4FF', fontSize: 13 }}>{p.price}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// 3. Car parts
function CarPartsStore() {
  return (
    <div style={{ height: '100%', background: '#1A1A1A', fontFamily: "'Helvetica Neue', sans-serif", display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      <div style={{ background: '#E63000', padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 18 }}>🔧</span>
        <span style={{ fontWeight: 900, fontSize: 16, color: '#fff', letterSpacing: 0.5 }}>GEARHEAD PARTS</span>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>🚗 + 🛒</span>
      </div>
      <div style={{ background: '#242424', padding: '10px 14px', display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, background: '#333', borderRadius: 6, padding: '7px 12px', fontSize: 11, color: '#666' }}>🔍  Search part or OEM number…</div>
      </div>
      <div style={{ padding: '10px 12px 4px', display: 'flex', gap: 8, overflowX: 'auto' }}>
        {['Engine', 'Suspension', 'Brakes', 'Exhaust', 'Lighting'].map(c => (
          <button key={c} style={{ background: c === 'Engine' ? '#E63000' : '#2A2A2A', color: '#fff', border: 'none', borderRadius: 5, padding: '5px 10px', fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap' }}>{c}</button>
        ))}
      </div>
      <div style={{ flex: 1, padding: '8px 12px 12px', display: 'flex', flexDirection: 'column', gap: 8, overflow: 'auto' }}>
        {[
          { name: 'Brembo GT Brake Kit', sku: 'BRM-GT-09', price: '$849', fits: 'BMW M3 / M4', emoji: '🔴', stock: 'In Stock' },
          { name: 'Bilstein B16 Coilovers', sku: 'BIL-B16-488', price: '$1,290', fits: 'Porsche 911 GT3', emoji: '⚙️', stock: 'Low Stock' },
          { name: 'K&N Performance Filter', sku: 'KN-33-3142', price: '$74', fits: 'Universal', emoji: '🌬️', stock: 'In Stock' },
        ].map(p => (
          <div key={p.name} style={{ background: '#242424', borderRadius: 8, padding: '10px 12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ width: 44, height: 44, background: '#333', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{p.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#fff', marginBottom: 2 }}>{p.name}</div>
                <div style={{ fontSize: 10, color: '#666' }}>SKU: {p.sku} · Fits: {p.fits}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: '#E63000' }}>{p.price}</span>
                  <span style={{ fontSize: 10, color: p.stock === 'In Stock' ? '#4EE880' : '#FF9500' }}>{p.stock}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ShopShowcase({ onClose }: ShowcaseProps) {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#111', position: 'relative' }}>
      <Nav onClose={onClose} />
      <div style={{ padding: '14px 16px 10px', background: '#1A1A1A', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ fontSize: 11, color: '#888', letterSpacing: 2, textTransform: 'uppercase' }}>E-Commerce</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginTop: 2 }}>Three ways to sell online</div>
      </div>
      <InnerCarousel slides={[<FashionStore />, <ElectronicsStore />, <CarPartsStore />]} />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// STARTUP
// ═══════════════════════════════════════════════════════════════════

// 1. Course / education
function CourseStartup() {
  return (
    <div style={{ height: '100%', background: '#0D1B2A', fontFamily: "'Helvetica Neue', sans-serif", display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      <div style={{ background: 'linear-gradient(135deg,#1B4F72,#117A65)', padding: '18px 16px' }}>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 6 }}>Learn · Build · Launch</div>
        <div style={{ fontWeight: 900, fontSize: 22, color: '#fff', letterSpacing: -0.5 }}>UpLevel Academy</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>Master skills that employers actually pay for</div>
        <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
          {[['12k+', 'Students'], ['94%', 'Job Rate'], ['4.9★', 'Rating']].map(([v, l]) => (
            <div key={l} style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 900, color: '#fff', fontSize: 15 }}>{v}</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: 1 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, padding: 14, display: 'flex', flexDirection: 'column', gap: 10, overflow: 'auto' }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: '#56CCF2', textTransform: 'uppercase' }}>Featured Courses</div>
        {[
          { title: 'AI Product Design', lessons: 32, level: 'Intermediate', price: '$149' },
          { title: 'No-Code SaaS Builder', lessons: 28, level: 'Beginner', price: '$99' },
          { title: 'Growth Marketing 2025', lessons: 40, level: 'Advanced', price: '$199' },
        ].map(c => (
          <div key={c.title} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: '10px 12px', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#fff', marginBottom: 3 }}>{c.title}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 11, color: '#888' }}>{c.lessons} lessons · {c.level}</div>
              <div style={{ fontWeight: 700, color: '#56CCF2', fontSize: 13 }}>{c.price}</div>
            </div>
            <div style={{ height: 3, background: 'rgba(255,255,255,0.1)', borderRadius: 2, marginTop: 8 }}>
              <div style={{ height: '100%', width: '65%', background: '#56CCF2', borderRadius: 2 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// 2. Ideas / innovation
function IdeasStartup() {
  return (
    <div style={{ height: '100%', background: '#FFFBF5', fontFamily: "'Helvetica Neue', sans-serif", display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      <div style={{ padding: '16px 16px 12px', background: '#fff', borderBottom: '1px solid #F0EBE0' }}>
        <div style={{ fontWeight: 900, fontSize: 20, letterSpacing: -0.5, color: '#1A1A1A' }}>spark<span style={{ color: '#FF6B00' }}>.</span></div>
        <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>Where great ideas find their wings</div>
      </div>
      <div style={{ background: 'linear-gradient(135deg,#FF6B00 0%,#FFB347 100%)', padding: '18px 16px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ fontSize: 32, marginBottom: 6 }}>💡</div>
        <div style={{ fontWeight: 900, fontSize: 18, color: '#fff', lineHeight: 1.2, marginBottom: 8 }}>Your idea could be the next big thing.</div>
        <button style={{ background: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: 12, fontWeight: 700, color: '#FF6B00', cursor: 'pointer' }}>Submit Your Idea →</button>
      </div>
      <div style={{ flex: 1, padding: 14, display: 'flex', flexDirection: 'column', gap: 10, overflow: 'auto' }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: '#FF6B00', textTransform: 'uppercase' }}>Trending Ideas</div>
        {[
          { tag: 'CleanTech', idea: 'Solar-powered water purifier for rural communities', votes: 234 },
          { tag: 'EdTech', idea: 'AI tutor that adapts to ADHD learning styles', votes: 189 },
          { tag: 'FinTech', idea: 'Micro-savings app for Gen Z freelancers', votes: 156 },
        ].map(i => (
          <div key={i.idea} style={{ background: '#fff', borderRadius: 8, padding: '10px 12px', border: '1px solid #F0EBE0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ background: '#FFF0E0', color: '#FF6B00', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>{i.tag}</span>
            </div>
            <div style={{ fontSize: 12, color: '#333', lineHeight: 1.5, marginBottom: 6 }}>{i.idea}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#888' }}>
              <span>▲</span> {i.votes} votes
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// 3. Basic startup / new company
function BasicStartup() {
  return (
    <div style={{ height: '100%', background: '#F8F8F8', fontFamily: "'Helvetica Neue', sans-serif", display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      <div style={{ background: '#fff', padding: '14px 16px', borderBottom: '1px solid #EAEAEA', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 900, fontSize: 18, color: '#111' }}>Novaris</span>
        <button style={{ background: '#111', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Early Access</button>
      </div>
      <div style={{ background: '#111', padding: '28px 18px', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.1)', borderRadius: 20, padding: '4px 14px', fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 12, letterSpacing: 2 }}>LAUNCHING SOON</div>
        <div style={{ fontWeight: 900, fontSize: 22, color: '#fff', lineHeight: 1.2, marginBottom: 10 }}>The smarter way to manage your team</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 16, lineHeight: 1.6 }}>All-in-one workspace for modern teams. Simple, fast, and actually enjoyable to use.</div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 6, padding: '8px 12px', flex: 1, border: '1px solid rgba(255,255,255,0.1)', fontSize: 12, color: 'rgba(255,255,255,0.4)', textAlign: 'left' }}>
            your@email.com
          </div>
          <button style={{ background: '#fff', border: 'none', borderRadius: 6, padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', color: '#111' }}>Join →</button>
        </div>
      </div>
      <div style={{ flex: 1, padding: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, overflow: 'auto', alignContent: 'start' }}>
        {[
          { icon: '⚡', title: 'Lightning Fast', desc: 'Built for speed from the ground up' },
          { icon: '🔒', title: 'Secure by Default', desc: 'SOC 2 certified, GDPR ready' },
          { icon: '🔗', title: '200+ Integrations', desc: 'Works with tools you already use' },
          { icon: '📊', title: 'Real Analytics', desc: 'Insights that actually matter' },
        ].map(f => (
          <div key={f.title} style={{ background: '#fff', borderRadius: 8, padding: '12px 10px', border: '1px solid #EAEAEA' }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{f.icon}</div>
            <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 3 }}>{f.title}</div>
            <div style={{ fontSize: 11, color: '#888', lineHeight: 1.4 }}>{f.desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function StartupShowcase({ onClose }: ShowcaseProps) {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#111', position: 'relative' }}>
      <Nav onClose={onClose} />
      <div style={{ padding: '14px 16px 10px', background: '#1A1A1A', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ fontSize: 11, color: '#888', letterSpacing: 2, textTransform: 'uppercase' }}>Startup</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginTop: 2 }}>Three ways to launch your vision</div>
      </div>
      <InnerCarousel slides={[<CourseStartup />, <IdeasStartup />, <BasicStartup />]} />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// FRISØR / SPA → Hair + Plumber + Hotel
// ═══════════════════════════════════════════════════════════════════

// 1. Hairdresser with booking
function HairSalon() {
  return (
    <div style={{ height: '100%', background: '#FBF9F7', fontFamily: "'Helvetica Neue', sans-serif", display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      <div style={{ background: '#1C1412', padding: '16px 16px 12px' }}>
        <div style={{ fontWeight: 900, fontSize: 20, color: '#F5E6C8', letterSpacing: 1 }}>ATELIER COIF</div>
        <div style={{ fontSize: 10, color: '#8A6A4A', letterSpacing: 3, textTransform: 'uppercase' }}>Hair Design Studio · Oslo</div>
      </div>
      <div style={{ flex: 1, padding: 14, display: 'flex', flexDirection: 'column', gap: 12, overflow: 'auto' }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: '#1C1412', textTransform: 'uppercase', marginBottom: 8 }}>Our Services</div>
          {[
            { name: 'Cut & Style', time: '60 min', price: '$85' },
            { name: 'Full Color', time: '120 min', price: '$145' },
            { name: 'Balayage', time: '150 min', price: '$195' },
            { name: 'Keratin Treatment', time: '90 min', price: '$225' },
          ].map(s => (
            <div key={s.name} style={{ display: 'flex', alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid rgba(0,0,0,0.06)', marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{s.name}</div>
                <div style={{ fontSize: 11, color: '#999' }}>⏱ {s.time}</div>
              </div>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#1C1412', marginRight: 10 }}>{s.price}</div>
              <button style={{ background: '#1C1412', color: '#F5E6C8', border: 'none', borderRadius: 5, padding: '5px 10px', fontSize: 11, cursor: 'pointer' }}>Book</button>
            </div>
          ))}
        </div>
        <div style={{ background: '#1C1412', borderRadius: 10, padding: '12px 14px', color: '#F5E6C8' }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>📅 Available This Week</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((d, i) => (
              <div key={d} style={{ flex: 1, background: i === 1 ? '#8A6A4A' : 'rgba(255,255,255,0.07)', borderRadius: 6, padding: '6px 4px', textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>{d}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: i === 1 ? '#fff' : 'rgba(255,255,255,0.7)' }}>{i === 1 ? '3' : i === 3 ? '7' : '0'}</div>
                <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)' }}>slots</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// 2. Plumber / tradesperson
function PlumberBusiness() {
  return (
    <div style={{ height: '100%', background: '#F0F4F8', fontFamily: "'Helvetica Neue', sans-serif", display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      <div style={{ background: '#1A3C5E', padding: '16px 16px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: '#F5A623', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🔧</div>
          <div>
            <div style={{ fontWeight: 900, fontSize: 18, color: '#fff' }}>NordFix Pro</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: 2, textTransform: 'uppercase' }}>Plumbing & Heating · Since 1998</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 6, padding: '6px 10px', flex: 1, textAlign: 'center' }}>
            <div style={{ color: '#F5A623', fontWeight: 900, fontSize: 14 }}>25yr</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9 }}>Experience</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 6, padding: '6px 10px', flex: 1, textAlign: 'center' }}>
            <div style={{ color: '#F5A623', fontWeight: 900, fontSize: 14 }}>4.9★</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9 }}>Google Rating</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 6, padding: '6px 10px', flex: 1, textAlign: 'center' }}>
            <div style={{ color: '#4EE880', fontWeight: 900, fontSize: 14 }}>NOW</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9 }}>Available</div>
          </div>
        </div>
      </div>
      <div style={{ flex: 1, padding: 14, display: 'flex', flexDirection: 'column', gap: 12, overflow: 'auto' }}>
        <div style={{ background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 8, padding: '10px 12px', display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 20 }}>⚡</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 12 }}>Emergency call-out available</div>
            <div style={{ fontSize: 11, color: '#666' }}>Response within 90 minutes</div>
          </div>
        </div>
        {[
          { icon: '🚿', service: 'Shower & Bath Installation', time: 'Same day available' },
          { icon: '🏠', service: 'Central Heating Service', time: 'Book 2 days ahead' },
          { icon: '💧', service: 'Leak Detection & Repair', time: 'Emergency: 90 min' },
          { icon: '🔑', service: 'Landlord Certificates', time: 'Certificate in 24h' },
        ].map(s => (
          <div key={s.service} style={{ background: '#fff', borderRadius: 8, padding: '10px 12px', display: 'flex', gap: 10, alignItems: 'center', border: '1px solid rgba(0,0,0,0.06)' }}>
            <span style={{ fontSize: 22 }}>{s.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 12 }}>{s.service}</div>
              <div style={{ fontSize: 11, color: '#888' }}>{s.time}</div>
            </div>
            <button style={{ background: '#1A3C5E', color: '#fff', border: 'none', borderRadius: 5, padding: '5px 10px', fontSize: 11, cursor: 'pointer' }}>Book</button>
          </div>
        ))}
      </div>
    </div>
  )
}

// 3. Hotel
function HotelSite() {
  return (
    <div style={{ height: '100%', background: '#0C1220', fontFamily: "'Georgia', serif", display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      <div style={{ background: 'linear-gradient(160deg,#1A2840 0%,#0C1220 100%)', padding: '18px 16px 14px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, width: 120, height: 120, background: 'radial-gradient(circle,rgba(212,175,55,0.15),transparent)', borderRadius: '50%' }} />
        <div style={{ fontSize: 10, letterSpacing: 5, color: '#D4AF37', textTransform: 'uppercase', marginBottom: 6 }}>Luxury Collection</div>
        <h1 style={{ fontSize: 24, fontWeight: 400, color: '#F5F0E8', margin: '0 0 4px', letterSpacing: 1 }}>Villa Solstice</h1>
        <div style={{ fontSize: 11, color: 'rgba(245,240,232,0.5)', marginBottom: 16 }}>Santorini, Greece · Cliff-top Retreat</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.07)', borderRadius: 6, padding: '8px 10px', border: '1px solid rgba(212,175,55,0.2)' }}>
            <div style={{ fontSize: 9, color: '#D4AF37', letterSpacing: 2, textTransform: 'uppercase' }}>Check-in</div>
            <div style={{ fontSize: 12, color: '#fff', marginTop: 2 }}>Jun 14, 2025</div>
          </div>
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.07)', borderRadius: 6, padding: '8px 10px', border: '1px solid rgba(212,175,55,0.2)' }}>
            <div style={{ fontSize: 9, color: '#D4AF37', letterSpacing: 2, textTransform: 'uppercase' }}>Check-out</div>
            <div style={{ fontSize: 12, color: '#fff', marginTop: 2 }}>Jun 19, 2025</div>
          </div>
        </div>
      </div>
      <div style={{ flex: 1, padding: 14, display: 'flex', flexDirection: 'column', gap: 10, overflow: 'auto' }}>
        <div style={{ fontSize: 10, letterSpacing: 4, color: '#D4AF37', textTransform: 'uppercase' }}>Available Rooms</div>
        {[
          { name: 'Caldera Suite', size: '65m²', view: 'Sea view', price: '€580', avail: true },
          { name: 'Cave Deluxe', size: '42m²', view: 'Pool view', price: '€380', avail: true },
          { name: 'Infinity Villa', size: '120m²', view: 'Panoramic', price: '€1,200', avail: false },
        ].map(r => (
          <div key={r.name} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '10px 12px', border: '1px solid rgba(212,175,55,0.12)', opacity: r.avail ? 1 : 0.5 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#F5F0E8' }}>{r.name}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{r.size} · {r.view}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, color: '#D4AF37', fontSize: 14 }}>{r.price}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>per night</div>
              </div>
            </div>
            {r.avail && (
              <button style={{ width: '100%', marginTop: 8, background: '#D4AF37', border: 'none', borderRadius: 5, padding: '7px 0', fontSize: 11, fontWeight: 700, color: '#0C1220', cursor: 'pointer' }}>
                Reserve Now
              </button>
            )}
            {!r.avail && <div style={{ fontSize: 11, color: '#E63000', marginTop: 6 }}>Not available for selected dates</div>}
          </div>
        ))}
      </div>
    </div>
  )
}

export function ServiceShowcase({ onClose }: ShowcaseProps) {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#111', position: 'relative' }}>
      <Nav onClose={onClose} />
      <div style={{ padding: '14px 16px 10px', background: '#1A1A1A', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ fontSize: 11, color: '#888', letterSpacing: 2, textTransform: 'uppercase' }}>Services & Hospitality</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginTop: 2 }}>Hair salon, tradesperson & hotel</div>
      </div>
      <InnerCarousel slides={[<HairSalon />, <PlumberBusiness />, <HotelSite />]} />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// BEDRIFT → Real estate + Boat brokerage + Insurance
// ═══════════════════════════════════════════════════════════════════

// 1. Real estate
function RealEstate() {
  return (
    <div style={{ height: '100%', background: '#F9F8F5', fontFamily: "'Helvetica Neue', sans-serif", display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      <div style={{ background: '#1C2B1A', padding: '16px 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: 18, color: '#E8D9B0', letterSpacing: 0.5 }}>MERIDIAN ESTATES</div>
          <div style={{ fontSize: 10, color: 'rgba(232,217,176,0.5)', letterSpacing: 3, textTransform: 'uppercase' }}>Premium Properties</div>
        </div>
        <div style={{ fontSize: 11, color: '#E8D9B0', opacity: 0.7 }}>📞 Contact</div>
      </div>
      <div style={{ flex: 1, padding: 14, display: 'flex', flexDirection: 'column', gap: 12, overflow: 'auto' }}>
        {[
          { title: 'Penthouse, Aker Brygge', beds: 4, baths: 3, m2: 210, price: '18,500,000 NOK', tag: 'PREMIUM' },
          { title: 'Family Home, Frogner', beds: 5, baths: 2, m2: 310, price: '12,900,000 NOK', tag: '' },
          { title: 'Studio, Grünerløkka', beds: 1, baths: 1, m2: 48, price: '4,200,000 NOK', tag: 'NEW' },
        ].map(p => (
          <div key={p.title} style={{ background: '#fff', borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ height: 90, background: 'linear-gradient(135deg,#1C2B1A,#3A5A34)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>
              🏛️
              {p.tag && <div style={{ position: 'absolute', top: 8, right: 8, background: p.tag === 'PREMIUM' ? '#E8D9B0' : '#1C2B1A', color: p.tag === 'PREMIUM' ? '#1C2B1A' : '#fff', fontSize: 9, fontWeight: 900, padding: '2px 7px', borderRadius: 3 }}>{p.tag}</div>}
            </div>
            <div style={{ padding: '10px 12px' }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#1A1A1A', marginBottom: 4 }}>{p.title}</div>
              <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#888', marginBottom: 6 }}>
                <span>🛏 {p.beds} bd</span>
                <span>🚿 {p.baths} ba</span>
                <span>📐 {p.m2}m²</span>
              </div>
              <div style={{ fontWeight: 900, fontSize: 14, color: '#1C2B1A' }}>{p.price}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// 2. Boat brokerage
function BoatBrokerage() {
  return (
    <div style={{ height: '100%', background: '#040D18', fontFamily: "'Helvetica Neue', sans-serif", display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      <div style={{ background: 'linear-gradient(135deg,#0A1628,#0D2137)', padding: '16px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontWeight: 900, fontSize: 18, color: '#fff', letterSpacing: 1 }}>⚓ NORDIC YACHTS</div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: 3, textTransform: 'uppercase' }}>Boat & Yacht Brokerage · Bergen</div>
      </div>
      <div style={{ background: 'linear-gradient(180deg,#0D2137,#040D18)', padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        {[['142', 'Vessels'], ['€2.4M', 'Avg Value'], ['30yr', 'Experience']].map(([v, l]) => (
          <div key={l} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontWeight: 900, color: '#4EA8DE', fontSize: 16 }}>{v}</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 1 }}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{ flex: 1, padding: 14, display: 'flex', flexDirection: 'column', gap: 10, overflow: 'auto' }}>
        {[
          { name: 'Sunseeker Predator 74', year: 2022, length: '22.5m', engine: '2× Volvo IPS 1350', price: '€3,850,000', type: 'Motor Yacht' },
          { name: 'Hallberg-Rassy 44', year: 2020, length: '13.7m', engine: 'Yanmar 4JH57', price: '€480,000', type: 'Sailing Yacht' },
          { name: 'Axopar 37 Sun-Top', year: 2023, length: '11.4m', engine: 'Mercury V8 300', price: '€149,000', type: 'Day Cruiser' },
        ].map(b => (
          <div key={b.name} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '10px 12px', border: '1px solid rgba(78,168,222,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ width: 48, height: 48, borderRadius: 6, background: 'linear-gradient(135deg,#0D2137,#1A4060)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>⛵</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ fontWeight: 700, fontSize: 12, color: '#fff' }}>{b.name}</div>
                  <div style={{ fontWeight: 700, color: '#4EA8DE', fontSize: 12 }}>{b.price}</div>
                </div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{b.type} · {b.length} · {b.year}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>{b.engine}</div>
              </div>
            </div>
          </div>
        ))}
        <button style={{ background: '#4EA8DE', border: 'none', borderRadius: 6, padding: '10px 0', fontSize: 12, fontWeight: 700, color: '#040D18', cursor: 'pointer' }}>
          View All 142 Listings →
        </button>
      </div>
    </div>
  )
}

// 3. Insurance
function InsuranceFirm() {
  return (
    <div style={{ height: '100%', background: '#F4F6FA', fontFamily: "'Helvetica Neue', sans-serif", display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      <div style={{ background: '#1B2A6B', padding: '16px 16px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🛡️</div>
          <div>
            <div style={{ fontWeight: 900, fontSize: 18, color: '#fff' }}>Nordguard</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: 2, textTransform: 'uppercase' }}>Insurance & Risk Management</div>
          </div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 6, padding: '8px 12px', marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>Get a quote in 2 minutes</div>
          <button style={{ background: '#fff', border: 'none', borderRadius: 5, padding: '5px 12px', fontSize: 11, fontWeight: 700, color: '#1B2A6B', cursor: 'pointer' }}>Start →</button>
        </div>
      </div>
      <div style={{ flex: 1, padding: 14, display: 'flex', flexDirection: 'column', gap: 10, overflow: 'auto' }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: '#1B2A6B', textTransform: 'uppercase' }}>Our Solutions</div>
        {[
          { icon: '🏠', title: 'Home & Property', desc: 'Comprehensive cover from NOK 299/mo', badge: 'Popular' },
          { icon: '🚗', title: 'Motor Insurance', desc: 'Full third-party & comprehensive', badge: '' },
          { icon: '💼', title: 'Business Liability', desc: 'Professional indemnity & public cover', badge: 'B2B' },
          { icon: '✈️', title: 'Travel & Expat', desc: 'Annual multi-trip from NOK 699', badge: '' },
        ].map(s => (
          <div key={s.title} style={{ background: '#fff', borderRadius: 8, padding: '10px 12px', display: 'flex', gap: 12, alignItems: 'center', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <span style={{ fontSize: 22 }}>{s.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontWeight: 700, fontSize: 13 }}>{s.title}</span>
                {s.badge && <span style={{ background: '#EEF2FF', color: '#1B2A6B', fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 3 }}>{s.badge}</span>}
              </div>
              <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{s.desc}</div>
            </div>
            <span style={{ color: '#1B2A6B', fontSize: 16 }}>›</span>
          </div>
        ))}
        <div style={{ background: '#EEF2FF', borderRadius: 8, padding: '10px 12px', textAlign: 'center', border: '1px solid rgba(27,42,107,0.1)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#1B2A6B' }}>Rated Excellent · 4.8/5</div>
          <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>Based on 6,200+ reviews · FCA Regulated</div>
        </div>
      </div>
    </div>
  )
}

export function BusinessShowcase({ onClose }: ShowcaseProps) {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#111', position: 'relative' }}>
      <Nav onClose={onClose} />
      <div style={{ padding: '14px 16px 10px', background: '#1A1A1A', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ fontSize: 11, color: '#888', letterSpacing: 2, textTransform: 'uppercase' }}>Business</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginTop: 2 }}>Real estate, boats & insurance</div>
      </div>
      <InnerCarousel slides={[<RealEstate />, <BoatBrokerage />, <InsuranceFirm />]} />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// MAIN EXPORT: updated websites array + modal system
// ═══════════════════════════════════════════════════════════════════

const showcaseMap: Record<string, React.FC<ShowcaseProps>> = {
  Restaurant: RestaurantShowcase,
  Portfolio: PortfolioShowcase,
  Nettbutikk: ShopShowcase,
  Startup: StartupShowcase,
  'Frisør / Spa': ServiceShowcase,
  Bedrift: BusinessShowcase,
}

export const websites = [
  { label: 'Restaurant', color: '#E85D26', accent: '#FFF4EE', lines: ['Smakenes Hus', 'Moderne norsk mat', '★★★★★'], img: '🍽️' },
  { label: 'Portfolio', color: '#1A6BFF', accent: '#EEF4FF', lines: ['Ola Nordmann', 'Designer & Utvikler', 'Se arbeid →'], img: '🎨' },
  { label: 'Nettbutikk', color: '#0C9E6A', accent: '#EEFAF4', lines: ['NordicShop', 'Fri frakt over 499kr', 'Handl nå →'], img: '🛍️' },
  { label: 'Startup', color: '#7C3AED', accent: '#F5F0FF', lines: ['LaunchFast', 'Fra idé til produkt', 'Book demo →'], img: '🚀' },
  { label: 'Frisør / Spa', color: '#D4449A', accent: '#FDF0F8', lines: ['Studio Ella', 'Book din time', 'Bestill nå →'], img: '✂️' },
  { label: 'Bedrift', color: '#1E3A5F', accent: '#EFF3F8', lines: ['Nordvest AS', 'Pålitelig siden 1998', 'Kontakt oss →'], img: '🏢' },
]

export function WebsiteShowcaseModal({ label, onClose }: { label: string; onClose: () => void }) {
  const Showcase = showcaseMap[label]
  if (!Showcase) return null
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999,
      background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(4px)',
    }} onClick={onClose}>
      <div
        style={{ width: '100%', maxWidth: 680, height: '85vh', maxHeight: 680, borderRadius: 16, overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.6)', position: 'relative' }}
        onClick={e => e.stopPropagation()}
      >
        <Showcase onClose={onClose} />
      </div>
    </div>
  )
  
}

// Usage: in your carousel, wrap MiniSiteMockup in an onClick that sets selectedLabel state,
// then render: selectedLabel && <WebsiteShowcaseModal label={selectedLabel} onClose={() => setSelectedLabel(null)} />