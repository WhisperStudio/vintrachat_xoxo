import { ImageResponse } from 'next/og'

export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: 'linear-gradient(135deg, #081226 0%, #1244ad 45%, #6d28d9 100%)',
          color: '#fff',
          padding: '56px',
          fontFamily: 'Arial',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -120,
            right: -60,
            width: 420,
            height: 420,
            borderRadius: 999,
            background: 'rgba(255,255,255,0.08)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -140,
            left: -90,
            width: 360,
            height: 360,
            borderRadius: 999,
            background: 'rgba(255,255,255,0.07)',
            display: 'flex',
          }}
        />
        <div
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            gap: 40,
            zIndex: 1,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', width: 700 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                marginBottom: 28,
              }}
            >
              <div
                style={{
                  width: 78,
                  height: 78,
                  borderRadius: 22,
                  background: 'linear-gradient(135deg, #1A6BFF, #7C3AED)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 40,
                  fontWeight: 900,
                  boxShadow: '0 20px 60px rgba(0,0,0,0.24)',
                }}
              >
                V
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: 42, fontWeight: 800 }}>Vintra</div>
                <div style={{ fontSize: 20, color: 'rgba(255,255,255,0.78)' }}>Official site</div>
              </div>
            </div>

            <div style={{ fontSize: 68, fontWeight: 900, lineHeight: 1.02, letterSpacing: -2, display: 'flex', flexDirection: 'column' }}>
              <span>Business websites</span>
              <span>and AI chatbots</span>
            </div>

            <div style={{ fontSize: 26, lineHeight: 1.45, color: 'rgba(255,255,255,0.82)', marginTop: 22, maxWidth: 640 }}>
              Pricing, support, phone and email in one place at chat.vintrastudio.com
            </div>

            <div style={{ display: 'flex', gap: 16, marginTop: 36 }}>
              {['Websites', 'Chatbots', 'Support'].map((item) => (
                <div
                  key={item}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 18px',
                    borderRadius: 999,
                    background: 'rgba(255,255,255,0.12)',
                    border: '1px solid rgba(255,255,255,0.18)',
                    fontSize: 22,
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              width: 300,
              display: 'flex',
              flexDirection: 'column',
              gap: 18,
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.16)',
                borderRadius: 28,
                padding: '28px 26px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
              }}
            >
              <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.72)' }}>Phone</div>
              <div style={{ fontSize: 30, fontWeight: 800 }}>+47 41 76 12 52</div>
            </div>
            <div
              style={{
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.16)',
                borderRadius: 28,
                padding: '28px 26px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
              }}
            >
              <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.72)' }}>Email</div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>vintrastudio@gmail.com</div>
            </div>
          </div>
        </div>
      </div>
    ),
    size
  )
}
