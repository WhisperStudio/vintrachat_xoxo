export type LauncherBorder = 'none' | 'solid' | 'dashed' | 'double' | 'wavy' | 'rounded' | 'shadow'
export type LauncherShape = 'circle' | 'rounded-square' | 'square' | 'triangle' | 'diamond'

// Self-contained so the exported script and React preview use identical artwork.
export function createLauncherArtwork(border: string = 'none', shape?: string): string {
  const form = ['circle', 'rounded-square', 'square', 'triangle', 'diamond'].includes(shape || '') ? shape : border === 'solid' ? 'rounded-square' : 'circle'
  const edge = border === 'rounded' ? 'solid' : border === 'shadow' ? 'none' : border
  const vertices = form === 'triangle' ? [[50, 5], [96, 92], [4, 92]] : form === 'diamond' ? [[50, 4], [96, 50], [50, 96], [4, 50]] : [[6, 6], [94, 6], [94, 94], [6, 94]]
  const points: string[] = []
  for (let i = 0; i < 240; i++) {
    const t = i / 240
    let x: number, y: number
    if (form === 'circle' || form === 'rounded-square') {
      const angle = t * Math.PI * 2
      const power = form === 'circle' ? 1 : .5
      x = 50 + 44 * Math.sign(Math.cos(angle)) * Math.abs(Math.cos(angle)) ** power
      y = 50 + 44 * Math.sign(Math.sin(angle)) * Math.abs(Math.sin(angle)) ** power
    } else {
      const part = t * vertices.length, index = Math.floor(part), fraction = part - index
      const a = vertices[index], b = vertices[(index + 1) % vertices.length]
      x = a[0] + (b[0] - a[0]) * fraction
      y = a[1] + (b[1] - a[1]) * fraction
    }
    if (edge === 'wavy') { const wave = 1 + .035 * Math.sin(t * Math.PI * 32); x = 50 + (x - 50) * wave; y = 50 + (y - 50) * wave }
    points.push((i ? 'L' : 'M') + x.toFixed(2) + ',' + y.toFixed(2))
  }
  const path = points.join(' ') + 'Z'
  const stroke = edge === 'none' ? 'none' : 'var(--chat-border)'
  const dash = edge === 'dashed' ? ' stroke-dasharray="7 5"' : ''
  return '<svg class="launcher-artwork" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><path d="' + path + '" fill="var(--chat-primary)" stroke="' + stroke + '" stroke-width="3"' + dash + '/>' + (edge === 'double' ? '<path d="' + path + '" transform="translate(7 7) scale(.86)" fill="none" stroke="' + stroke + '" stroke-width="2"/>' : '') + '</svg>'
}
