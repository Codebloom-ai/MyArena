import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Shield, 
  ArrowRight, 
  ArrowLeft,
  HeartPulse, 
  ShieldAlert, 
  Flame, 
  CheckCircle2, 
  Layers, 
  Radio, 
  Sparkles,
  Ticket 
} from 'lucide-react';
import { SupportedLang } from '../data/triageTree';
import { REGISTERED_TICKET } from '../types/stadium';

interface RoleChoiceSectionProps {
  onSelectRole: (role: 'supporter' | 'dashboard') => void;
  lang?: SupportedLang;
  onNavigateToIntro?: () => void;
  onSelectLang?: (l: SupportedLang) => void;
}

export const RoleChoiceSection: React.FC<RoleChoiceSectionProps> = ({
  onSelectRole,
  lang = 'fr',
  onNavigateToIntro,
  onSelectLang,
}) => {
  // Mini preview animation states
  const [ticketScanned, setTicketScanned] = useState(true);
  const [radarMergedCount, setRadarMergedCount] = useState(8);

  useEffect(() => {
    // Ticket scan re-check cycle
    const ticketInterval = setInterval(() => {
      setTicketScanned(false);
      setTimeout(() => setTicketScanned(true), 400);
    }, 4000);

    // Radar merging cycle: 8 -> 4 -> 1 -> 8
    const radarInterval = setInterval(() => {
      setRadarMergedCount((prev) => (prev === 8 ? 4 : prev === 4 ? 1 : 8));
    }, 2200);

    return () => {
      clearInterval(ticketInterval);
      clearInterval(radarInterval);
    };
  }, []);

  const t = {
    fr: {
      tag: "EXPÉRIENCE EN DIRECT",
      headline: "Choisissez votre perspective",
      subtitle: "Explorez les deux faces d'un même moteur de sécurité opérationnel.",
      supporterTitle: "Je suis supporter",
      supporterDesc: "Signalez une urgence en un clic et recevez des consignes vocales rassurantes.",
      supporterBtn: "Ouvrir la vue Supporter",
      securityTitle: "Je suis au poste de sécurité",
      securityDesc: "Visualisez les alertes dédupliquées sur le radar du stade et coordonnez les secours.",
      securityBtn: "Ouvrir le tableau de bord",
      introBtn: "← Intro",
    },
    ar: {
      tag: "تجربة حية وتفاعلية",
      headline: "اختر منظورك للتجربة",
      subtitle: "اكتشف الجانبين لنظام أمان واستجابة موحد للملاعب.",
      supporterTitle: "أنا مشجع في المدرجات",
      supporterDesc: "أبلغ عن طارئ بلمسة واحدة واحصل على إرشادات صوتية ذكية فورية.",
      supporterBtn: "فتح واجهة المشجع",
      securityTitle: "أنا مسؤول في غرفة العمليات",
      securityDesc: "تابع الإنذارات المدمجة على رادار الملعب ووجه فرق التدخل بسرعة.",
      securityBtn: "فتح لوحة تحكم الأمن",
      introBtn: "← العرض التقديمي",
    },
    en: {
      tag: "LIVE EXPERIENCE",
      headline: "Choose your perspective",
      subtitle: "Experience both sides of a single real-time safety engine.",
      supporterTitle: "I'm a supporter",
      supporterDesc: "Report an emergency with one tap and get reassuring AI voice safety guidance.",
      supporterBtn: "Open Supporter View",
      securityTitle: "I'm security staff",
      securityDesc: "Monitor real-time deduplicated alerts on the radar and dispatch response teams.",
      securityBtn: "Open Security Dashboard",
      introBtn: "← Intro",
    },
  }[lang] || {
    tag: "LIVE EXPERIENCE",
    headline: "Choose your perspective",
    subtitle: "Experience both sides of a single real-time safety engine.",
    supporterTitle: "I'm a supporter",
    supporterDesc: "Report an emergency with one tap and get reassuring AI voice safety guidance.",
    supporterBtn: "Open Supporter View",
    securityTitle: "I'm security staff",
    securityDesc: "Monitor real-time deduplicated alerts on the radar and dispatch response teams.",
    securityBtn: "Open Security Dashboard",
    introBtn: "← Intro",
  };

  return (
    <div 
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      className="relative min-h-screen py-8 px-4 sm:px-6 lg:px-8 flex flex-col justify-between items-center select-none overflow-hidden"
    >
      
      {/* Background radial gradient layers */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        <div
          className="absolute -top-[10%] -left-[10%] w-[65vw] h-[65vw] rounded-full opacity-40 will-change-transform"
          style={{
            background: 'radial-gradient(circle, rgba(47,107,255,0.3) 0%, rgba(220,235,255,0) 70%)',
          }}
        />
        <div
          className="absolute -bottom-[10%] -right-[10%] w-[70vw] h-[70vw] rounded-full opacity-45 will-change-transform"
          style={{
            background: 'radial-gradient(circle, rgba(78,204,163,0.3) 0%, rgba(255,179,138,0.25) 50%, rgba(211,245,232,0) 70%)',
          }}
        />
      </div>

      {/* SINGLE IN-PAGE GLASS HEADER CARD */}
      <div className="w-full max-w-5xl mx-auto frosted-panel p-4 sm:p-5 rounded-3xl shadow-sm flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-[#2F6BFF] text-white flex items-center justify-center shadow-md shadow-blue-500/20">
            <Shield className="w-5 h-5 text-white" strokeWidth={2} />
          </div>
          <div>
            <h1 className="inline-block text-lg font-serif-headline text-[#111827] tracking-tight font-bold leading-[1.2] pb-[0.08em]">
              MyArena
            </h1>
            <p className="text-[11px] text-[#526071] hidden sm:block">
              AI Stadium Safety & Incident Response
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {onNavigateToIntro && (
            <button
              onClick={onNavigateToIntro}
              className="px-3.5 py-1.5 rounded-full bg-white/90 hover:bg-neutral-100 border border-black/[0.08] text-xs font-semibold text-[#526071] hover:text-[#111827] shadow-xs cursor-pointer transition-all active:scale-95"
            >
              {t.introBtn}
            </button>
          )}

          {/* AR / FR / EN switcher */}
          {onSelectLang && (
            <div className="flex items-center bg-white/90 p-1 rounded-full border border-black/[0.08] shadow-xs text-xs font-bold">
              {(['ar', 'fr', 'en'] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => onSelectLang(l)}
                  className={`px-2.5 py-1 rounded-full uppercase tracking-wider transition-all cursor-pointer ${
                    lang === l
                      ? 'bg-[#2F6BFF] text-white shadow-xs font-bold'
                      : 'text-[#526071] hover:text-[#111827]'
                  }`}
                >
                  {l === 'ar' ? 'العربية' : l.toUpperCase()}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl w-full mx-auto space-y-10 text-center my-auto">
        {/* Header */}
        <div className="space-y-3 max-w-2xl mx-auto animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-black/[0.08] shadow-xs text-xs font-mono font-bold text-[#2F6BFF] uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-[#2F6BFF] animate-pulse" />
            <span>{t.tag}</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-serif-headline text-[#111827] font-bold tracking-tight">
            {t.headline}
          </h2>

          <p className="text-base sm:text-lg text-[#526071]">
            {t.subtitle}
          </p>
        </div>

        {/* TWO LARGE FROSTED GLASS CARDS WITH LIVE MINI PREVIEWS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto pt-2">
          
          {/* CARD 1: SUPPORTER */}
          <div className="group relative rounded-3xl p-7 sm:p-8 bg-white/85 border border-white/70 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between text-left space-y-6">
            
            {/* Top Badge & Icon */}
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#2F6BFF] to-[#123FC4] text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                <Users className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono font-bold text-[#2F6BFF] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                FAN INTERCOM
              </span>
            </div>

            {/* LIVE ANIMATED MINI PREVIEW: Mini Phone Simulation */}
            <div className="relative w-full h-[180px] rounded-2xl bg-gradient-to-b from-[#111827] to-[#1F2937] p-3 flex flex-col justify-between overflow-hidden shadow-inner border border-black/10">
              
              {/* Ticket Auto-scanned Banner with check */}
              <div className="flex items-center justify-between text-[10px] font-mono text-neutral-300 bg-white/10 px-2.5 py-1.5 rounded-xl border border-white/10">
                <div className="flex items-center gap-1.5 truncate">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">{REGISTERED_TICKET.fullSeatString}</span>
                </div>
                <span className="text-emerald-400 text-[9px] font-bold shrink-0 ml-1">LOCKED</span>
              </div>

              {/* 3 mini emergency buttons */}
              <div className="grid grid-cols-3 gap-2 my-auto">
                <div className="p-2 rounded-xl bg-red-500/20 border border-red-500/40 text-center flex flex-col items-center justify-center animate-pulse">
                  <HeartPulse className="w-4 h-4 text-red-400 mb-0.5" />
                  <span className="text-[9px] font-bold text-red-200">Medical</span>
                </div>
                <div className="p-2 rounded-xl bg-blue-500/20 border border-blue-500/40 text-center flex flex-col items-center justify-center">
                  <ShieldAlert className="w-4 h-4 text-blue-400 mb-0.5" />
                  <span className="text-[9px] font-bold text-blue-200">Security</span>
                </div>
                <div className="p-2 rounded-xl bg-orange-500/20 border border-orange-500/40 text-center flex flex-col items-center justify-center">
                  <Flame className="w-4 h-4 text-orange-400 mb-0.5" />
                  <span className="text-[9px] font-bold text-orange-200">Fire/Crush</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[9px] font-mono text-neutral-400">
                <span className="text-emerald-400">● 1-Tap Intercom Active</span>
                <span>Darija • French • Arabic</span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <h3 className="text-xl font-serif-headline text-[#111827] font-bold">
                {t.supporterTitle}
              </h3>
              <p className="text-sm text-[#526071] leading-relaxed">
                {t.supporterDesc}
              </p>
            </div>

            {/* Button */}
            <button
              onClick={() => onSelectRole('supporter')}
              className="relative overflow-hidden w-full py-3.5 px-6 rounded-2xl bg-[#2F6BFF] hover:bg-[#1E56E8] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 active:scale-95 transition-all cursor-pointer group-hover:shadow-blue-500/35"
            >
              <span>{t.supporterBtn}</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          {/* CARD 2: SECURITY STAFF */}
          <div className="group relative rounded-3xl p-7 sm:p-8 bg-white/85 border border-white/70 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between text-left space-y-6">
            
            {/* Top Badge & Icon */}
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#111827] to-[#1F2937] text-white flex items-center justify-center shadow-md">
                <Shield className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                COMMAND DASHBOARD
              </span>
            </div>

            {/* LIVE ANIMATED MINI PREVIEW: Mini Stadium Radar */}
            <div className="relative w-full h-[180px] rounded-2xl bg-gradient-to-b from-[#090D16] to-[#111827] p-3 flex flex-col justify-between overflow-hidden border border-white/20 shadow-inner">
              {/* Radar sweep lines & concentric rings */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                <div className="w-36 h-36 rounded-full border border-emerald-400" />
                <div className="absolute w-24 h-24 rounded-full border border-emerald-400" />
                <div className="absolute w-12 h-12 rounded-full border border-emerald-400" />
                <div className="absolute w-full h-[1px] bg-emerald-400" />
                <div className="absolute h-full w-[1px] bg-emerald-400" />
              </div>

              {/* Top radar metrics */}
              <div className="relative z-10 flex items-center justify-between text-[10px] font-mono text-neutral-300">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  Live Stadium Operations
                </span>
                <span className="text-neutral-400">{REGISTERED_TICKET.stand} • {REGISTERED_TICKET.block}</span>
              </div>

              {/* Pulsing incident markers & Deduplication Counter */}
              <div className="relative z-10 my-auto flex items-center justify-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded-full bg-red-500 animate-ping" />
                  <div className="w-3 h-3 rounded-full bg-blue-500 animate-ping" style={{ animationDelay: '500ms' }} />
                  <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" style={{ animationDelay: '1000ms' }} />
                </div>

                <div className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-center">
                  <div className="text-[8.5px] font-mono uppercase text-blue-300">Reports Merged</div>
                  <div className="text-xl font-mono font-bold text-white">
                    {radarMergedCount} → 1
                  </div>
                </div>
              </div>

              <div className="relative z-10 flex items-center justify-between text-[9px] font-mono text-neutral-400">
                <span className="text-blue-300">Deduplicated 87.5%</span>
                <span className="text-emerald-400 font-bold">1-click dispatch</span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <h3 className="text-xl font-serif-headline text-[#111827] font-bold">
                {t.securityTitle}
              </h3>
              <p className="text-sm text-[#526071] leading-relaxed">
                {t.securityDesc}
              </p>
            </div>

            {/* Button */}
            <button
              onClick={() => onSelectRole('dashboard')}
              className="relative overflow-hidden w-full py-3.5 px-6 rounded-2xl bg-[#111827] hover:bg-black text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all cursor-pointer group-hover:shadow-neutral-900/40"
            >
              <span>{t.securityBtn}</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>

        </div>
      </div>

      <div className="text-xs text-[#526071] mt-6">
        <span>Grand Stade de Casablanca • MyArena Safety OS</span>
      </div>
    </div>
  );
};
