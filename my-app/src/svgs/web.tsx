import React from "react";

/**
 * Animated browser-like SVG mockup inspired by the reference image,
 * but with more detail and a built-in interaction loop:
 * 1) Cursor starts near the lower area
 * 2) Cursor moves to one of the gray content cards
 * 3) Cursor clicks the card
 * 4) Analytics panel slides in
 * 5) Cursor moves to the close button
 * 6) Cursor clicks and panel closes
 * 7) Cursor returns to the original position
 */

type AnimatedBrowserMockupProps = {
  className?: string;
  width?: number | string;
  height?: number | string;
};

export default function AnimatedBrowserMockup({
  className,
  width = "100%",
  height = "100%",
}: AnimatedBrowserMockupProps) {
  return (
    <div className={className}>
      <svg
        viewBox="0 0 860 640"
        width={width}
        height={height}
        role="img"
        aria-label="Animated browser dashboard illustration"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f7f9fc" />
            <stop offset="100%" stopColor="#eef2f7" />
          </linearGradient>

          <linearGradient id="hero" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f7ddb9" />
            <stop offset="100%" stopColor="#f2c7a7" />
          </linearGradient>

          <linearGradient id="mountain1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#eab097" />
            <stop offset="100%" stopColor="#da8f78" />
          </linearGradient>

          <linearGradient id="mountain2" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e29d87" />
            <stop offset="100%" stopColor="#cc7c68" />
          </linearGradient>

          <linearGradient id="analyticsPanel" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f6f9fd" />
          </linearGradient>

          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow
              dx="0"
              dy="12"
              stdDeviation="12"
              floodColor="#25314d"
              floodOpacity="0.16"
            />
          </filter>

          <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow
              dx="0"
              dy="6"
              stdDeviation="8"
              floodColor="#25314d"
              floodOpacity="0.1"
            />
          </filter>

          <clipPath id="windowClip">
            <rect x="52" y="48" width="756" height="544" rx="26" ry="26" />
          </clipPath>

          <style>{`
            .cursor {
              animation: cursorJourney 10s linear infinite;
            }

            .analytics-panel {
              animation: analyticsPanel 10s ease-in-out infinite;
            }

            .main-content {
              animation: dimMain 10s ease-in-out infinite;
            }

            .mini-bars rect:nth-child(1) {
              animation: barA 2.4s ease-in-out infinite;
              transform-box: fill-box;
              transform-origin: bottom center;
            }

            .mini-bars rect:nth-child(2) {
              animation: barB 2.4s ease-in-out infinite 0.12s;
              transform-box: fill-box;
              transform-origin: bottom center;
            }

            .mini-bars rect:nth-child(3) {
              animation: barC 2.4s ease-in-out infinite 0.24s;
              transform-box: fill-box;
              transform-origin: bottom center;
            }

            .mini-bars rect:nth-child(4) {
              animation: barD 2.4s ease-in-out infinite 0.36s;
              transform-box: fill-box;
              transform-origin: bottom center;
            }

            .mini-bars rect:nth-child(5) {
              animation: barE 2.4s ease-in-out infinite 0.48s;
              transform-box: fill-box;
              transform-origin: bottom center;
            }

            .line-grow {
              stroke-dasharray: 260;
              stroke-dashoffset: 260;
              animation: lineGrow 10s ease-in-out infinite;
            }

            .badge-blink {
              animation: badgeBlink 10s ease-in-out infinite;
            }

            .floating-chip {
              animation: floatingChip 4.2s ease-in-out infinite;
            }

            .tiny-dot-1 {
              animation: tinyDot1 5s ease-in-out infinite;
            }

            .tiny-dot-2 {
              animation: tinyDot2 6.2s ease-in-out infinite;
            }

            .open-card {
              animation: openCardClick 10s ease-in-out infinite;
              transform-origin: 278px 533px;
              transform-box: fill-box;
            }

            .close-btn {
              animation: closeBtnClick 10s ease-in-out infinite;
              transform-origin: 718px 186px;
              transform-box: fill-box;
            }

            .close-icon {
              animation: closeIconClick 10s ease-in-out infinite;
              transform-origin: 718px 186px;
              transform-box: fill-box;
            }

            .sun {
              animation: sunOval 10s ease-in-out infinite;
              transform-origin: 438px 296px;
            }

            @keyframes dimMain {
              0%, 33%, 100% { opacity: 1; }
              38%, 64% { opacity: 0.42; }
              69%, 100% { opacity: 1; }
            }

            @keyframes analyticsPanel {
              0%, 33%, 100% {
                opacity: 0;
                transform: translate(42px, 0px);
              }
              38%, 64% {
                opacity: 1;
                transform: translate(0px, 0px);
              }
              69%, 100% {
                opacity: 0;
                transform: translate(42px, 0px);
              }
            }

            @keyframes cursorJourney {
              0%, 14% {
                transform: translate(520px, 510px) scale(1);
              }
              28%, 30% {
                transform: translate(280px, 520px) scale(1);
              }
              31% {
                transform: translate(280px, 520px) scale(0.92);
              }
              33%, 44% {
                transform: translate(280px, 520px) scale(1);
              }
              58%, 64% {
                transform: translate(718px, 186px) scale(1);
              }
              66% {
                transform: translate(718px, 186px) scale(0.92);
              }
              68%, 84% {
                transform: translate(718px, 186px) scale(1);
              }
              100% {
                transform: translate(520px, 510px) scale(1);
              }
            }

            @keyframes openCardClick {
              0%, 30%, 100% {
                transform: translateY(0px) scale(1);
                opacity: 1;
              }
              31% {
                transform: translateY(3px) scale(0.95);
                opacity: 0.92;
              }
              33% {
                transform: translateY(-2px) scale(1.03);
                opacity: 1;
              }
              36% {
                transform: translateY(0px) scale(1);
                opacity: 1;
              }
            }

            @keyframes closeBtnClick {
              0%, 65%, 100% {
                transform: scale(1);
                opacity: 1;
              }
              66% {
                transform: scale(0.86);
                opacity: 0.92;
              }
              68% {
                transform: scale(1.08);
                opacity: 1;
              }
              71% {
                transform: scale(1);
                opacity: 1;
              }
            }

            @keyframes closeIconClick {
              0%, 65%, 100% {
                transform: scale(1) rotate(0deg);
                opacity: 1;
              }
              66% {
                transform: scale(0.85) rotate(-8deg);
                opacity: 0.8;
              }
              68% {
                transform: scale(1.12) rotate(6deg);
                opacity: 1;
              }
              71% {
                transform: scale(1) rotate(0deg);
                opacity: 1;
              }
            }

            @keyframes barA {
              0%, 100% { transform: scaleY(0.6); }
              50% { transform: scaleY(1); }
            }

            @keyframes barB {
              0%, 100% { transform: scaleY(0.85); }
              50% { transform: scaleY(0.5); }
            }

            @keyframes barC {
              0%, 100% { transform: scaleY(0.45); }
              50% { transform: scaleY(1); }
            }

            @keyframes barD {
              0%, 100% { transform: scaleY(1); }
              50% { transform: scaleY(0.62); }
            }

            @keyframes barE {
              0%, 100% { transform: scaleY(0.7); }
              50% { transform: scaleY(1.05); }
            }

            @keyframes lineGrow {
              0%, 40% {
                stroke-dashoffset: 260;
                opacity: 0;
              }
              46%, 74% {
                stroke-dashoffset: 0;
                opacity: 1;
              }
              82%, 100% {
                stroke-dashoffset: 260;
                opacity: 0;
              }
            }

            @keyframes badgeBlink {
              0%, 40%, 100% { opacity: 0; }
              46%, 74% { opacity: 1; }
              78%, 82% { opacity: 0.55; }
            }

            @keyframes floatingChip {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-5px); }
            }

            @keyframes tinyDot1 {
              0%, 100% {
                transform: translateY(0px);
                opacity: 0.8;
              }
              50% {
                transform: translateY(-6px);
                opacity: 1;
              }
            }

            @keyframes tinyDot2 {
              0%, 100% {
                transform: translateY(0px);
                opacity: 0.7;
              }
              50% {
                transform: translateY(5px);
                opacity: 1;
              }
            }

            @keyframes sunOval {
              0%, 100% {
                transform: translate(0px, 0px) scale(1);
                opacity: 0.9;
              }
              25% {
                transform: translate(20px, 26px) scale(0.97);
                opacity: 0.45;
              }
              50% {
                transform: translate(0px, -18px) scale(1.03);
                opacity: 1;
              }
              75% {
                transform: translate(-20px, 26px) scale(0.97);
                opacity: 0.45;
              }
            }
          `}</style>
        </defs>

        <rect width="860" height="640" fill="transparent" />

        {/* Browser shell */}
        <g filter="url(#shadow)">
          <rect x="52" y="48" width="756" height="544" rx="26" fill="url(#bg)" />
          <rect x="52" y="48" width="756" height="76" rx="26" fill="#98A2B3" />
          <rect x="52" y="98" width="756" height="26" fill="#98A2B3" />
        </g>

        <g clipPath="url(#windowClip)">
          <rect x="52" y="124" width="756" height="468" fill="#f8fafc" />
        </g>

        {/* Window chrome - RIGHT SIDE */}
        <g>
          <circle cx="710" cy="86" r="12" fill="#9ACB52" />
          <path
            d="M705 86h10M710 81v10"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>
        <g>
          <circle cx="740" cy="86" r="12" fill="#F5C94D" />
          <path
            d="M735 86h10"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>
        <g>
          <circle cx="770" cy="86" r="12" fill="#F15C63" />
          <path
            d="M765 81 L775 91 M775 81 L765 91"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>

        <rect x="250" y="73" width="360" height="28" rx="14" fill="#b8c1cd" opacity="0.7" />

        {/* Content */}
        <g className="main-content">
          <text
            x="430"
            y="198"
            textAnchor="middle"
            fontSize="46"
            fontWeight="700"
            fill="#7A8495"
            style={{ letterSpacing: "2px", fontFamily: "Inter, Arial, sans-serif" }}
          >
            LOGO
          </text>

          <rect x="88" y="220" width="572" height="16" rx="8" fill="#C9D2D6" />

          {/* decorative chips */}
          <g className="floating-chip">
            <rect x="676" y="214" width="66" height="24" rx="12" fill="#E9F4FA" />
            <circle cx="693" cy="226" r="5" fill="#70B8D5" />
            <rect x="704" y="222" width="24" height="8" rx="4" fill="#B5D4E2" />
          </g>
          <circle className="tiny-dot-1" cx="760" cy="222" r="7" fill="#8BC4D3" />
          <circle className="tiny-dot-2" cx="786" cy="222" r="10" fill="#A3D372" />

          {/* Sidebar */}
          <rect x="88" y="260" width="120" height="270" rx="18" fill="#EDF2F4" />
          <rect x="104" y="282" width="84" height="24" rx="6" fill="#CDD8DA" />
          <rect x="104" y="320" width="72" height="24" rx="6" fill="#D7DFE2" />
          <rect x="104" y="358" width="84" height="24" rx="6" fill="#CDD8DA" />
          <rect x="104" y="396" width="56" height="24" rx="6" fill="#D7DFE2" />
          <rect x="104" y="448" width="84" height="10" rx="5" fill="#CDD8DA" />
          <rect x="104" y="470" width="72" height="10" rx="5" fill="#D7DFE2" />
          <rect x="104" y="492" width="60" height="10" rx="5" fill="#CDD8DA" />

          {/* Hero card */}
          <g filter="url(#softShadow)">
            <rect x="226" y="260" width="500" height="220" rx="20" fill="url(#hero)" />

            {/* Sun behind mountains */}
            <circle className="sun" cx="438" cy="296" r="26" fill="#F5E4BC" />

            <path
              d="M226 442 L334 336 Q372 300 414 358 T500 382 T610 304 Q642 278 676 320 L726 378 L726 480 L226 480 Z"
              fill="url(#mountain1)"
            />
            <path
              d="M226 420 L366 486 L522 286 Q560 238 618 302 L726 412 L726 480 L226 480 Z"
              fill="url(#mountain2)"
              opacity="0.88"
            />
          </g>

          {/* Stats row with more detail */}
          <g>
            <g className="open-card">
              <rect x="226" y="494" width="104" height="78" rx="14" fill="#C8D0D3" />
              <rect x="240" y="510" width="40" height="10" rx="5" fill="#EEF2F4" opacity="0.9" />
              <rect x="240" y="530" width="72" height="8" rx="4" fill="#DAE1E5" />
              <rect x="240" y="546" width="56" height="8" rx="4" fill="#E8EDF0" />
              <circle cx="300" cy="518" r="8" fill="#8BC4D3" opacity="0.9" />
            </g>

            <g>
              <rect x="348" y="494" width="104" height="78" rx="14" fill="#E1E6E8" />
              <rect x="362" y="512" width="58" height="12" rx="6" fill="#BFC8CC" />
              <rect x="362" y="534" width="82" height="10" rx="5" fill="#CBD4D8" />
              <rect x="362" y="552" width="62" height="10" rx="5" fill="#D6DDE0" />
            </g>

            <g>
              <rect x="470" y="494" width="104" height="78" rx="14" fill="#C8D0D3" />
              <rect x="484" y="510" width="46" height="10" rx="5" fill="#EEF2F4" opacity="0.9" />
              <rect x="484" y="530" width="68" height="8" rx="4" fill="#D7E0E4" />
              <path
                d="M484 556 C498 544, 516 552, 530 540 S554 538, 560 532"
                fill="none"
                stroke="#EEF2F4"
                strokeWidth="5"
                strokeLinecap="round"
                opacity="0.9"
              />
            </g>

            <g>
              <rect x="592" y="494" width="134" height="78" rx="14" fill="#E1E6E8" />
              <rect x="606" y="512" width="86" height="12" rx="6" fill="#BFC8CC" />
              <rect x="606" y="534" width="102" height="10" rx="5" fill="#CBD4D8" />
              <rect x="606" y="552" width="74" height="10" rx="5" fill="#D6DDE0" />
              <circle cx="700" cy="516" r="7" fill="#A3D372" />
            </g>
          </g>

          {/* Footer lines */}
          <rect x="88" y="590" width="638" height="8" rx="4" fill="#C9D2D6" />
          <rect x="320" y="620" width="180" height="8" rx="4" fill="#D7DFE2" />
        </g>

        {/* Analytics panel overlay */}
        <g className="analytics-panel">
          <g filter="url(#shadow)">
            <rect x="464" y="154" width="286" height="264" rx="22" fill="url(#analyticsPanel)" />
          </g>

          <text
            x="500"
            y="196"
            fontSize="24"
            fontWeight="700"
            fill="#516074"
            style={{ fontFamily: "Inter, Arial, sans-serif" }}
          >
            Analytics
          </text>

          <g className="badge-blink">
            <rect x="626" y="176" width="56" height="28" rx="14" fill="#E7F5EC" />
            <text
              x="654"
              y="195"
              textAnchor="middle"
              fontSize="13"
              fontWeight="700"
              fill="#3AA468"
              style={{ fontFamily: "Inter, Arial, sans-serif" }}
            >
              +24.8%
            </text>
          </g>

          {/* Close button */}
          <g className="close-btn">
            <circle cx="718" cy="186" r="16" fill="#EEF3F8" />
            <path
              className="close-icon"
              d="M712 180 L724 192 M724 180 L712 192"
              stroke="#7B8796"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </g>

          {/* Chart area */}
          <rect x="492" y="224" width="230" height="112" rx="16" fill="#F7FAFD" stroke="#E4EAF2" />
          <line x1="514" y1="314" x2="702" y2="314" stroke="#DCE5EF" strokeWidth="2" />
          <line x1="514" y1="286" x2="702" y2="286" stroke="#E6EDF5" strokeWidth="2" />
          <line x1="514" y1="258" x2="702" y2="258" stroke="#E6EDF5" strokeWidth="2" />

          <g className="mini-bars">
            <rect x="526" y="274" width="16" height="40" rx="6" fill="#8BC4D3" />
            <rect x="556" y="248" width="16" height="66" rx="6" fill="#A3D372" />
            <rect x="586" y="264" width="16" height="50" rx="6" fill="#74AADF" />
            <rect x="616" y="236" width="16" height="78" rx="6" fill="#E5A68E" />
            <rect x="646" y="220" width="16" height="94" rx="6" fill="#8BC4D3" />
          </g>

          <path
            className="line-grow"
            d="M523 301 C553 285, 570 288, 592 270 S636 234, 698 246"
            fill="none"
            stroke="#5D9CE0"
            strokeWidth="5"
            strokeLinecap="round"
          />

          <rect x="492" y="356" width="108" height="44" rx="14" fill="#EEF4FA" />
          <rect x="614" y="356" width="108" height="44" rx="14" fill="#F2F6EC" />

          <text
            x="508"
            y="382"
            fontSize="15"
            fontWeight="700"
            fill="#5F7183"
            style={{ fontFamily: "Inter, Arial, sans-serif" }}
          >
            CTR
          </text>
          <text
            x="558"
            y="383"
            fontSize="16"
            fontWeight="800"
            fill="#4E9ED9"
            style={{ fontFamily: "Inter, Arial, sans-serif" }}
          >
            6.4%
          </text>

          <text
            x="631"
            y="382"
            fontSize="15"
            fontWeight="700"
            fill="#5F7183"
            style={{ fontFamily: "Inter, Arial, sans-serif" }}
          >
            Leads
          </text>
          <text
            x="686"
            y="383"
            fontSize="16"
            fontWeight="800"
            fill="#70AD4F"
            style={{ fontFamily: "Inter, Arial, sans-serif" }}
          >
            184
          </text>
        </g>

        {/* Cursor */}
        <g className="cursor">
          <path
            d="M0 0 L0 28 L8 20 L16 38 L22 36 L14 18 L26 18 Z"
            fill="#202939"
          />
        </g>

        {/* Outer frame line */}
        <rect x="52" y="48" width="756" height="544" rx="26" fill="none" stroke="#8892A1" strokeWidth="10" />
      </svg>
    </div>
  );
}