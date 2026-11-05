export type SurfaceBorder = 'none' | 'solid' | 'dashed' | 'double' | 'wavy'
export function getSurfaceClasses(style: { borderType?: string; borderLine?: SurfaceBorder; showBorder?: boolean; cornerStyle?: string }, fallbackCorner = 'square') {
  const border = style.borderLine || (style.showBorder === false ? 'none' : style.showBorder === true || style.borderType === 'solid' || style.borderType === 'rounded' ? 'solid' : 'none')
  const corner = style.cornerStyle || (style.borderType === 'rounded' ? 'rounded' : fallbackCorner)
  return 'surface-edge-' + border + ' surface-shape-' + corner
}

export function getMessageSurfaceClasses(style: { messageCornerStyle?: string; messageBorderLine?: SurfaceBorder }) {
  // Missing settings preserve the saved bubble/flat/card message style.
  return (style.messageBorderLine ? 'surface-edge-' + style.messageBorderLine : '') + (style.messageCornerStyle ? ' surface-shape-' + style.messageCornerStyle : '')
}
