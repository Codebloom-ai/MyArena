import React, { useEffect, useState, useRef, useCallback } from 'react';
import { CssPhone3D } from './CssPhone3D';
import { HeroBigArena } from './HeroBigArena';
import { ArrowRight, Sparkles } from 'lucide-react';
import { SupportedLang } from '../data/triageTree';

interface HeroScrollStoryProps {
  onNavigateToPerspective: () => void;
  lang?: SupportedLang;
  onSelectLang?: (lang: SupportedLang) => void;
}

export const HeroScrollStory: React.FC<HeroScrollStoryProps> = ({
  onNavigateToPerspective,
  lang = 'fr',
  onSelectLang,
}) => {
  // Exactly 5 steps: 0, 1, 2, 3, 4
  const [activeStep, setActiveStep] = useState<number>(0);
  const [rotationY, setRotationY] = useState<number>(0);
  const [stepProgress, setStepProgress] = useState<number>(0); // 0 to 100%
  const [mergeCounter, setMergeCounter] = useState<number>(1);

  // Autoplay State Machine Refs
  const isPausedRef = useRef<boolean>(false);
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const stepStartTimeRef = useRef<number>(Date.now());
  const gestureLockRef = useRef<boolean>(false);
  const animFrameRef = useRef<number | null>(null);

  // Phone rotations per step:
  // 1: front (0°)
  // 2: turns 20°
  // 3: side profile (90°)
  // Phone rotations per step:
  // Step 1: front (0°)
  // Step 2: turns 20°
  // Step 3: three-quarter view (35° with slight tilt)
  // Step 4: gentle angle (15°)
  // Step 5: three-quarter (22°) then settles to front (0°)
  // STRICT RULE: Angles strictly stay between 0° and 35° (never beyond 40°)
  const applyRotationForStep = useCallback((stepIdx: number) => {
    if (stepIdx === 0) {
      setRotationY(0);
    } else if (stepIdx === 1) {
      setRotationY(20);
    } else if (stepIdx === 2) {
      setRotationY(35); // 35 degrees three-quarter view, screen always visible
    } else if (stepIdx === 3) {
      setRotationY(15);
    } else if (stepIdx === 4) {
      setRotationY(22);
      setTimeout(() => {
        setRotationY(0);
      }, 550);
    }
  }, []);

  // Step 3 live counter: ticks down from 8 to 1
  useEffect(() => {
    if (activeStep === 2) {
      setMergeCounter(8);
      const timers = [
        setTimeout(() => setMergeCounter(7), 400),
        setTimeout(() => setMergeCounter(6), 800),
        setTimeout(() => setMergeCounter(5), 1200),
        setTimeout(() => setMergeCounter(4), 1600),
        setTimeout(() => setMergeCounter(3), 2000),
        setTimeout(() => setMergeCounter(2), 2400),
        setTimeout(() => setMergeCounter(1), 2800),
      ];
      return () => {
        timers.forEach((t) => clearTimeout(t));
      };
    } else {
      setMergeCounter(1);
    }
  }, [activeStep]);

  // Handle user interaction: pause autoplay for 8 seconds, then resume
  const triggerUserPause = useCallback(() => {
    isPausedRef.current = true;
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
    }
    pauseTimeoutRef.current = setTimeout(() => {
      isPausedRef.current = false;
      stepStartTimeRef.current = Date.now();
    }, 8000);
  }, []);

  // Set step directly or via gesture
  const goToStep = useCallback((newStep: number, isUserAction = false) => {
    const clamped = Math.max(0, Math.min(4, newStep));
    setActiveStep(clamped);
    applyRotationForStep(clamped);
    stepStartTimeRef.current = Date.now();
    setStepProgress(0);

    if (isUserAction) {
      triggerUserPause();
    }
  }, [applyRotationForStep, triggerUserPause]);

  // AUTOPLAY STATE MACHINE:
  // Each step lasts 6 seconds (6000ms), independent of scroll/hover.
  // Shows progress as fill animation inside active dot.
  // After step 5, stops and keeps "Choose perspective" button highlighted.
  useEffect(() => {
    stepStartTimeRef.current = Date.now();

    const updateLoop = () => {
      if (activeStep >= 4) {
        setStepProgress(100);
        return;
      }

      if (!isPausedRef.current) {
        const elapsed = Date.now() - stepStartTimeRef.current;
        const progress = Math.min(100, (elapsed / 6000) * 100);
        setStepProgress(progress);

        if (elapsed >= 6000) {
          goToStep(activeStep + 1, false);
          return;
        }
      }

      animFrameRef.current = requestAnimationFrame(updateLoop);
    };

    animFrameRef.current = requestAnimationFrame(updateLoop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [activeStep, goToStep]);

  // Cleanup pause timeout
  useEffect(() => {
    return () => {
      if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
    };
  }, []);

  // GESTURE CONTROLS:
  // Wheel, Swipe, Arrow keys move one step per gesture, and pause autoplay for 8s
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (gestureLockRef.current) return;
      if (Math.abs(e.deltaY) > 25) {
        gestureLockRef.current = true;
        if (e.deltaY > 0) {
          goToStep(activeStep + 1, true);
        } else {
          goToStep(activeStep - 1, true);
        }
        setTimeout(() => {
          gestureLockRef.current = false;
        }, 650);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        goToStep(activeStep + 1, true);
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        goToStep(activeStep - 1, true);
      }
    };

    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (gestureLockRef.current) return;
      const touchEndY = e.changedTouches[0].clientY;
      const diffY = touchStartY - touchEndY;
      if (Math.abs(diffY) > 35) {
        gestureLockRef.current = true;
        if (diffY > 0) {
          goToStep(activeStep + 1, true);
        } else {
          goToStep(activeStep - 1, true);
        }
        setTimeout(() => {
          gestureLockRef.current = false;
        }, 650);
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [activeStep, goToStep]);

  // HIGH-IMPACT EDITORIAL COPY:
  // Headlines: max 6 words. Body lines: max 14 words.
  const stepTexts = [
    {
      stepNumber: '01',
      en: { headline: 'One tap. Your seat is known.', body: 'Block 104, Gate B scanned instantly.' },
      fr: { headline: 'Un geste. Votre siège est localisé.', body: 'Bloc 104, Porte B identifiés à la seconde.' },
      ar: { headline: 'نقرة واحدة. مقعدك محدد بدقة.', body: 'تم مسح البلوك 104 والبوابة ب على الفور.' },
    },
    {
      stepNumber: '02',
      en: { headline: 'Help talks to you. Right away.', body: 'Instant triage guidance in Arabic, French, and English.' },
      fr: { headline: "L'IA vous écoute. Dès la première seconde.", body: "Guidage d'urgence immédiat en arabe, français et anglais." },
      ar: { headline: 'النجدة تتحدث إليك. فوراً ودون تأخير.', body: 'إرشاد فوري للفرز بالدارجة، الفرنسية والإنجليزية.' },
    },
    {
      stepNumber: '03',
      en: { headline: 'Eight alerts. One incident.', body: 'Crowd reports merge into a single actionable ticket.' },
      fr: { headline: 'Huit signalements. Un seul incident.', body: 'Les alertes fusionnent en un ticket unique sans doublon.' },
      ar: { headline: 'ثمانية بلاغات. حادث واحد.', body: 'دمج تقارير الجمهور تلقائياً في تذكرة واحدة دون تكرار.' },
    },
    {
      stepNumber: '04',
      en: { headline: 'The right team, already moving.', body: 'Live dispatch with exact route and real-time arrival.' },
      fr: { headline: 'La bonne équipe, déjà en route.', body: 'Déploiement direct avec itinéraire exact et suivi temps réel.' },
      ar: { headline: 'الفريق المناسب، يتحرك فوراً.', body: 'إرسال مباشر مع المسار الدقيق ووقت وصول لحظي.' },
    },
    {
      stepNumber: '05',
      en: { headline: 'Built for 80,000 supporters.', body: 'Two perspectives. Choose how you want to experience MyArena.' },
      fr: { headline: 'Conçu pour 80 000 supporters.', body: 'Deux perspectives. Choisissez votre mode de test MyArena.' },
      ar: { headline: 'صُمم لـ 80,000 متفرج في الملعب.', body: 'منظوران حيان. اختر كيف تود تجربة منصة MyArena.' },
    },
  ];

  const currentStepData = stepTexts[activeStep];
  const localizedContent = currentStepData[lang] || currentStepData.fr;
  const isArabic = lang === 'ar';

  const ctaLabel = {
    fr: 'Choisir la perspective',
    ar: 'اختيار المنظور',
    en: 'Choose perspective',
  }[lang] || 'Choose perspective';

  const skipIntroText = {
    fr: 'Passer l’intro',
    ar: 'تخطي المقدمة',
    en: 'Skip intro',
  }[lang] || 'Skip intro';

  return (
    <div 
      className="relative w-full h-screen h-[100dvh] max-h-screen select-none overflow-hidden"
      dir="ltr" // Coordinate baseline preserved
    >
      {/* =========================================================================
          STACKING LEVEL 0: PAGE GRADIENT BACKGROUND
          ========================================================================= */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-85">
        <div className="absolute -top-32 -left-32 w-[650px] h-[650px] rounded-full bg-gradient-to-tr from-blue-300/35 via-cyan-200/25 to-transparent blur-3xl" />
        <div className="absolute top-1/4 -right-24 w-[750px] h-[750px] rounded-full bg-gradient-to-bl from-emerald-200/35 via-sky-200/25 to-transparent blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-rose-200/20 via-blue-200/25 to-transparent blur-3xl" />
      </div>

      {/* =========================================================================
          STACKING LEVEL 1: THE ARENA MAP (FILLING THE STAGE BEHIND THEM)
          - Shifted visual center ~12% to the right and 6% up
          - Scale slightly reduced so North Stand, Pitch, and Gate B stay visible between text & phone
          - 100% visible, no overflow hidden cutting it
          ========================================================================= */}
      <div className="absolute inset-0 z-[1] flex items-center justify-center pointer-events-none overflow-visible">
        <HeroBigArena
          activeStep={activeStep}
          mergeCounter={mergeCounter}
          isArabic={isArabic}
        />
      </div>

      {/* =========================================================================
          STACKING LEVEL 2: SOFT GRADIENT FADE OVER TEXT ZONE
          - Ensures no map lines run through title or paragraph
          ========================================================================= */}
      <div 
        className={`absolute inset-y-0 ${
          isArabic 
            ? 'right-0 bg-gradient-to-l from-[#E2EDFA]/95 via-[#E2EDFA]/80 to-transparent' 
            : 'left-0 bg-gradient-to-r from-[#E2EDFA]/95 via-[#E2EDFA]/80 to-transparent'
        } w-[46%] pointer-events-none z-[2]`}
      />

      {/* =========================================================================
          INTEGRATED COMPOSITION CONTROLS (NO STICKY TOP BAR)
          - Top right: floating glass pill for language switcher (AR / FR / EN)
          - Bottom right: plain text "Skip intro" link with small arrow
          ========================================================================= */}
      {/* 1. Top Right: Language Switcher Floating Glass Pill */}
      <div className="absolute top-5 sm:top-6 right-6 sm:right-10 z-50 flex items-center bg-white/85 backdrop-blur-md p-1 rounded-full border border-black/[0.08] shadow-sm text-xs font-bold pointer-events-auto">
        {(['ar', 'fr', 'en'] as const).map((l) => (
          <button
            key={l}
            onClick={() => onSelectLang && onSelectLang(l)}
            className={`px-3 py-1 rounded-full uppercase tracking-wider transition-all cursor-pointer ${
              lang === l
                ? 'bg-[#2F6BFF] text-white shadow-xs font-bold'
                : 'text-[#526071] hover:text-[#111827]'
            }`}
          >
            {l === 'ar' ? 'العربية' : l.toUpperCase()}
          </button>
        ))}
      </div>

      {/* 2. Bottom Right: "Skip intro" Plain Text Link with small arrow */}
      <div className="absolute bottom-6 right-6 sm:right-10 z-50 pointer-events-auto">
        <button
          onClick={onNavigateToPerspective}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#526071] hover:text-[#111827] px-2 py-1 transition-colors cursor-pointer group"
        >
          <span>{skipIntroText}</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* =========================================================================
          THREE CLEAR ZONES CONTAINER (100VH, VERTICALLY BALANCED)
          - Left zone: Text (~38% width)
          - Center-right zone: Phone (~30% width)
          - In Arabic: Text on the right side, stage not mirrored
          ========================================================================= */}
      <div 
        className={`relative w-full h-full max-w-[1360px] mx-auto px-6 sm:px-10 lg:px-14 flex items-center justify-between z-10 ${
          isArabic ? 'flex-row-reverse' : 'flex-row'
        }`}
      >
        
        {/* =======================================================================
            ZONE 1: TEXT ZONE (~38% WIDTH) - VERTICALLY CENTERED IN STAGE
            - Giant permanent "MyArena" title: ~76px desktop, 48px mobile
            - 24px spacing between elements (mb-6)
            - Headline max 6 words, body line max 14 words
            - "Choose perspective" button under text on every step (Step 5 glowing)
            ======================================================================= */}
        <div 
          className={`w-full max-w-[420px] lg:max-w-[460px] z-[4] flex flex-col justify-center my-auto ${
            isArabic ? 'text-right' : 'text-left'
          }`}
          dir={isArabic ? 'rtl' : 'ltr'}
        >
          {/* 1. GIANT PERMANENT "MyArena" TITLE (76px desktop, 48px mobile) - NO CLIPPED DESCENDER */}
          <div className="select-none mb-6 overflow-visible">
            <h1 className="inline-block font-serif-headline text-[48px] sm:text-[62px] lg:text-[76px] font-bold tracking-tight leading-[1.2] pb-[0.15em] bg-gradient-to-r from-[#2F6BFF] via-[#0284C7] to-[#10B981] bg-clip-text text-transparent drop-shadow-xs">
              MyArena
            </h1>
          </div>

          {/* 2. STEP LINE: step number (01 to 05) with thin progress line (24px mb) */}
          <div className={`flex items-center gap-3 mb-6 ${isArabic ? 'justify-end' : 'justify-start'}`}>
            <span className="text-xs font-mono font-bold text-[#2F6BFF] tracking-wider">
              {currentStepData.stepNumber} / 05
            </span>
            <div className="w-28 h-[2.5px] rounded-full bg-slate-300/80 overflow-hidden relative">
              <div
                className="absolute inset-y-0 bg-gradient-to-r from-[#2F6BFF] to-[#10B981] rounded-full transition-all duration-150"
                style={{
                  width: `${stepProgress}%`,
                  [isArabic ? 'right' : 'left']: 0,
                }}
              />
            </div>
          </div>

          {/* 3. HEADLINE & BODY (24px mb, smooth swap while title stays fixed) */}
          <div key={activeStep} className="space-y-2 mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300 min-h-[96px]">
            <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-serif-headline text-[#0F172A] font-bold tracking-tight leading-[1.18]">
              {localizedContent.headline}
            </h2>
            <p className="text-sm sm:text-base text-[#475569] leading-relaxed font-medium">
              {localizedContent.body}
            </p>
          </div>

          {/* 4. CHOOSE PERSPECTIVE BUTTON (Under text on left on EVERY step) */}
          <div className="pt-1">
            {activeStep === 4 ? (
              <button
                onClick={onNavigateToPerspective}
                className="w-full sm:w-auto py-3.5 px-6 rounded-2xl bg-[#2F6BFF] hover:bg-[#1E56E8] text-white font-bold text-base flex items-center justify-center gap-2.5 shadow-xl shadow-blue-500/35 ring-4 ring-blue-400/40 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer animate-pulse"
              >
                <span>{ctaLabel}</span>
                <ArrowRight className={`w-5 h-5 ${isArabic ? 'rotate-180' : ''}`} />
              </button>
            ) : (
              <button
                onClick={onNavigateToPerspective}
                className="w-full sm:w-auto py-3 px-5 rounded-2xl bg-white/95 hover:bg-neutral-50 text-[#111827] border border-black/10 shadow-sm hover:shadow-md font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
              >
                <span>{ctaLabel}</span>
                <ArrowRight className={`w-4 h-4 text-[#2F6BFF] ${isArabic ? 'rotate-180' : ''}`} />
              </button>
            )}
          </div>
        </div>

        {/* =======================================================================
            ZONE 2: PHONE ZONE (~30% WIDTH)
            - Fits inside stage with 4vh margin top and bottom (max height 88vh)
            - Never cropped at the bottom
            - Centered vertically in its zone with ZERO vertical drift
            - Screen content fully visible
            ======================================================================= */}
        <div className="relative w-[32%] min-w-[280px] max-w-[340px] h-full flex items-center justify-center pointer-events-none z-[3]">
          <div 
            className="relative pointer-events-auto flex items-center justify-center"
            style={{
              maxHeight: '88vh',
              transform: 'scale(min(1, calc(88vh / 575px)))',
              transformOrigin: 'center center',
            }}
          >
            <CssPhone3D
              rotationY={rotationY}
              activeStep={activeStep}
              mergedCount={mergeCounter}
              lang={lang}
              onNavigateToPerspective={onNavigateToPerspective}
              isArabic={isArabic}
            />
          </div>
        </div>

      </div>

      {/* =========================================================================
          BOTTOM PROGRESS DOTS (FILL ANIMATION PER STEP)
          - Centered at the bottom of the stage
          ========================================================================= */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto select-none">
        <div className="flex items-center gap-2.5 p-1.5 px-3 rounded-full bg-white/90 backdrop-blur-sm border border-slate-200/90 shadow-sm">
          {stepTexts.map((s, idx) => {
            const isActive = activeStep === idx;
            const isPast = activeStep > idx;

            return (
              <button
                key={idx}
                onClick={() => goToStep(idx, true)}
                className="relative h-2.5 rounded-full overflow-hidden transition-all duration-300 cursor-pointer bg-slate-200/80 hover:bg-slate-300"
                style={{
                  width: isActive ? '46px' : '10px',
                }}
                title={`Step ${s.stepNumber}`}
                aria-label={`Step ${s.stepNumber}`}
              >
                {/* Active Dot Fill Progress Bar */}
                <div
                  className="absolute inset-y-0 left-0 bg-[#2F6BFF] rounded-full"
                  style={{
                    width: isPast
                      ? '100%'
                      : isActive
                      ? `${stepProgress}%`
                      : '0%',
                    transition: isActive ? 'width 60ms linear' : 'width 250ms ease',
                  }}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
