import React, { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';

interface HeroBigArenaProps {
  activeStep: number;
  mergeCounter?: number;
  isArabic?: boolean;
}

export const HeroBigArena: React.FC<HeroBigArenaProps> = ({
  activeStep,
  mergeCounter = 1,
  isArabic = false,
}) => {
  const [etaSeconds, setEtaSeconds] = useState<number>(42);

  // Live countdown for Step 2
  useEffect(() => {
    if (activeStep === 1) {
      setEtaSeconds(42);
      const interval = setInterval(() => {
        setEtaSeconds((prev) => (prev > 14 ? prev - 4 : 12));
      }, 850);
      return () => clearInterval(interval);
    }
  }, [activeStep]);

  // Camera per step (one transform on the arena layer, 1.2s ease):
  // Reduced scale slightly so North Stand, Pitch, and Gate B stay clearly visible between text and phone
  const cameraTransforms = [
    'rotateX(55deg) rotateZ(-12deg) scale(1.42) translate(110px, 80px)',
    'rotateX(55deg) rotateZ(-8deg) scale(1.26) translate(75px, 60px)',
    'rotateX(55deg) rotateZ(-4deg) scale(1.16) translate(35px, 35px)',
    'rotateX(55deg) rotateZ(-1deg) scale(1.00) translate(0px, 10px)',
    'rotateX(55deg) rotateZ(0deg) scale(0.88) translate(0px, 0px)',
  ];

  const currentTransform = cameraTransforms[activeStep] ?? cameraTransforms[0];
  const isTeamArrived = activeStep >= 3;

  // 16 report chip origins distributed across Block 104 / North Stand for Step 3
  const chipOrigins = [
    { x: 350, y: 110 }, { x: 390, y: 95 },  { x: 430, y: 85 },  { x: 470, y: 80 },
    { x: 510, y: 85 },  { x: 550, y: 95 },  { x: 590, y: 110 }, { x: 370, y: 135 },
    { x: 410, y: 125 }, { x: 450, y: 115 }, { x: 510, y: 115 }, { x: 550, y: 125 },
    { x: 340, y: 155 }, { x: 390, y: 160 }, { x: 570, y: 155 }, { x: 610, y: 150 }
  ];

  return (
    <div 
      className={`relative w-[90vw] max-w-[1240px] h-[520px] lg:h-[620px] flex items-center justify-center pointer-events-none select-none transition-transform duration-700 ${
        isArabic ? '-translate-x-[10%] -translate-y-[6%]' : 'translate-x-[12%] -translate-y-[6%]'
      }`}
    >
      {/* 3D Perspective Stage Wrapper with Tilted CSS Perspective (rotateX ~55deg) */}
      <div
        className="relative w-full h-full flex items-center justify-center"
        style={{
          perspective: '1200px',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* THE ARENA TRANSFORM LAYER (1.2s smooth camera move) */}
        <div
          className="relative w-[960px] h-[620px] transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] flex items-center justify-center"
          style={{
            transform: currentTransform,
            transformStyle: 'preserve-3d',
            willChange: 'transform',
            filter: 'drop-shadow(0 30px 45px rgba(15, 23, 42, 0.20))',
          }}
        >
          {/* Stadium Floor Contact Shadow */}
          <div className="absolute inset-x-8 -bottom-10 h-28 bg-slate-900/15 rounded-full blur-2xl transform scale-y-50 -z-10" />

          {/* MAIN STADIUM SVG - 100% OPACITY, CRYSTAL CLEAR COLORS */}
          <div className="relative w-full h-full rounded-[86px] bg-[#F8FAFC] border-2 border-white/95 shadow-2xl p-4 overflow-visible">
            <svg
              viewBox="0 0 960 620"
              className="w-full h-full overflow-visible"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                {/* Fresh Stadium Turf Gradient */}
                <linearGradient id="arenaTurfGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#15803D" />
                  <stop offset="50%" stopColor="#16A34A" />
                  <stop offset="100%" stopColor="#15803D" />
                </linearGradient>

                {/* Pitch lawn mowing pattern */}
                <pattern id="arenaTurfStripes" width="40" height="40" patternUnits="userSpaceOnUse">
                  <rect width="20" height="40" fill="#14532D" opacity="0.32" />
                  <rect x="20" width="20" height="40" fill="#166534" opacity="0.12" />
                </pattern>
              </defs>

              {/* Stadium Concourse Shell - Crisp Mint/Ice Tone */}
              <rect
                x="28"
                y="18"
                width="904"
                height="584"
                rx="76"
                fill="#F1F5F9"
                stroke="#E2E8F0"
                strokeWidth="2.5"
              />

              {/* Concourse Path Ring */}
              <rect
                x="44"
                y="34"
                width="872"
                height="552"
                rx="64"
                fill="none"
                stroke="#CBD5E1"
                strokeWidth="1.5"
                strokeDasharray="8 6"
              />

              {/* ============================================================== */}
              {/* GRANDSTAND SECTORS: Pitch green, Soft Blue, Mint, Warm Peach VIP */}
              {/* ============================================================== */}

              {/* 1. North Stand (Virage Nord - Block 104) in Soft Blue */}
              <path
                d="M 230 155 C 350 60, 610 60, 730 155 L 670 175 C 570 95, 390 95, 290 175 Z"
                fill="#DBEAFE"
                stroke="#93C5FD"
                strokeWidth="2.5"
              />
              <text x="480" y="102" textAnchor="middle" fill="#1E3A8A" fontSize="13" fontWeight="800" letterSpacing="0.8">
                NORTH STAND (VIRAGE NORD)
              </text>
              <text x="480" y="120" textAnchor="middle" fill="#2563EB" fontSize="10.5" fontWeight="700">
                Block 104 • Active Sector
              </text>

              {/* 2. South Stand (Virage Sud) in Soft Mint */}
              <path
                d="M 230 465 C 350 560, 610 560, 730 465 L 670 445 C 570 525, 390 525, 290 445 Z"
                fill="#D1FAE5"
                stroke="#6EE7B7"
                strokeWidth="2.5"
              />
              <text x="480" y="530" textAnchor="middle" fill="#065F46" fontSize="13" fontWeight="800">
                SOUTH STAND (VIRAGE SUD)
              </text>

              {/* 3. West Stand in Soft Blue-Mint (Geometry preserved, text label hidden to avoid overlap under text block) */}
              <path
                d="M 135 180 L 225 190 L 225 430 L 135 440 Z"
                fill="#E0F2FE"
                stroke="#BAE6FD"
                strokeWidth="2"
              />
              {isArabic && (
                <text x="170" y="315" textAnchor="middle" fill="#0369A1" fontSize="11" fontWeight="800" transform="rotate(-90 170 315)">
                  WEST STAND
                </text>
              )}

              {/* 4. East Stand in Soft Blue-Mint */}
              <path
                d="M 825 180 L 735 190 L 735 430 L 825 440 Z"
                fill="#E0F2FE"
                stroke="#BAE6FD"
                strokeWidth="2"
              />
              {!isArabic && (
                <text x="790" y="315" textAnchor="middle" fill="#0369A1" fontSize="11" fontWeight="800" transform="rotate(90 790 315)">
                  EAST STAND
                </text>
              )}

              {/* 5. VIP Box in Warm Peach */}
              <rect x="238" y="265" width="46" height="90" rx="9" fill="#FFEDD5" stroke="#FB923C" strokeWidth="2" />
              <text x="261" y="315" textAnchor="middle" fill="#9A3412" fontSize="11" fontWeight="800">
                VIP
              </text>

              {/* 6. Gate A as labeled block */}
              <rect x="750" y="68" width="84" height="48" rx="10" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2" />
              {!isArabic && (
                <text x="792" y="98" textAnchor="middle" fill="#334155" fontSize="11" fontWeight="800">
                  GATE A
                </text>
              )}

              {/* 7. Gate B & Medical Post Alpha as labeled block (Stays visible in the corridor between text and phone) */}
              <rect x="126" y="68" width="90" height="52" rx="10" fill="#EFF6FF" stroke="#60A5FA" strokeWidth="2" />
              <text x="171" y="92" textAnchor="middle" fill="#1E40AF" fontSize="11.5" fontWeight="800">
                GATE B
              </text>
              <text x="171" y="108" textAnchor="middle" fill="#2563EB" fontSize="8.5" fontWeight="700">
                Medical Post α
              </text>

              {/* 8. Parking P1/P2 (Block geometry preserved, text label hidden to avoid running under text zone) */}
              <rect x="96" y="480" width="126" height="70" rx="12" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2" />

              {/* ============================================================== */}
              {/* FRESH GREEN PITCH & FIELD MARKINGS */}
              {/* ============================================================== */}
              <rect x="325" y="195" width="310" height="230" rx="8" fill="url(#arenaTurfGrad)" stroke="#15803D" strokeWidth="2.5" />
              <rect x="325" y="195" width="310" height="230" rx="8" fill="url(#arenaTurfStripes)" />

              {/* Boundary lines */}
              <rect x="335" y="205" width="290" height="210" fill="none" stroke="#FFFFFF" strokeWidth="2" opacity="0.95" />
              <line x1="335" y1="310" x2="625" y2="310" stroke="#FFFFFF" strokeWidth="2" opacity="0.95" />
              <circle cx="480" cy="310" r="34" fill="none" stroke="#FFFFFF" strokeWidth="2" opacity="0.95" />
              <circle cx="480" cy="310" r="3.5" fill="#FFFFFF" />

              {/* Penalty boxes */}
              <rect x="420" y="205" width="120" height="40" fill="none" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.95" />
              <rect x="420" y="375" width="120" height="40" fill="none" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.95" />

              {/* ============================================================== */}
              {/* STEP 2: ROUTE LINE FROM MEDICAL POST ALPHA TO SEAT 44 */}
              {/* ============================================================== */}
              {activeStep >= 1 && (
                <g>
                  <path
                    d="M 171 96 Q 315 65 480 142"
                    fill="none"
                    stroke={isTeamArrived ? '#10B981' : '#2F6BFF'}
                    strokeWidth="3.5"
                    strokeDasharray="6 4"
                    opacity="0.9"
                  />
                  {/* Moving Responder Dot along path */}
                  <circle
                    r="7"
                    fill={isTeamArrived ? '#10B981' : '#2F6BFF'}
                    stroke="#FFFFFF"
                    strokeWidth="2.5"
                  >
                    <animateMotion
                      path="M 171 96 Q 315 65 480 142"
                      dur={isTeamArrived ? '0.01s' : '2.8s'}
                      repeatCount={isTeamArrived ? '1' : 'indefinite'}
                      fill="freeze"
                    />
                  </circle>
                </g>
              )}

              {/* ============================================================== */}
              {/* STEP 3: MANY REPORT CHIPS FLYING IN AND MERGING INTO PIN */}
              {/* ============================================================== */}
              {activeStep === 2 && (
                <g>
                  {chipOrigins.map((chip, idx) => (
                    <circle
                      key={idx}
                      cx={chip.x}
                      cy={chip.y}
                      r="4"
                      fill="#FF8A1F"
                      stroke="#FFFFFF"
                      strokeWidth="1.5"
                      opacity="0.95"
                    >
                      <animate
                        attributeName="cx"
                        values={`${chip.x};480`}
                        dur={`${1.1 + (idx % 4) * 0.25}s`}
                        repeatCount="indefinite"
                        begin={`${(idx % 5) * 0.15}s`}
                      />
                      <animate
                        attributeName="cy"
                        values={`${chip.y};142`}
                        dur={`${1.1 + (idx % 4) * 0.25}s`}
                        repeatCount="indefinite"
                        begin={`${(idx % 5) * 0.15}s`}
                      />
                      <animate
                        attributeName="opacity"
                        values="1;1;0"
                        dur={`${1.1 + (idx % 4) * 0.25}s`}
                        repeatCount="indefinite"
                        begin={`${(idx % 5) * 0.15}s`}
                      />
                    </circle>
                  ))}
                </g>
              )}

              {/* ============================================================== */}
              {/* INCIDENT SEAT PIN (Row 12, Seat 44 at 480, 142) */}
              {/* ============================================================== */}
              <g transform="translate(480, 142)">
                {/* Ripple Ring */}
                <circle
                  cx="0"
                  cy="0"
                  r="18"
                  fill="none"
                  stroke={isTeamArrived ? '#10B981' : '#FF5A5F'}
                  strokeWidth="3"
                  opacity="0.85"
                  style={{
                    animation: 'pulse 1.8s cubic-bezier(0, 0, 0.2, 1) infinite',
                  }}
                />
                {/* Pin Core */}
                <circle
                  cx="0"
                  cy="0"
                  r="14"
                  fill={isTeamArrived ? '#10B981' : '#FF5A5F'}
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                />
                <text
                  x="0"
                  y="4.5"
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontSize="11"
                  fontWeight="800"
                >
                  {isTeamArrived ? '✓' : activeStep === 2 ? mergeCounter : '1'}
                </text>
              </g>

              {/* ============================================================== */}
              {/* ANNOTATIONS (Z-index 2 inside SVG plane with leader lines) */}
              {/* ============================================================== */}

              {/* Step 1 Annotation */}
              {activeStep === 0 && (
                <g>
                  <polyline
                    points="480,142 535,100 630,100"
                    fill="none"
                    stroke="#2F6BFF"
                    strokeWidth="2"
                    strokeDasharray="4 3"
                  />
                  <circle cx="480" cy="142" r="3" fill="#2F6BFF" />
                  <rect x="630" y="86" width="180" height="26" rx="7" fill="#FFFFFF" stroke="#93C5FD" strokeWidth="2" />
                  <text x="640" y="103" fill="#1E3A8A" fontSize="11" fontWeight="800">
                    Row 12, Seat 44 • Block 104
                  </text>
                </g>
              )}

              {/* Step 2 Annotation */}
              {activeStep === 1 && (
                <g>
                  <polyline
                    points="315,65 370,36 475,36"
                    fill="none"
                    stroke="#2F6BFF"
                    strokeWidth="2"
                    strokeDasharray="4 3"
                  />
                  <circle cx="315" cy="65" r="3" fill="#2F6BFF" />
                  <rect x="475" y="22" width="186" height="26" rx="7" fill="#FFFFFF" stroke="#93C5FD" strokeWidth="2" />
                  <text x="485" y="39" fill="#1E3A8A" fontSize="11" fontWeight="800">
                    Medical Unit Alpha • ETA {etaSeconds}s
                  </text>
                </g>
              )}

              {/* Step 3 Annotation */}
              {activeStep === 2 && (
                <g>
                  <polyline
                    points="480,142 535,90 640,90"
                    fill="none"
                    stroke="#FF8A1F"
                    strokeWidth="2"
                    strokeDasharray="4 3"
                  />
                  <circle cx="480" cy="142" r="3" fill="#FF8A1F" />
                  <rect x="640" y="76" width="190" height="26" rx="7" fill="#FFFFFF" stroke="#FDBA74" strokeWidth="2" />
                  <text x="650" y="93" fill="#9A3412" fontSize="11" fontWeight="800">
                    {mergeCounter} reports → 1 verified incident
                  </text>
                </g>
              )}

              {/* Step 4 Annotation */}
              {activeStep === 3 && (
                <g>
                  <polyline
                    points="480,142 535,90 645,90"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="2"
                    strokeDasharray="4 3"
                  />
                  <circle cx="480" cy="142" r="3" fill="#10B981" />
                  <rect x="645" y="76" width="200" height="26" rx="7" fill="#FFFFFF" stroke="#86EFAC" strokeWidth="2" />
                  <text x="655" y="93" fill="#065F46" fontSize="11" fontWeight="800">
                    Team Alpha On-Site • 58s Response
                  </text>
                </g>
              )}

              {/* Step 5 Annotation */}
              {activeStep === 4 && (
                <g>
                  <polyline
                    points="480,105 480,50 570,50"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="2"
                    strokeDasharray="4 3"
                  />
                  <circle cx="480" cy="105" r="3" fill="#10B981" />
                  <rect x="570" y="36" width="190" height="26" rx="7" fill="#FFFFFF" stroke="#86EFAC" strokeWidth="2" />
                  <text x="580" y="53" fill="#065F46" fontSize="11" fontWeight="800">
                    All Sectors Secure • Live Ready
                  </text>
                </g>
              )}

              {/* Thin white outline around whole stadium */}
              <rect
                x="26"
                y="16"
                width="908"
                height="588"
                rx="78"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="3.5"
              />
            </svg>
          </div>

          {/* Glass metrics strip around arena */}
          <div className="absolute -bottom-5 right-10 flex flex-wrap items-center gap-2 bg-white/95 px-3.5 py-1.5 rounded-2xl border border-black/[0.08] shadow-lg text-[10.5px] font-mono pointer-events-auto">
            <span className="text-[8.5px] font-bold px-1.5 py-0.5 rounded bg-black/[0.06] text-[#526071] tracking-wider uppercase">
              Demo data
            </span>
            <div className="flex items-center gap-1.5 pr-2 border-r border-black/[0.08]">
              <span className="text-[#526071]">Active:</span>
              <strong className="text-[#111827]">1</strong>
            </div>
            <div className="flex items-center gap-1.5 pr-2 border-r border-black/[0.08]">
              <span className="text-[#526071]">Merged:</span>
              <strong className="text-[#2F6BFF] font-bold">
                {activeStep >= 2 ? (activeStep === 2 ? mergeCounter : 8) : 1}
              </strong>
            </div>
            <div className="flex items-center gap-1.5 pr-2 border-r border-black/[0.08]">
              <span className="text-[#526071]">Avoided:</span>
              <strong className="text-emerald-700 font-bold">
                {activeStep >= 2 ? (activeStep === 2 ? Math.max(0, 8 - mergeCounter) : 7) : 0}
              </strong>
            </div>
            <div className="flex items-center gap-1.5 pr-2 border-r border-black/[0.08]">
              <span className="text-[#526071]">Teams:</span>
              <strong className="text-amber-700 font-bold">
                {isTeamArrived ? '0 (On-site)' : '1 en route'}
              </strong>
            </div>
            <div className="flex items-center gap-1.5 text-[#111827]">
              <Zap className="w-3.5 h-3.5 text-[#2F6BFF]" />
              <span>Response: <strong>0.8s</strong></span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
