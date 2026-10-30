import React, { useEffect, useState } from 'react';
import { 
  HeartPulse, 
  ShieldAlert, 
  Flame, 
  Ticket, 
  Mic, 
  CheckCircle2, 
  ArrowRight,
  Shield,
  Activity,
  Navigation,
  Wifi,
  BatteryCharging,
  Layers,
  Radio,
  Sparkles
} from 'lucide-react';
import { SupportedLang } from '../data/triageTree';

interface CssPhone3DProps {
  rotationY: number; // in degrees: strictly clamped between 0 and 35
  activeStep: number;
  mergedCount?: number;
  lang?: SupportedLang;
  onNavigateToPerspective: () => void;
  isArabic?: boolean;
}

export const CssPhone3D: React.FC<CssPhone3DProps> = ({
  rotationY,
  activeStep,
  mergedCount = 1,
  lang = 'fr',
  onNavigateToPerspective,
  isArabic = false,
}) => {
  // Proportions: flagship modern phone
  const width = 278;
  const height = 568;
  const depth = 28;
  const halfDepth = depth / 2;
  const cornerRadius = 42; // Requirement 2: slightly larger screen radius
  const screenRadius = 34;

  // Physical titanium layers along Z (8 layers)
  const layerCount = 8;
  const layers = Array.from({ length: layerCount }, (_, i) => {
    const z = -halfDepth + (depth / (layerCount - 1)) * i;
    return { id: i, z };
  });

  // Step 4 state: Action button transition from "Send medical team" to "Team on the way ✓"
  const [isTeamDispatched, setIsTeamDispatched] = useState(false);
  const [etaTime, setEtaTime] = useState(38);

  useEffect(() => {
    if (activeStep === 3) {
      setIsTeamDispatched(false);
      const timer = setTimeout(() => {
        setIsTeamDispatched(true);
      }, 1600);
      const etaInterval = setInterval(() => {
        setEtaTime((prev) => (prev > 12 ? prev - 3 : 10));
      }, 900);
      return () => {
        clearTimeout(timer);
        clearInterval(etaInterval);
      };
    } else {
      setIsTeamDispatched(false);
      setEtaTime(38);
    }
  }, [activeStep]);

  // Requirement 2: Soft glow color matching step
  // Step 1: coral, Step 2: blue, Step 3: red-orange, Step 4: green, Step 5: blue/emerald
  const glowColors = [
    'rgba(255, 90, 95, 0.45)',    // coral
    'rgba(47, 107, 255, 0.48)',    // blue
    'rgba(234, 88, 12, 0.50)',     // red-orange
    'rgba(16, 185, 129, 0.45)',    // green
    'rgba(47, 107, 255, 0.42)',    // confident blue
  ];
  const activeGlow = glowColors[activeStep] || glowColors[0];

  // Dynamic light angles for titanium edge highlight and glass glare shifting with rotation
  const edgeGradientAngle = Math.round(120 + rotationY * 1.6);
  const glassStreakX = Math.round(rotationY * 3.2);

  // Requirement 1: 8 report cards data for step 3 fan
  const fannedReports = [
    { id: 1, langLabel: 'Darija', script: 'دارجة', seat: 'Seat 44 • Bloc 104', text: 'طاح واحد الراجل مغيب دابا عتقو', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
    { id: 2, langLabel: 'French', script: 'FR', seat: 'Porte B • Rang 12', text: 'Malaise urgent personne au sol', color: 'bg-blue-50 text-blue-800 border-blue-200' },
    { id: 3, langLabel: 'Arabic', script: 'العربية', seat: 'صف 12 • مقعد 45', text: 'شخص مغمى عليه ولا يتنفس جيدا', color: 'bg-amber-50 text-amber-800 border-amber-200' },
    { id: 4, langLabel: 'English', script: 'EN', seat: 'Block 104 • Row 12', text: 'Supporter collapsed near aisle 4', color: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
    { id: 5, langLabel: 'Darija', script: 'دارجة', seat: 'Seat 43 • North Stand', text: 's-sayed ghayeb f l-koursi sifty l is3af', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
    { id: 6, langLabel: 'French', script: 'FR', seat: 'Porte B • Escalier 4', text: 'Besoin médical immédiat rang 12', color: 'bg-blue-50 text-blue-800 border-blue-200' },
    { id: 7, langLabel: 'English', script: 'EN', seat: 'Row 11 • Seat 44', text: 'Urgent medic needed at North Stand', color: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
    { id: 8, langLabel: 'Arabic', script: 'العربية', seat: 'البوابة ب • البلوك 104', text: 'نداء إغاثة طبي عاجل للمقعد 44', color: 'bg-amber-50 text-amber-800 border-amber-200' },
  ];

  // Normalized convergence factor for step 3 cards: 8 -> 1
  // As mergedCount ticks 8 -> 1, spreadFactor goes from 1 down to 0
  const spreadFactor = Math.max(0, Math.min(1, (mergedCount - 1) / 7));

  return (
    <div
      className="relative flex items-center justify-center select-none"
      style={{ perspective: '1200px' }}
    >
      {/* =========================================================================
          DYNAMIC SOFT GLOW UNDER PHONE (MATCHING STEP COLOR)
          - Coral in step 1, Blue in step 2, Red-Orange in step 3, Green in step 4
          ========================================================================= */}
      <div 
        className="absolute -bottom-10 w-[240px] h-[26px] rounded-full blur-md pointer-events-none transform scale-y-75 transition-all duration-700"
        style={{
          background: 'rgba(0,0,0,0.22)',
        }}
      />
      <div 
        className="absolute -bottom-14 w-[320px] h-[48px] rounded-full blur-2xl pointer-events-none transition-all duration-700"
        style={{
          background: activeGlow,
        }}
      />

      {/* =========================================================================
          STEP 3: 8 REPORT CARDS FLOATING IN A FAN ON THE OPEN SIDE OF THE PHONE
          - Float at different depths
          - Tagged with language (Darija, Arabic, French, English) and seat
          - Slide toward each other as counter ticks 8 to 1 and merge into ONE large incident card
          ========================================================================= */}
      {activeStep === 2 && (
        <div 
          className={`absolute ${
            isArabic ? '-right-[290px] xl:-right-[330px]' : '-left-[290px] xl:-left-[330px]'
          } top-1/2 -translate-y-1/2 w-[270px] pointer-events-none z-30 hidden sm:block`}
          style={{
            transformStyle: 'preserve-3d',
            perspective: '1000px',
          }}
        >
          {/* Fan Cards container */}
          <div className="relative w-full h-[360px] flex items-center justify-center">
            {/* 8 Floating Fan Cards (Visible while spreadFactor > 0.15) */}
            {fannedReports.map((card, idx) => {
              // Fan geometric offsets (X, Y, rotation, and Z depth)
              const fanAngle = (idx - 3.5) * 6; // -21deg to +21deg
              const fanX = (idx - 3.5) * 12 * spreadFactor;
              const fanY = (idx - 3.5) * 34 * spreadFactor;
              const fanZ = (3.5 - Math.abs(idx - 3.5)) * 18 * spreadFactor;
              const cardOpacity = spreadFactor > 0.15 ? Math.max(0.4, 1 - (1 - spreadFactor) * 0.9) : 0;

              return (
                <div
                  key={card.id}
                  className="absolute w-[230px] p-2.5 rounded-2xl bg-white/95 backdrop-blur-md border shadow-lg transition-all duration-300 pointer-events-none"
                  style={{
                    transform: `translateX(${fanX}px) translateY(${fanY}px) translateZ(${fanZ}px) rotate(${fanAngle * spreadFactor}deg)`,
                    opacity: cardOpacity,
                    borderColor: 'rgba(0,0,0,0.08)',
                    boxShadow: '0 8px 24px -4px rgba(0,0,0,0.12)',
                    willChange: 'transform, opacity',
                  }}
                >
                  <div className="flex items-center justify-between text-[8px] font-mono font-bold mb-1">
                    <span className={`px-2 py-0.5 rounded-full border ${card.color}`}>
                      {card.langLabel} • {card.script}
                    </span>
                    <span className="text-[#526071]">{card.seat}</span>
                  </div>
                  <p className="text-[9.5px] font-semibold text-[#111827] truncate">
                    "{card.text}"
                  </p>
                </div>
              );
            })}

            {/* MERGED SINGLE LARGE INCIDENT CARD (Fades in strongly as cards converge) */}
            <div
              className="absolute w-[265px] p-4 rounded-3xl bg-gradient-to-br from-[#1E293B] via-[#0F172A] to-[#1E1B4B] text-white shadow-2xl border border-white/20 transition-all duration-500 text-left space-y-2.5 pointer-events-auto"
              style={{
                opacity: 1 - spreadFactor * 0.65,
                transform: `scale(${1.05 - spreadFactor * 0.15}) translateZ(${40 - spreadFactor * 30}px)`,
                boxShadow: '0 20px 45px -8px rgba(234, 88, 12, 0.4), 0 0 0 1px rgba(255,255,255,0.2)',
              }}
            >
              {/* Top Bar: Merged Counter + Severity Badge Turning Red */}
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono uppercase tracking-wider text-orange-300 font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                  Corroboration
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[8.5px] font-mono font-bold transition-colors duration-500 ${
                  mergedCount <= 3
                    ? 'bg-red-500 text-white animate-pulse shadow-md shadow-red-500/40'
                    : 'bg-amber-500 text-white'
                }`}>
                  {mergedCount <= 3 ? 'SEVERITY: CRITICAL' : 'SEVERITY: HIGH'}
                </span>
              </div>

              {/* Ticking Counter Display: 8 to 1 */}
              <div className="flex items-baseline gap-2 py-0.5">
                <div className="text-3xl font-black font-mono tracking-tight text-white">
                  {mergedCount} → 1
                </div>
                <div className="text-[10px] text-orange-200 font-semibold leading-tight">
                  {mergedCount === 1 ? 'Unified into Incident #408' : 'Merging crowd alerts...'}
                </div>
              </div>

              {/* Merged Incident Details */}
              <div className="p-2 rounded-xl bg-white/10 border border-white/10 space-y-1 text-[9.5px]">
                <div className="flex items-center justify-between font-mono text-[8.5px] text-slate-300">
                  <span>Gate B • Block 104 • Row 12</span>
                  <span className="text-emerald-400 font-bold">4 Languages</span>
                </div>
                <p className="text-white font-medium leading-snug">
                  Medical emergency: 8 supporter reports converged into 1 actionable response ticket.
                </p>
              </div>

              {/* Duplicate Reduction Metric */}
              <div className="flex items-center justify-between text-[8.5px] font-mono pt-0.5 text-slate-300">
                <span>Duplicate alerts avoided:</span>
                <strong className="text-emerald-400 font-bold">87.5% reduction</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          3D PHONE MASTER BODY WITH PRESERVE-3D
          - Rotation clamped between 0 and 35 degrees (Screen is ALWAYS visible)
          - For Step 3, rotate ~35 degrees with slight tilt (three-quarter view)
          ========================================================================= */}
      <div
        className="relative transition-transform duration-500 ease-out"
        style={{
          width: `${width}px`,
          height: `${height}px`,
          transformStyle: 'preserve-3d',
          transform: activeStep === 2
            ? `rotateY(${rotationY}deg) rotateX(3.5deg) rotateZ(-1.5deg)`
            : `rotateY(${rotationY}deg)`,
          willChange: 'transform',
        }}
      >
        {/* TITANIUM FRAME LAYERS ALONG Z WITH DYNAMIC POLISHED HIGHLIGHT */}
        {layers.map((layer, idx) => (
          <div
            key={layer.id}
            className="absolute inset-0 pointer-events-none transition-colors duration-300"
            style={{
              borderRadius: `${cornerRadius}px`,
              transform: `translateZ(${layer.z.toFixed(2)}px)`,
              background: idx === layers.length - 1
                ? `linear-gradient(${edgeGradientAngle}deg, #ffffff 0%, #deded8 25%, #9e9e95 50%, #f7f7f4 75%, #b5b5ad 100%)`
                : idx === 0
                ? `linear-gradient(${edgeGradientAngle}deg, #9e9e95 0%, #deded8 35%, #7e7e76 70%, #deded8 100%)`
                : `linear-gradient(${edgeGradientAngle}deg, #c8c8c0 0%, #ecece6 35%, #9c9c93 70%, #dcdcd4 100%)`,
              opacity: 0.95,
              boxShadow: idx === layers.length - 1 
                ? 'inset 0 0 0 1px rgba(255,255,255,0.7), 0 0 0 1px rgba(0,0,0,0.15)'
                : undefined,
            }}
          />
        ))}

        {/* PHYSICAL HARDWARE SIDE BUTTONS (Polished Titanium) */}
        <div
          className="absolute left-0 top-[125px] w-[5px] h-[30px] rounded-l-md bg-[#a8a8a0] border-l border-white/80 shadow-xs"
          style={{ transform: `translateX(-4.5px) translateZ(0px)` }}
        />
        <div
          className="absolute left-0 top-[170px] w-[5px] h-[48px] rounded-l-md bg-[#a8a8a0] border-l border-white/80 shadow-xs"
          style={{ transform: `translateX(-4.5px) translateZ(0px)` }}
        />
        <div
          className="absolute left-0 top-[228px] w-[5px] h-[48px] rounded-l-md bg-[#a8a8a0] border-l border-white/80 shadow-xs"
          style={{ transform: `translateX(-4.5px) translateZ(0px)` }}
        />
        <div
          className="absolute right-0 top-[180px] w-[5px] h-[70px] rounded-r-md bg-[#a8a8a0] border-r border-white/80 shadow-xs"
          style={{ transform: `translateX(4.5px) translateZ(0px)` }}
        />

        {/* BACK FACE (translateZ: -halfDepth) */}
        <div
          className="absolute inset-0 p-5 bg-gradient-to-b from-[#f3f3ee] via-[#e5e5dc] to-[#d8d8ce] flex flex-col justify-between items-center text-center border border-white/90"
          style={{
            borderRadius: `${cornerRadius}px`,
            transform: `translateZ(${-halfDepth}px) rotateY(180deg)`,
            backfaceVisibility: 'hidden',
          }}
        >
          {/* Camera Module */}
          <div className="w-22 h-22 rounded-[26px] bg-[#d5d5cc] p-2 border border-white/80 relative shadow-sm">
            <div className="absolute top-2.5 left-2.5 w-6.5 h-6.5 rounded-full bg-[#1e293b] flex items-center justify-center border border-white/20">
              <div className="w-2.5 h-2.5 rounded-full bg-[#0f172a]" />
            </div>
            <div className="absolute bottom-2.5 left-2.5 w-6.5 h-6.5 rounded-full bg-[#1e293b] flex items-center justify-center border border-white/20">
              <div className="w-2.5 h-2.5 rounded-full bg-[#0f172a]" />
            </div>
            <div className="absolute top-1/2 -translate-y-1/2 right-2.5 w-6.5 h-6.5 rounded-full bg-[#1e293b] flex items-center justify-center border border-white/20">
              <div className="w-2.5 h-2.5 rounded-full bg-[#0f172a]" />
            </div>
          </div>

          <div className="my-auto flex flex-col items-center justify-center space-y-1.5">
            <div className="w-10 h-10 rounded-2xl bg-white/90 border border-white flex items-center justify-center shadow-xs">
              <Shield className="w-5 h-5 text-[#2F6BFF]" strokeWidth={2.2} />
            </div>
            <span className="text-sm font-serif-headline font-bold text-[#111827]">
              MyArena
            </span>
          </div>

          <div className="pb-1 text-[8.5px] font-mono text-[#8E8E86]">
            MYARENA STADIUM PLATFORM
          </div>
        </div>

        {/* =========================================================================
            FRONT FACE: REAL OLED DISPLAY AT Z = +halfDepth
            - Guaranteed 100% visible, crisp DOM rendering
            - Polished bevel border and screen corner radius 34px
            ========================================================================= */}
        <div
          className="absolute inset-0 p-[7.5px] bg-[#0c0d0e] flex flex-col border border-white/50 shadow-2xl"
          style={{
            borderRadius: `${cornerRadius}px`,
            transform: `translateZ(${halfDepth}px)`,
            backfaceVisibility: 'hidden',
          }}
        >
          {/* Inner OLED Display Container */}
          <div 
            className="relative w-full h-full overflow-hidden flex flex-col font-sans select-none border border-black/20"
            style={{ borderRadius: `${screenRadius}px` }}
          >
            {/* ===================================================================
                THIN GLASS REFLECTION STREAK ACROSS SCREEN
                - Shifts with the rotation angle (Requirement 2)
                =================================================================== */}
            <div
              className="absolute inset-0 pointer-events-none z-40 transition-transform duration-500 ease-out"
              style={{
                background: 'linear-gradient(118deg, transparent 25%, rgba(255,255,255,0.26) 46%, rgba(255,255,255,0.06) 54%, transparent 75%)',
                transform: `translateX(${glassStreakX}px)`,
                mixBlendMode: 'overlay',
              }}
            />

            {/* ===================================================================
                RICHER STATUS BAR: DYNAMIC ISLAND + 5G + CELLULAR + BATTERY
                =================================================================== */}
            <div className="relative pt-2 px-3.5 pb-1 flex items-center justify-between text-[10px] font-mono font-semibold text-neutral-800 bg-white/80 backdrop-blur-md z-30 border-b border-black/[0.04]">
              <span className="font-bold tracking-tight">21:45</span>
              {/* Dynamic Island */}
              <div className="w-20 h-4 bg-black rounded-full flex items-center justify-between px-2.5 shadow-xs">
                <div className="w-1.5 h-1.5 rounded-full bg-neutral-700" />
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <div className="flex items-center gap-1.5 text-[9px]">
                <Wifi className="w-2.5 h-2.5 text-[#111827]" />
                <span className="font-bold tracking-tight">5G</span>
                <span className="w-4 h-2 rounded-xs border border-neutral-800 relative flex items-center p-0.5">
                  <span className="h-full w-full bg-emerald-500 rounded-2xs" />
                </span>
              </div>
            </div>

            {/* RICHER APP HEADER: LOGO, LIVE PULSE DOT, SECTOR STATUS */}
            <div className="px-3.5 py-1.5 border-b border-black/[0.06] bg-white/90 backdrop-blur-xs flex items-center justify-between z-20">
              <div className="flex items-center gap-1.5">
                <div className="w-4.5 h-4.5 rounded-lg bg-[#2F6BFF] text-white flex items-center justify-center shadow-xs">
                  <Shield className="w-2.5 h-2.5" />
                </div>
                <span className="text-[11.5px] font-bold text-[#111827] tracking-tight">
                  MyArena
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping ml-0.5" />
              </div>
              <span className="text-[8px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#2F6BFF] border border-blue-200">
                SECTOR B • TICKET #104
              </span>
            </div>

            {/* SCREEN VIEW PER STEP - FULL HEIGHT, NO EMPTY AREAS */}
            <div className="flex-1 flex flex-col justify-between overflow-hidden relative">
              
              {/* ===================================================================
                  STEP 1: ONE TAP TRIGGER
                  - Top ticket card: Gate B, Block 104, Row 12, Seat 44, "Simulated ticket scan"
                  - 3 big colored buttons filling the screen (coral Medical, blue Security, orange Fire)
                  - Pulse ring on Medical and finger tap ripple
                  =================================================================== */}
              {activeStep === 0 && (
                <div className="flex-1 flex flex-col justify-between p-3 pb-3.5 bg-gradient-to-b from-blue-50/95 via-indigo-50/80 to-rose-50/90">
                  {/* Top Ticket Card */}
                  <div className="p-2.5 rounded-2xl bg-white/95 border border-blue-200/90 shadow-xs space-y-1.5">
                    <div className="flex items-center justify-between text-[8.5px] font-mono font-bold text-[#2F6BFF]">
                      <span className="flex items-center gap-1">
                        <Ticket className="w-3.5 h-3.5 text-[#2F6BFF]" />
                        <span>MATCH TICKET SCANNED</span>
                      </span>
                      <span className="text-[7.5px] font-sans font-bold text-emerald-700 bg-emerald-100/90 px-1.5 py-0.5 rounded-md">
                        Simulated ticket scan
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5 text-center">
                      <div className="p-1 rounded-xl bg-blue-50/90 border border-blue-100">
                        <span className="text-[7.5px] text-[#526071] block font-medium">Gate</span>
                        <strong className="text-[11px] text-[#111827]">B</strong>
                      </div>
                      <div className="p-1 rounded-xl bg-blue-50/90 border border-blue-100">
                        <span className="text-[7.5px] text-[#526071] block font-medium">Block</span>
                        <strong className="text-[11px] text-[#111827]">104</strong>
                      </div>
                      <div className="p-1 rounded-xl bg-blue-50/90 border border-blue-100">
                        <span className="text-[7.5px] text-[#526071] block font-medium">Row</span>
                        <strong className="text-[11px] text-[#111827]">12</strong>
                      </div>
                      <div className="p-1 rounded-xl bg-blue-50/90 border border-blue-100">
                        <span className="text-[7.5px] text-[#526071] block font-medium">Seat</span>
                        <strong className="text-[11px] text-[#111827]">44</strong>
                      </div>
                    </div>
                  </div>

                  <div className="text-center py-0.5">
                    <h3 className="text-[12px] font-serif-headline text-[#111827] font-bold">
                      Need Urgent Help?
                    </h3>
                    <p className="text-[8px] text-[#526071]">
                      One tap notifies stadium command with exact coordinates
                    </p>
                  </div>

                  {/* 3 BIG COLORED BUTTONS FILLING REST OF SCREEN */}
                  <div className="flex-1 flex flex-col justify-between gap-2 pt-0.5">
                    {/* Coral Medical with Pulse Ring & Finger Tap Ripple */}
                    <div className="relative flex-1 p-3 rounded-2xl bg-gradient-to-r from-[#FF5A5F] via-[#F43F5E] to-[#E11D48] text-white shadow-md flex items-center justify-between overflow-hidden cursor-pointer group">
                      {/* Pulse Ring */}
                      <div className="absolute inset-0 rounded-2xl border-2 border-white/60 animate-ping pointer-events-none" />
                      {/* Finger Tap Ripple */}
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/35 animate-pulse pointer-events-none" />

                      <div className="relative z-10">
                        <span className="text-xs font-bold block tracking-tight">Medical</span>
                        <span className="text-[8px] text-white/90">Collapsed, injury, unwell</span>
                      </div>
                      <div className="relative z-10 w-8 h-8 rounded-xl bg-white/25 flex items-center justify-center">
                        <HeartPulse className="w-4 h-4 animate-pulse text-white" />
                      </div>
                    </div>

                    {/* Blue Security */}
                    <div className="flex-1 p-3 rounded-2xl bg-gradient-to-r from-[#2F6BFF] via-[#1D4ED8] to-[#1E40AF] text-white shadow-md flex items-center justify-between cursor-pointer">
                      <div>
                        <span className="text-xs font-bold block tracking-tight">Security</span>
                        <span className="text-[8px] text-white/90">Fight, threat, harassment</span>
                      </div>
                      <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                        <ShieldAlert className="w-4 h-4 text-white" />
                      </div>
                    </div>

                    {/* Orange Fire */}
                    <div className="flex-1 p-3 rounded-2xl bg-gradient-to-r from-[#FF8A1F] via-[#EA580C] to-[#C2410C] text-white shadow-md flex items-center justify-between cursor-pointer">
                      <div>
                        <span className="text-xs font-bold block tracking-tight">Fire / Crush</span>
                        <span className="text-[8px] text-white/90">Smoke, surge, blocked exit</span>
                      </div>
                      <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                        <Flame className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ===================================================================
                  STEP 2: AI REASSURANCE TALKS TO YOU
                  - AI orb pulsing at top with a waveform
                  - Chat with 3 bubbles appearing one by one (one AR, one FR, one EN)
                  - Quick-reply chips at bottom
                  =================================================================== */}
              {activeStep === 1 && (
                <div className="flex-1 flex flex-col justify-between p-3 bg-gradient-to-b from-cyan-50/95 via-blue-50/80 to-emerald-50/90">
                  {/* AI Orb with Waveform at top */}
                  <div className="flex flex-col items-center justify-center pt-1 pb-1">
                    <div className="relative w-12 h-12 flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full bg-[#2F6BFF]/25 animate-ping" />
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#2F6BFF] via-[#38BDF8] to-[#10B981] flex items-center justify-center shadow-md text-white">
                        <Mic className="w-4.5 h-4.5 animate-pulse" />
                      </div>
                    </div>

                    {/* Animated Audio Waveform */}
                    <div className="flex items-center gap-1 mt-1.5 h-3">
                      <span className="w-1 bg-[#2F6BFF] rounded-full h-2 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1 bg-[#0284C7] rounded-full h-3.5 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1 bg-[#10B981] rounded-full h-2.5 animate-bounce" style={{ animationDelay: '300ms' }} />
                      <span className="w-1 bg-[#2F6BFF] rounded-full h-4 animate-bounce" style={{ animationDelay: '450ms' }} />
                      <span className="w-1 bg-[#0284C7] rounded-full h-2 animate-bounce" style={{ animationDelay: '600ms' }} />
                    </div>
                  </div>

                  {/* 3 CHAT BUBBLES APPEARING ONE BY ONE: AR, FR, EN */}
                  <div className="space-y-1.5 my-auto">
                    {/* Bubble 1: AR / Darija */}
                    <div className="p-2.5 rounded-2xl bg-white/95 border border-emerald-100 shadow-2xs text-[9px] text-right font-sans" dir="rtl">
                      <span className="text-[7.5px] font-mono font-bold text-emerald-700 block mb-0.5">العربية • الدارجة</span>
                      <p className="text-[#111827] font-semibold leading-tight">
                        "أنا معك، فرقة الإسعاف جاية لعندك دابا للبلوك 104."
                      </p>
                    </div>

                    {/* Bubble 2: FR */}
                    <div className="p-2.5 rounded-2xl bg-white/95 border border-blue-100 shadow-2xs text-[9px]">
                      <span className="text-[7.5px] font-mono font-bold text-[#2F6BFF] block mb-0.5">Français</span>
                      <p className="text-[#111827] font-semibold leading-tight">
                        "Je suis avec vous. L'équipe médicale arrive rang 12."
                      </p>
                    </div>

                    {/* Bubble 3: EN */}
                    <div className="p-2.5 rounded-2xl bg-white/95 border border-indigo-100 shadow-2xs text-[9px]">
                      <span className="text-[7.5px] font-mono font-bold text-indigo-600 block mb-0.5">English</span>
                      <p className="text-[#111827] font-semibold leading-tight">
                        "Help is talking to you. Paramedics are already on their way."
                      </p>
                    </div>
                  </div>

                  {/* Quick-reply chips at bottom */}
                  <div className="pt-1 space-y-1">
                    <span className="text-[7.5px] font-mono text-[#526071] block text-center">
                      {isArabic ? "فرز فوري :" : lang === 'en' ? "Instant triage:" : "Triage instantané :"}
                    </span>
                    <div className="flex flex-wrap gap-1 justify-center">
                      <span className="px-2 py-1 rounded-full bg-blue-100 text-[#2F6BFF] text-[8px] font-bold border border-blue-200">
                        {isArabic ? "كيتنفس مزيان" : lang === 'en' ? "Breathing steadily" : "Oui, elle respire"}
                      </span>
                      <span className="px-2 py-1 rounded-full bg-red-100 text-red-600 text-[8px] font-bold border border-red-200">
                        {isArabic ? "فاقد الوعي" : lang === 'en' ? "Unconscious" : "Inconsciente"}
                      </span>
                      <span className="px-2 py-1 rounded-full bg-slate-100 text-[#475569] text-[8px] font-bold border border-slate-200">
                        {isArabic ? "المنظم وصل" : lang === 'en' ? "Steward here" : "Stadiers proches"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* ===================================================================
                  STEP 3: 8 REPORTS COLLAPSE INTO 1 INCIDENT
                  - Phone is rotated at ~35 degrees (three-quarter view) so screen is fully readable
                  - The phone screen shows the SAME merged card with counter 8 to 1 and red severity badge
                  =================================================================== */}
              {activeStep === 2 && (
                <div className="flex-1 flex flex-col justify-between p-3 bg-gradient-to-b from-amber-50/95 via-orange-50/80 to-purple-50/95">
                  {/* Top Incoming Reports Ticker */}
                  <div className="p-2 rounded-xl bg-white/90 border border-orange-200 text-center shadow-2xs space-y-1">
                    <div className="flex items-center justify-between text-[7.5px] font-mono font-bold text-[#526071]">
                      <span>INCOMING FAN STREAM</span>
                      <span className="text-orange-600 font-bold">8 Raw Submissions</span>
                    </div>
                    <div className="flex items-center justify-center gap-1">
                      <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[7px] font-bold">دارجة</span>
                      <span className="px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[7px] font-bold">FR</span>
                      <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[7px] font-bold">العربية</span>
                      <span className="px-1.5 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-[7px] font-bold">EN</span>
                    </div>
                  </div>

                  {/* LARGE UNIFIED INCIDENT CARD WITH TICKING COUNTER (8 to 1) */}
                  <div className="my-auto p-3.5 rounded-2xl bg-gradient-to-br from-[#1E293B] via-[#0F172A] to-[#312E81] text-white shadow-xl border border-white/20 text-center space-y-1.5">
                    <div className="flex items-center justify-between text-[8px] font-mono tracking-wider text-orange-200 uppercase">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-orange-400" />
                        Corroboration
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold transition-colors duration-300 ${
                        mergedCount <= 3 ? 'bg-red-500 text-white animate-pulse' : 'bg-amber-500 text-white'
                      }`}>
                        {mergedCount <= 3 ? 'CRITICAL' : 'HIGH'}
                      </span>
                    </div>

                    <div className="py-1">
                      <div className="text-3xl font-black font-mono tracking-tight text-white drop-shadow-md">
                        {mergedCount} → 1
                      </div>
                      <span className="text-[9.5px] text-orange-100 font-bold block mt-0.5">
                        Merged into Single Incident #408
                      </span>
                    </div>

                    <p className="text-[8.5px] text-white/90 leading-tight">
                      Duplicate panic alerts eliminated. Command sees one clean mission.
                    </p>
                  </div>

                  {/* Noise Reduction Stat Bar */}
                  <div className="p-2 rounded-xl bg-white/95 border border-purple-200 flex items-center justify-between text-[8.5px] font-mono">
                    <span className="text-[#526071]">Noise reduced:</span>
                    <strong className="text-emerald-600 font-bold">87.5% avoided</strong>
                  </div>
                </div>
              )}

              {/* ===================================================================
                  STEP 4: COMMAND DASHBOARD & LIVE ACTION BUTTON
                  - Dashboard card fully styled: incident type icon, seat, severity dot
                  - Mini route map with moving dot
                  - ETA counting down
                  - Large action button "Send medical team" -> "Team on the way ✓"
                  =================================================================== */}
              {activeStep === 3 && (
                <div className="flex-1 flex flex-col justify-between p-3 bg-gradient-to-b from-emerald-50/95 via-blue-50/80 to-slate-50/90">
                  {/* Dashboard Header Card */}
                  <div className="p-2.5 rounded-2xl bg-white/95 border border-slate-200 shadow-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                          <HeartPulse className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <strong className="text-[10px] text-[#111827] block">Medical Emergency</strong>
                          <span className="text-[8px] text-[#526071]">Row 12 • Seat 44 • Block 104</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[8px] font-mono font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                        <span>CRITICAL</span>
                      </div>
                    </div>
                  </div>

                  {/* MINI ROUTE MAP WITH MOVING RESPONDER DOT */}
                  <div className="relative h-28 rounded-2xl bg-slate-900 overflow-hidden border border-slate-800 p-2 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-[8px] font-mono text-slate-300 z-10">
                      <span className="flex items-center gap-1">
                        <Navigation className="w-2.5 h-2.5 text-[#2F6BFF]" />
                        <span>TACTICAL MAP</span>
                      </span>
                      <span className="text-emerald-400 font-bold">ETA 00:{etaTime < 10 ? `0${etaTime}` : etaTime}</span>
                    </div>

                    {/* SVG Mini Route */}
                    <svg viewBox="0 0 220 80" className="w-full h-16">
                      <rect x="10" y="10" width="200" height="60" rx="10" fill="#1e293b" stroke="#334155" />
                      <path d="M 25 50 Q 110 15 195 40" fill="none" stroke="#2F6BFF" strokeWidth="2.5" strokeDasharray="4 3" />
                      {/* Gate B origin */}
                      <circle cx="25" cy="50" r="4" fill="#60A5FA" />
                      {/* Target Seat 44 */}
                      <circle cx="195" cy="40" r="6" fill="#EF4444" className="animate-pulse" />
                      {/* Moving Dot */}
                      <circle r="4" fill="#10B981" stroke="#FFFFFF" strokeWidth="1.5">
                        <animateMotion path="M 25 50 Q 110 15 195 40" dur="2.5s" repeatCount="indefinite" />
                      </circle>
                    </svg>

                    <div className="flex items-center justify-between text-[7.5px] font-mono text-slate-400 z-10">
                      <span>Gate B Concourse</span>
                      <span>Target: Seat 44</span>
                    </div>
                  </div>

                  {/* LARGE ACTION BUTTON ("Send medical team" -> "Team on the way ✓") */}
                  <div className="pt-1">
                    <button
                      type="button"
                      className={`w-full py-3 px-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all duration-300 ${
                        isTeamDispatched
                          ? 'bg-emerald-600 text-white shadow-emerald-500/30'
                          : 'bg-[#2F6BFF] text-white shadow-blue-500/30 animate-pulse'
                      }`}
                    >
                      {isTeamDispatched ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-white" />
                          <span>Team on the way ✓</span>
                        </>
                      ) : (
                        <>
                          <Activity className="w-4 h-4 text-white" />
                          <span>Send medical team</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* ===================================================================
                  STEP 5: READY FOR YOUR STADIUM
                  - MyArena logo
                  - Large "Choose perspective" button
                  - 3 small icons for Medical, Security, Fire
                  =================================================================== */}
              {activeStep === 4 && (
                <div className="flex-1 flex flex-col justify-between p-3.5 bg-gradient-to-b from-blue-100/95 via-sky-50 to-emerald-100/95 text-center">
                  {/* MyArena Logo & Badge */}
                  <div className="space-y-1 pt-1">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#2F6BFF] to-[#10B981] text-white mx-auto flex items-center justify-center shadow-md">
                      <Shield className="w-6 h-6 text-white" strokeWidth={2.2} />
                    </div>
                    <h3 className="text-base font-serif-headline text-[#111827] font-bold">
                      MyArena
                    </h3>
                    <p className="text-[9px] text-[#526071]">
                      Dual-perspective stadium incident operations
                    </p>
                  </div>

                  {/* 3 Small Icons for Medical, Security, Fire */}
                  <div className="grid grid-cols-3 gap-1.5 py-1">
                    <div className="p-2 rounded-xl bg-white/95 border border-red-100 text-center shadow-2xs">
                      <HeartPulse className="w-4 h-4 text-[#FF5A5F] mx-auto mb-0.5" />
                      <span className="text-[8px] font-bold text-[#111827] block">Medical</span>
                    </div>
                    <div className="p-2 rounded-xl bg-white/95 border border-blue-100 text-center shadow-2xs">
                      <ShieldAlert className="w-4 h-4 text-[#2F6BFF] mx-auto mb-0.5" />
                      <span className="text-[8px] font-bold text-[#111827] block">Security</span>
                    </div>
                    <div className="p-2 rounded-xl bg-white/95 border border-orange-100 text-center shadow-2xs">
                      <Flame className="w-4 h-4 text-[#FF8A1F] mx-auto mb-0.5" />
                      <span className="text-[8px] font-bold text-[#111827] block">Fire</span>
                    </div>
                  </div>

                  {/* LARGE CHOOSE PERSPECTIVE BUTTON */}
                  <div className="pt-1">
                    <button
                      onClick={onNavigateToPerspective}
                      className="w-full py-3.5 px-4 rounded-2xl bg-[#2F6BFF] hover:bg-[#1E56E8] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xl shadow-blue-500/35 ring-2 ring-blue-300 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                    >
                      <span>Choose perspective</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                  <span className="text-[8px] font-mono text-[#526071] block">
                    Zero-latency crowd triage platform
                  </span>
                </div>
              )}

            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
