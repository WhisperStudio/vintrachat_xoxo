import React from "react";

const Layer = ({ y, active }: { y: number; active?: boolean }) => (
  <rect
    x={40}
    y={y}
    width={200}
    height={50}
    rx={12}
    fill={active ? "#e0f2fe" : "#f8fafc"}
    stroke={active ? "#0284c7" : "#cbd5f5"}
    strokeWidth={active ? 3 : 1.5}
  />
);

// Using raw SVG arrow instead of react-icons (fixes scaling issue)
const ArrowIcon = ({ y }: { y: number }) => (
  <g transform={`translate(260, ${y - 20}) scale(1.8)`}>
    <path
      d="M20 10 H0 M0 10 L8 2 M0 10 L8 18"
      stroke="#111827"
      strokeWidth={2}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </g>
);

export const TopActiveSVG = () => (
  <svg width={40} height={40} viewBox="0 0 360 260" fill="none">
    <Layer y={40} active />
    <Layer y={110} />
    <Layer y={180} />
    <ArrowIcon y={65} />
  </svg>
);

export const MiddleActiveSVG = () => (
  <svg width={40} height={40} viewBox="0 0 360 260" fill="none">
    <Layer y={40} />
    <Layer y={110} active />
    <Layer y={180} />
    <ArrowIcon y={135} />
  </svg>
);

export const BottomActiveSVG = () => (
  <svg width={40} height={40} viewBox="0 0 360 260" fill="none">
    <Layer y={40} />
    <Layer y={110} />
    <Layer y={180} active />
    <ArrowIcon y={205} />
  </svg>
);

export const FooterActiveSVG = () => (
  <svg width={40} height={40} viewBox="0 0 360 260" fill="none">
    <Layer y={40} />
    <Layer y={110} />
    <Layer y={180} />
    <ArrowIcon y={205} />
  </svg>
);

export default TopActiveSVG;
