'use client'

import { useMemo, useState } from 'react'
import { CarouselShell, ImagePlaceholder, type ShowcaseProps, type SlideSpec } from './website-showcases.shared'

type Product = {
  id: string
  name: string
  price: number
  note: string
}

type CartItem = Product & { qty: number }

function shell(slides: SlideSpec[], onClose?: () => void) {
  return (
    <CarouselShell
      title="E-commerce"
      subtitle="Three storefront homepage styles"
      slides={slides}
      navItems={['Shop', 'Cart', 'Deals']}
      footerNote="Cart, product cards, and checkout previews"
      onClose={onClose}
    />
  )
}

const fashionProducts: Product[] = [
  { id: 'coat', name: 'Cashmere Coat', price: 349, note: 'Premium winter layer' },
  { id: 'knit', name: 'Merino Turtleneck', price: 129, note: 'Soft everyday knit' },
  { id: 'trouser', name: 'Wide Leg Trouser', price: 189, note: 'Tailored fit' },
  { id: 'blazer', name: 'Linen Blazer', price: 249, note: 'Lightweight blazer' },
]

const techProducts: Product[] = [
  { id: 'headphones', name: 'AirPod Max Pro', price: 549, note: 'ANC and spatial audio' },
  { id: 'watch', name: 'UltraWatch S9', price: 399, note: '7 day battery' },
  { id: 'tablet', name: 'TabX Pro 12"', price: 849, note: 'Creator tablet' },
]

function CartSummary({
  items,
  onRemove,
}: {
  items: CartItem[]
  onRemove: (id: string) => void
}) {
  const total = items.reduce((sum, item) => sum + item.price * item.qty, 0)

  return (
    <aside style={{ background: '#111', borderRadius: 18, padding: 14, color: '#fff', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: '#9A9A9A' }}>Cart</div>
          <div style={{ fontSize: 18, fontWeight: 800, marginTop: 4 }}>{items.length} items</div>
        </div>
        <div style={{ fontSize: 20 }}>🛒</div>
      </div>

      <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
        {items.length === 0 ? (
          <div style={{ color: '#9A9A9A', fontSize: 13, lineHeight: 1.6 }}>Add a product to see it appear here.</div>
        ) : (
          items.map((item) => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 10 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{item.name}</div>
                <div style={{ color: '#9A9A9A', fontSize: 12 }}>{item.qty} x {item.price} kr</div>
              </div>
              <button
                onClick={() => onRemove(item.id)}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.16)',
                  color: '#fff',
                  borderRadius: 999,
                  padding: '6px 10px',
                  cursor: 'pointer',
                  fontSize: 12,
                }}
              >
                Remove
              </button>
            </div>
          ))
        )}
      </div>

      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#9A9A9A', fontSize: 12 }}>Total</span>
        <strong style={{ fontSize: 18 }}>{total} kr</strong>
      </div>
    </aside>
  )
}

function FashionPage({
  cart,
  addToCart,
  removeFromCart,
}: {
  cart: CartItem[]
  addToCart: (product: Product) => void
  removeFromCart: (id: string) => void
}) {
  return (
    <div style={{ height: '100%', overflow: 'auto', background: '#FBF4ED', color: '#181212', padding: 18, fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', gap: 16 }}>
        <div style={{ background: '#FFF9F3', borderRadius: 20, padding: 16, border: '1px solid rgba(199,109,34,0.14)' }}>
          <div style={{ fontSize: 11, letterSpacing: 4, textTransform: 'uppercase', color: '#C76D22', fontWeight: 700 }}>Fashion store</div>
          <h2 style={{ margin: '10px 0 8px', fontSize: 32, lineHeight: 1.05, fontWeight: 900 }}>MODE Atelier</h2>
          <p style={{ margin: 0, color: '#76665B', fontSize: 14, lineHeight: 1.7 }}>A soft premium homepage for a curated fashion label.</p>
          <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button style={{ background: '#C76D22', color: '#fff', border: 'none', borderRadius: 999, padding: '11px 16px', fontWeight: 800 }}>Shop new arrivals</button>
            <button style={{ background: '#fff', color: '#181212', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 999, padding: '11px 16px', fontWeight: 800 }}>Lookbook</button>
          </div>
          <div style={{ marginTop: 16 }}>
            <ImagePlaceholder title="Hero fashion image" subtitle="Replace with a model / campaign photo" height={210} />
          </div>
        </div>
        <CartSummary items={cart} onRemove={removeFromCart} />
      </div>

      <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 0.85fr', gap: 16 }}>
        <div style={{ background: '#fff', borderRadius: 18, padding: 12, border: '1px solid rgba(199,109,34,0.12)' }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 3, color: '#C76D22', fontWeight: 700 }}>New in</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, marginTop: 10 }}>
            {fashionProducts.map((product) => (
              <div key={product.id} style={{ background: '#FBF4ED', borderRadius: 16, padding: 10 }}>
                <ImagePlaceholder title="Product photo" subtitle="Swap in product image" height={96} />
                <div style={{ marginTop: 8, fontWeight: 800 }}>{product.name}</div>
                <div style={{ color: '#76665B', fontSize: 12, marginTop: 4 }}>{product.note}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                  <strong>{product.price} kr</strong>
                  <button onClick={() => addToCart(product)} style={{ background: '#181212', color: '#fff', border: 'none', borderRadius: 999, padding: '8px 10px', fontSize: 12, cursor: 'pointer' }}>
                    Add to cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: '#2B1A12', borderRadius: 18, padding: 14, color: '#FFF9F3' }}>
          <div style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: '#D6A36A' }}>Campaign image</div>
          <div style={{ marginTop: 10 }}>
            <ImagePlaceholder title="Editorial banner" subtitle="Replace with campaign art" height={140} />
          </div>
          <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
            {cart.length === 0 ? (
              <div style={{ color: 'rgba(255,249,243,0.72)', fontSize: 13, lineHeight: 1.6 }}>Your cart is empty. Add one of the products from the left side.</div>
            ) : (
              cart.map((item) => (
                <div key={item.id} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: 10, display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{item.name}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,249,243,0.72)' }}>{item.qty} in cart</div>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 999, padding: '6px 10px', cursor: 'pointer', fontSize: 12 }}>
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function TechPage({
  cart,
  onAdd,
  onRemove,
}: {
  cart: CartItem[]
  onAdd: (product: Product) => void
  onRemove: (id: string) => void
}) {
  return (
    <div style={{ height: '100%', overflow: 'auto', background: '#0D1524', color: '#F6FAFF', padding: 18, fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
      <div style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: 16 }}>
        <div style={{ background: '#12203A', borderRadius: 20, padding: 16, border: '1px solid rgba(86,204,242,0.12)' }}>
          <div style={{ fontSize: 11, letterSpacing: 4, textTransform: 'uppercase', color: '#56CCF2' }}>Tech store</div>
          <h2 style={{ margin: '10px 0 8px', fontSize: 32, lineHeight: 1.05 }}>Volt Electronics</h2>
          <p style={{ margin: 0, color: '#B7C7D9', fontSize: 14, lineHeight: 1.7 }}>Sharp homepage for gadgets, product specs, and fast purchase paths.</p>
          <div style={{ marginTop: 16 }}>
            <ImagePlaceholder title="Featured product" subtitle="Use laptop / phone product image" height={200} />
          </div>
        </div>
        <div style={{ background: '#111B2B', borderRadius: 18, padding: 14, border: '1px solid rgba(86,204,242,0.12)' }}>
          <CartSummary items={cart} onRemove={onRemove} />
        </div>
      </div>

      <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
        {techProducts.map((product, index) => (
          <div key={product.id} style={{ background: index === 0 ? '#161F34' : '#111B2B', borderRadius: 18, padding: 14, border: '1px solid rgba(86,204,242,0.12)' }}>
            <ImagePlaceholder title="Photo" subtitle="Swap in product shot" height={120} />
            <div style={{ marginTop: 10, fontWeight: 800 }}>{product.name}</div>
            <div style={{ color: '#8EA3BA', fontSize: 12, marginTop: 4 }}>{product.note}</div>
            <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>{product.price} kr</strong>
              <button onClick={() => onAdd(product)} style={{ background: '#56CCF2', color: '#0D1524', border: 'none', borderRadius: 999, padding: '8px 10px', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
                Add
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function OutdoorPage({
  cart,
  onAdd,
  onRemove,
}: {
  cart: CartItem[]
  onAdd: (product: Product) => void
  onRemove: (id: string) => void
}) {
  return (
    <div style={{ height: '100%', overflow: 'auto', background: '#20251E', color: '#F7F3EA', padding: 18, fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ background: '#2A3226', borderRadius: 20, padding: 16, border: '1px solid rgba(59,110,53,0.16)' }}>
          <div style={{ fontSize: 11, letterSpacing: 4, textTransform: 'uppercase', color: '#96C08A' }}>Outdoor store</div>
          <h2 style={{ margin: '10px 0 8px', fontSize: 32, lineHeight: 1.05 }}>Trail House</h2>
          <p style={{ margin: 0, color: '#C7D0C0', fontSize: 14, lineHeight: 1.7 }}>A rugged homepage for adventure gear and seasonal bundles.</p>
          <div style={{ marginTop: 16 }}>
            <ImagePlaceholder title="Adventure hero" subtitle="Replace with camping / hiking image" height={200} />
          </div>
        </div>
        <div style={{ display: 'grid', gap: 10 }}>
          {[
            { id: 'camp', name: 'Camping kits', note: 'All-in-one weekend setup', price: 1299 },
            { id: 'travel', name: 'Travel bags', note: 'Carry-on friendly gear', price: 899 },
            { id: 'sale', name: 'Winter sale', note: 'Seasonal discount selection', price: 499 },
          ].map((product) => (
            <div key={product.id} style={{ background: '#262C24', borderRadius: 18, padding: 14, border: '1px solid rgba(59,110,53,0.14)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 800 }}>{product.name}</div>
                  <div style={{ fontSize: 12, color: '#A6B2A2', marginTop: 4 }}>{product.note}</div>
                </div>
                <div style={{ width: 74 }}>
                  <ImagePlaceholder title="Item" subtitle="Placeholder" height={62} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                <strong>{product.price} kr</strong>
                <button onClick={() => onAdd(product)} style={{ background: '#96C08A', color: '#111711', border: 'none', borderRadius: 999, padding: '7px 10px', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
                  Add
                </button>
              </div>
            </div>
          ))}
          <div style={{ background: '#111711', borderRadius: 18, padding: 14, border: '1px solid rgba(59,110,53,0.16)' }}>
            <div style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: '#96C08A' }}>Weekend bundle</div>
            <div style={{ marginTop: 10 }}>
              <ImagePlaceholder title="Bundle image" subtitle="Swap in a lifestyle shot" height={130} />
            </div>
          </div>
          <div style={{ background: '#262C24', borderRadius: 18, padding: 14, border: '1px solid rgba(59,110,53,0.14)' }}>
            <div style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: '#96C08A' }}>Cart summary</div>
            <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
              {cart.length === 0 ? (
                <div style={{ color: '#A6B2A2', fontSize: 13 }}>Nothing in cart yet.</div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 10 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{item.name}</div>
                      <div style={{ color: '#A6B2A2', fontSize: 11 }}>{item.qty} in cart</div>
                    </div>
                    <button onClick={() => onRemove(item.id)} style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 999, padding: '6px 10px', cursor: 'pointer', fontSize: 12 }}>
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ShopShowcase({ onClose }: ShowcaseProps) {
  const [cart, setCart] = useState<CartItem[]>([])

  const addToCart = (product: Product) => {
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id)
      if (existing) {
        return current.map((item) => (item.id === product.id ? { ...item, qty: item.qty + 1 } : item))
      }
      return [...current, { ...product, qty: 1 }]
    })
  }

  const removeFromCart = (id: string) => {
    setCart((current) => current.flatMap((item) => {
      if (item.id !== id) return [item]
      if (item.qty > 1) return [{ ...item, qty: item.qty - 1 }]
      return []
    }))
  }

  const slides = useMemo<SlideSpec[]>(
    () => [
      { label: 'Fashion', node: <FashionPage cart={cart} addToCart={addToCart} removeFromCart={removeFromCart} /> },
      { label: 'Tech', node: <TechPage cart={cart} onAdd={addToCart} onRemove={removeFromCart} /> },
      { label: 'Outdoor', node: <OutdoorPage cart={cart} onAdd={addToCart} onRemove={removeFromCart} /> },
    ],
    [cart]
  )

  return shell(slides, onClose)
}
