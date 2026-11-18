import { SpruceTree } from '@/svgs/NordicTrees'

/** The original landing-page mountain. */
export default function StoryMountain() {
 return (<svg className="storyOriginalMountain" viewBox="0 0 1000 700" preserveAspectRatio="none">
          <defs>
            {/* Lighting stays inside the original mountain silhouette. */}
            <clipPath id="storyMountainOutline"><path d="M0 700 L38 625 L82 570 L141 520 L191 474 L240 430 L286 383 L319 313 L358 281 L401 194 L443 127 L471 75 L489 36 L505 18 L523 43 L544 88 L568 119 L596 183 L631 230 L659 285 L706 319 L755 369 L808 419 L861 468 L915 520 L962 585 L1000 700 Z" /></clipPath>
            <linearGradient id="storyMountainSunlit" x1="0" y1="0" x2="1" y2="0.65">
              <stop offset="0%" stopColor="#e1edf1" />
              <stop offset="42%" stopColor="#c5d9e4" />
              <stop offset="100%" stopColor="#91adbf" />
            </linearGradient>
            <linearGradient id="storyMountainShadow" x1="0" y1="0" x2="1" y2="0.8">
              <stop offset="0%" stopColor="#819db1" />
              <stop offset="55%" stopColor="#6e899e" />
              <stop offset="100%" stopColor="#a5bdcb" />
            </linearGradient>
            <linearGradient id="storyMountainSnow" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#d6e5ec" />
            </linearGradient>
          </defs>

          <path className="mountainCenterBack" d="M0 700 L38 625 L82 570 L141 520 L191 474 L240 430 L286 383 L319 313 L358 281 L401 194 L443 127 L471 75 L489 36 L505 18 L523 43 L544 88 L568 119 L596 183 L631 230 L659 285 L706 319 L755 369 L808 419 L861 468 L915 520 L962 585 L1000 700 Z" />
          <path d="M0 700 L38 625 L82 570 L141 520 L191 474 L240 430 L286 383 L319 313 L358 281 L401 194 L443 127 L471 75 L489 36 L505 18 L510 112 L484 176 L468 228 L447 273 L420 326 L395 374 L366 420 L326 466 L284 510 L241 565 L195 610 L142 654 L92 680 L56 700 Z" fill="url(#storyMountainSunlit)" />
          <path className="storyMountainFace" clipPath="url(#storyMountainOutline)" d="M505 92 L523 43 L544 88 L568 119 L596 183 L631 230 L659 285 L706 319 L755 369 L808 419 L861 468 L915 520 L962 585 L1000 700 L0 700 L65 654 L105 623 L125 556 L140 492 L155 427 L185 359 L250 291 L390 220 L470 151 Z" fill="url(#storyMountainShadow)" opacity="0.78" />
          <path d="M505 18 L510 112 L484 176 L447 273 L468 228 L501 202 L523 151 L544 88 L523 43 Z" fill="url(#storyMountainSnow)" opacity="0.94" />
          <path d="M443 127 L471 75 L489 36 L505 18 L498 68 L477 101 L464 142 L443 174 L401 194 Z" fill="url(#storyMountainSnow)" opacity="0.96" />
          <path d="M358 281 L401 194 L443 174 L420 226 L395 252 L382 289 L347 326 L319 313 Z" fill="#a7c1d1" opacity="0.8" />
          <path d="M544 88 L568 119 L596 183 L631 230 L602 212 L579 178 L558 154 L535 123 Z" fill="#718ca1" opacity="0.58" />
          <path d="M468 228 L501 202 L484 250 L458 286 L438 337 L411 389 L379 440 L344 486 L365 435 L394 386 L416 335 L442 285 Z" fill="#718ca1" opacity="0.34" />
          <path d="M596 183 L631 230 L659 285 L706 319 L749 365 L711 350 L671 322 L643 284 L618 249 Z" fill="#d1e0e8" opacity="0.55" />
          <path className="mountainCenterFoot" d="M0 700 L0 641 C72 620 129 626 190 637 C251 606 309 603 366 622 C425 593 484 589 542 614 C602 595 659 603 716 627 C775 608 830 614 881 638 C929 625 966 630 1000 644 L1000 700 Z" />
          <path className="mountainFootContour" d="M18 657 C91 638 147 648 205 657 C266 627 321 628 377 645 C435 617 491 615 548 639 C607 621 663 629 719 651 C777 634 830 640 882 659 C927 648 964 651 989 660" />
          <path className="mountainFootContour mountainFootContour--lower" d="M30 680 C108 662 171 674 235 680 C298 652 358 659 417 673 C478 649 537 653 596 674 C657 657 717 667 776 680 C842 663 910 675 976 670" />
          <g className="mountainSpruces">
            <SpruceTree x={135} y={533} scale={1.1} />
            <SpruceTree x={210} y={563} scale={.82} />
            <SpruceTree x={796} y={531} scale={1.12} />
            <SpruceTree x={866} y={570} scale={.78} />
          </g>
        </svg>)
}
