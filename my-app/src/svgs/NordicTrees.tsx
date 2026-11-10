const tiers = [18, 34, 51, 70, 90, 112]

export function SpruceTree({ x = 0, y = 0, scale = 1 }: { x?: number; y?: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path d="M-3 98 0 0 4 98 4 142H-3Z" fill="#365463" />
      {tiers.map((height, index) => {
        const width = 8 + index * 5
        return <g key={height}>
          <path d={`M-3 ${height - 22} Q0 ${height - 29} 3 ${height - 22} C${width * .4} ${height - 7} ${width * .78} ${height - 1} ${width} ${height + 4} Q${width + 7} ${height + 12} ${width - 2} ${height + 13} Q${width * .48} ${height + 15} 0 ${height + 9} Q${-width * .48} ${height + 15} ${-width + 2} ${height + 13} Q${-width - 7} ${height + 12} ${-width} ${height + 4} C${-width * .78} ${height - 1} ${-width * .4} ${height - 7} -3 ${height - 22}Z`} fill="var(--spruce-green, #245164)" />
          <path d={`M0 ${height - 25} Q2 ${height - 25} 3 ${height - 22} C${width * .4} ${height - 7} ${width * .78} ${height - 1} ${width} ${height + 4} Q${width + 7} ${height + 12} ${width - 2} ${height + 13} Q${width * .48} ${height + 15} 0 ${height + 9}Z`} fill="#082d40" opacity=".32" />
          <path className="spruceSnow" d={`M-3 ${height - 22} Q0 ${height - 29} 3 ${height - 22} C${width * .4} ${height - 7} ${width * .78} ${height - 1} ${width} ${height + 4} Q${width + 3} ${height + 8} ${width - 3} ${height + 7} C${width * .55} ${height + 7} ${width * .35} ${height - 1} 0 ${height - 3} C${-width * .35} ${height - 1} ${-width * .55} ${height + 7} ${-width + 3} ${height + 7} Q${-width - 3} ${height + 8} ${-width} ${height + 4} C${-width * .78} ${height - 1} ${-width * .4} ${height - 7} -3 ${height - 22}Z`} fill="#e6f6fb" />
        </g>
      })}
    </g>
  )
}

export default function NordicTrees({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 400 180" aria-hidden="true">
    <g opacity=".55"><SpruceTree x={45} y={56} scale={.75} /><SpruceTree x={340} y={60} scale={.7} /></g>
    <SpruceTree x={110} y={34} scale={1} /><SpruceTree x={285} y={28} scale={1.05} />
    <SpruceTree x={203} y={12} scale={1.22} />
  </svg>
}
