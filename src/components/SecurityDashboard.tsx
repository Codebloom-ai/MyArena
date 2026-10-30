import React, { useState } from 'react';
import { 
  Incident, 
  IncidentStatus, 
  Severity, 
  StadiumZone, 
  RawReport,
  REGISTERED_TICKET 
} from '../types/stadium';
import { StadiumMap } from './StadiumMap';
import { 
  ShieldAlert, 
  HeartPulse, 
  Flame, 
  Users, 
  AlertTriangle, 
  Clock, 
  Layers, 
  CheckCircle2, 
  Filter, 
  FileText, 
  Search, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Radio, 
  TrendingUp, 
  MapPin, 
  Mic, 
  Shield, 
  Zap, 
  Play, 
  Pause, 
  RotateCcw, 
  X, 
  Send, 
  ArrowRight,
  FlameKindling,
  Activity
} from 'lucide-react';
import { SimulationReportItem } from '../data/simulationData';
import { SupportedLang } from '../data/triageTree';

export interface DemoControlsProps {
  isSimulating: boolean;
  simulationProgress: number;
  totalReports: number;
  simSpeedMultiplier: number;
  onStartSimulation: (speedMultiplier?: number) => void;
  onPauseSimulation: () => void;
  onResetSimulation: () => void;
  latestSimReport: SimulationReportItem | null;
  activeClusterCounts: {
    northFight: number;
    gateBFaint: number;
    parkingSmoke: number;
  };
  // Requirement 4: Crowd Surge Simulation support
  isCrowdSurgeActive?: boolean;
  crowdSurgeProgress?: number;
  totalCrowdSurgeReports?: number;
  onStartCrowdSurge?: (speedMultiplier?: number) => void;
  onPauseCrowdSurge?: () => void;
  onResetCrowdSurge?: () => void;
}

interface SecurityDashboardProps {
  incidents: Incident[];
  totalRawReportsCount: number;
  rawReports?: RawReport[];
  onUpdateIncidentStatus: (id: string, status: IncidentStatus) => void;
  onGenerateReport: () => void;
  selectedZone: StadiumZone | 'All';
  onSelectZone: (zone: StadiumZone | 'All') => void;
  onOperatorSendMessage?: (incidentId: string, message: string) => void;
  demoProps?: DemoControlsProps;
  onChangePerspective?: () => void;
  lang?: SupportedLang;
  onSelectLang?: (lang: SupportedLang) => void;
}

export const SecurityDashboard: React.FC<SecurityDashboardProps> = ({
  incidents,
  totalRawReportsCount,
  rawReports = [],
  onUpdateIncidentStatus,
  onGenerateReport,
  selectedZone,
  onSelectZone,
  onOperatorSendMessage,
  demoProps,
  onChangePerspective,
  lang = 'fr',
  onSelectLang,
}) => {
  const [selectedSeverity, setSelectedSeverity] = useState<Severity | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDrawerIncidentId, setSelectedDrawerIncidentId] = useState<string | null>(null);
  const [operatorInputText, setOperatorInputText] = useState('');
  const [isDemoControlsOpen, setIsDemoControlsOpen] = useState(false);
  const [isTakeOverActive, setIsTakeOverActive] = useState(false);
  
  // Requirement 4: Toggle "Raw alerts vs. merged"
  const [viewMode, setViewMode] = useState<'merged' | 'raw'>('merged');
  // Requirement 4: Collapsible "Other incidents"
  const [isOtherIncidentsExpanded, setIsOtherIncidentsExpanded] = useState(false);

  const t = {
    fr: {
      title: "Centre des Opérations de Sécurité",
      subtitle: "Triage multilingue automatique, déduplication en temps réel & suivi des stadiers",
      changePerspective: "← Changer de perspective",
      genReport: "Générer rapport d'incident (FR)",
      reportsReceived: "Signalements Reçus",
      incidentsAfterMerge: "Incidents Après Fusion",
      duplicateAvoided: "Doublons Évités",
      avgResponseTime: "Temps Moyen 1ère Réponse",
      noIncidentsHeadline: "Aucun incident pour le moment. Ouvrez la vue Supporter et appuyez sur Médical.",
      noIncidentsDesc: "Dès qu'un supporter signale un événement, le regroupement intelligent, le siège exact et le dialogue IA apparaîtront ici.",
      openSupporter: "Ouvrir la vue Supporter",
      inspectBtn: "Inspecter le direct",
      takeOver: "Prendre la main",
      operatorPlaceholder: "Tapez une instruction directe au supporter...",
      reportsMerged: "rapports fusionnés",
      whyMerged: "Justification de la fusion IA",
      fullTranscript: "Transcription intégrale de l'interphone",
      simFootnote: "* Données des billets et incidents simulées pour la démonstration.",
      rawVsMerged: "Alertes brutes vs. fusionnées",
      mergedView: "Incidents fusionnés",
      rawFeedView: "Flux brut en direct",
      otherIncidents: "Autres incidents",
      simulateCrowdSurge: "Simuler afflux de foule",
      crowdSurgeBadge: "Simulation",
      matchSimulation: "Simulation de Match",
    },
    ar: {
      title: "مركز عمليات وإدارة الأمان",
      subtitle: "فرز آلي متعدد اللغات، دمج البلاغات في الوقت الفعلي وتوجيه فرق التدخل",
      changePerspective: "← تغيير المنظور",
      genReport: "توليد تقرير أمني رسمي (FR)",
      reportsReceived: "البلاغات المستلمة",
      incidentsAfterMerge: "الحوادث بعد الدمج",
      duplicateAvoided: "الإنذارات المتكررة المتفادية",
      avgResponseTime: "متوسط وقت أول استجابة",
      noIncidentsHeadline: "لا توجد حوادث حالياً. افتح واجهة المشجع واضغط على طبي.",
      noIncidentsDesc: "بمجرد إرسال المشجع لأي بلاغ، سيظهر التقييم الآلي الفوري ورقم المقعد وسجل المحادثة هنا.",
      openSupporter: "فتح واجهة المشجع",
      inspectBtn: "معاينة البلاغ المباشر",
      takeOver: "التدخل المباشر",
      operatorPlaceholder: "اكتب تعليمات مباشرة للمشجع...",
      reportsMerged: "بلاغات مدمجة",
      whyMerged: "سبب الدمج والربط الآلي",
      fullTranscript: "سجل المحادثة الكامل عبر مكبر الطوارئ",
      simFootnote: "* بيانات التذاكر والمحاكاة وهمية لأغراض العرض التوضيحي.",
      rawVsMerged: "البلاغات الخام مقابل المدمجة",
      mergedView: "الحوادث المدمجة",
      rawFeedView: "البث المباشر للبلاغات",
      otherIncidents: "حوادث أخرى",
      simulateCrowdSurge: "محاكاة تدفق جماهيري",
      crowdSurgeBadge: "محاكاة",
      matchSimulation: "محاكاة المباراة",
    },
    en: {
      title: "Security Operations Center",
      subtitle: "Automated multilingual crowd triage, live deduplication & responder tracking",
      changePerspective: "← Change perspective",
      genReport: "Generate Incident Report",
      reportsReceived: "Reports Received",
      incidentsAfterMerge: "Incidents After Merge",
      duplicateAvoided: "Duplicate Alerts Avoided",
      avgResponseTime: "Avg Time to First Response",
      noIncidentsHeadline: "No incidents yet. Open the supporter view and tap Medical.",
      noIncidentsDesc: "The moment a supporter taps an emergency button, live triage, exact seat, and intercom updates appear here immediately.",
      openSupporter: "Open Supporter View",
      inspectBtn: "Inspect Live Intercom",
      takeOver: "Take Over",
      operatorPlaceholder: "Type command instruction to fan...",
      reportsMerged: "reports merged",
      whyMerged: "AI Deduplication Reasoning",
      fullTranscript: "Full Intercom Transcript",
      simFootnote: "* Ticket data is simulated for demo.",
      rawVsMerged: "Raw alerts vs. merged",
      mergedView: "Merged Incidents",
      rawFeedView: "Raw Alerts Feed",
      otherIncidents: "Other incidents",
      simulateCrowdSurge: "Simulate crowd surge",
      crowdSurgeBadge: "Simulation",
      matchSimulation: "Match Simulation",
    },
  }[lang] || {
    title: "Security Operations Center",
    subtitle: "Automated multilingual crowd triage, live deduplication & responder tracking",
    changePerspective: "← Change perspective",
    genReport: "Generate Incident Report (FR)",
    reportsReceived: "Reports Received",
    incidentsAfterMerge: "Incidents After Merge",
    duplicateAvoided: "Duplicate Alerts Avoided",
    avgResponseTime: "Avg Time to First Response",
    noIncidentsHeadline: "No incidents yet. Open the supporter view and tap Medical.",
    noIncidentsDesc: "The moment a supporter taps an emergency button, live triage, exact seat, and intercom updates appear here immediately.",
    openSupporter: "Open Supporter View",
    inspectBtn: "Inspect Live Intercom",
    takeOver: "Take Over",
    operatorPlaceholder: "Type command instruction to fan...",
    reportsMerged: "reports merged",
    whyMerged: "AI Deduplication Reasoning",
    fullTranscript: "Full Intercom Transcript",
    simFootnote: "* Ticket data is simulated for demo.",
    rawVsMerged: "Raw alerts vs. merged",
    mergedView: "Merged Incidents",
    rawFeedView: "Raw Alerts Feed",
    otherIncidents: "Other incidents",
    simulateCrowdSurge: "Simulate crowd surge",
    crowdSurgeBadge: "Simulation",
    matchSimulation: "Match Simulation",
  };

  const severityRank: Record<Severity, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  };

  // Requirement 4: Incidents sorted strictly by priority
  const filteredIncidents = incidents
    .filter((inc) => {
      if (selectedZone !== 'All' && inc.zone !== selectedZone) return false;
      if (selectedSeverity !== 'All' && inc.severity !== selectedSeverity) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesSummary = (inc.dashboard_summary || inc.english_summary || '').toLowerCase().includes(q);
        const matchesType = inc.incident_type.toLowerCase().includes(q);
        const matchesZone = inc.zone.toLowerCase().includes(q);
        const matchesSeat = (inc.exactSeat || '').toLowerCase().includes(q);
        const matchesRaw = inc.rawReports.some((r) => r.text.toLowerCase().includes(q));
        if (!matchesSummary && !matchesType && !matchesZone && !matchesSeat && !matchesRaw) return false;
      }
      return true;
    })
    .sort((a, b) => {
      const rankDiff = severityRank[b.severity] - severityRank[a.severity];
      if (rankDiff !== 0) return rankDiff;
      const countDiff = b.reportCount - a.reportCount;
      if (countDiff !== 0) return countDiff;
      return new Date(b.lastReportTime).getTime() - new Date(a.lastReportTime).getTime();
    });

  // Requirement 4: Top 5 expanded, rest collapsed under "Other incidents"
  const topFiveIncidents = filteredIncidents.slice(0, 5);
  const otherIncidents = filteredIncidents.slice(5);

  // Requirement 4: Live Counters ticking in real time
  const duplicateAlertsAvoided = Math.max(0, totalRawReportsCount - incidents.length);
  const deduplicationRatio =
    totalRawReportsCount > 0
      ? Math.round((duplicateAlertsAvoided / totalRawReportsCount) * 100)
      : 0;

  // Average time to first response calculation
  const totalResponseMs = incidents.reduce((acc, curr) => acc + (curr.timeToFirstResponseMs || 140), 0);
  const avgResponseMs = incidents.length > 0 ? Math.round(totalResponseMs / incidents.length) : 140;
  const avgResponseTimeFormatted = avgResponseMs < 1000 ? `${avgResponseMs}ms` : `${(avgResponseMs / 1000).toFixed(1)}s`;

  const getIncidentIcon = (type: string) => {
    switch (type) {
      case 'fight':
        return <ShieldAlert className="w-4 h-4 text-red-600" strokeWidth={1.5} />;
      case 'medical_emergency':
        return <HeartPulse className="w-4 h-4 text-emerald-600" strokeWidth={1.5} />;
      case 'fire_smoke':
        return <Flame className="w-4 h-4 text-orange-600" strokeWidth={1.5} />;
      case 'overcrowding':
        return <Users className="w-4 h-4 text-amber-600" strokeWidth={1.5} />;
      default:
        return <AlertTriangle className="w-4 h-4 text-slate-600" strokeWidth={1.5} />;
    }
  };

  const getSeverityBadge = (severity: Severity) => {
    switch (severity) {
      case 'critical':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-red-50 text-red-700 border border-red-200">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping" />
            CRITICAL
          </span>
        );
      case 'high':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-orange-50 text-orange-700 border border-orange-200">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-600" />
            HIGH
          </span>
        );
      case 'medium':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
            MEDIUM
          </span>
        );
      case 'low':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
            LOW
          </span>
        );
    }
  };

  const getSeverityDot = (severity: Severity) => {
    switch (severity) {
      case 'critical':
        return <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping inline-block" title="Critical Severity" />;
      case 'high':
        return <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" title="High Severity" />;
      case 'medium':
        return <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" title="Medium Severity" />;
      case 'low':
      default:
        return <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block" title="Low Severity" />;
    }
  };

  const getTimeElapsed = (isoTime: string) => {
    const diffSec = Math.floor((Date.now() - new Date(isoTime).getTime()) / 1000);
    if (diffSec < 60) return 'Just now';
    const mins = Math.floor(diffSec / 60);
    return `${mins}m ago`;
  };

  const selectedDrawerIncident = incidents.find((i) => i.id === selectedDrawerIncidentId) || null;

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className="w-full space-y-5">
      {/* =========================================================================
          SINGLE IN-PAGE GLASS HEADER CARD (EXACTLY ONE SWITCHER & ONE PERSPECTIVE BUTTON)
          ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 frosted-panel p-4 sm:p-5 rounded-3xl shadow-sm border border-white/90">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2F6BFF] animate-pulse" />
            <h2 className="text-xl font-serif-headline text-[#111827] tracking-tight font-bold">
              {t.title}
            </h2>
          </div>
          <p className="text-xs text-[#526071] mt-0.5 font-medium">
            {t.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onChangePerspective && (
            <button
              onClick={onChangePerspective}
              className="text-xs text-[#526071] hover:text-[#111827] flex items-center gap-1.5 font-medium transition-colors cursor-pointer py-2 px-3.5 rounded-full bg-white/90 border border-black/[0.08] hover:bg-white shadow-2xs active:scale-95"
            >
              <span>{t.changePerspective}</span>
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

          {/* Generate Incident Report Button */}
          <button
            onClick={onGenerateReport}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#2F6BFF] hover:bg-[#1E56E8] text-white font-semibold text-xs shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>{t.genReport}</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          REQUIREMENT 4: LIVE COUNTERS ON THE DASHBOARD TOP STRIP
          - Reports received
          - Incidents after merge
          - Duplicate alerts avoided
          - Average time to first response
          (Ticking in real time!)
          ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: Reports Received */}
        <div className="p-4 rounded-3xl frosted-panel shadow-sm flex items-center justify-between transition-all duration-200 hover:shadow-md">
          <div>
            <span className="text-[11px] font-mono font-semibold text-[#526071] uppercase tracking-wider block">
              {t.reportsReceived}
            </span>
            <div className="text-2xl sm:text-3xl font-serif-headline text-[#111827] mt-1 font-tabular font-bold flex items-center gap-2">
              <span>{totalRawReportsCount}</span>
              {totalRawReportsCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
              )}
            </div>
            <span className="text-[10px] text-[#526071] font-mono">Live supporter submissions</span>
          </div>
          <div className="p-3 rounded-2xl bg-blue-50 text-[#2F6BFF] border border-blue-100">
            <Radio className="w-5 h-5 animate-pulse" strokeWidth={1.5} />
          </div>
        </div>

        {/* KPI 2: Incidents After Merge */}
        <div className="p-4 rounded-3xl frosted-panel shadow-sm flex items-center justify-between transition-all duration-200 hover:shadow-md">
          <div>
            <span className="text-[11px] font-mono font-semibold text-[#526071] uppercase tracking-wider block">
              {t.incidentsAfterMerge}
            </span>
            <div className="text-2xl sm:text-3xl font-serif-headline text-[#2F6BFF] mt-1 font-tabular font-bold">
              {incidents.length}
            </div>
            <span className="text-[10px] text-[#526071] font-mono">Actionable response missions</span>
          </div>
          <div className="p-3 rounded-2xl bg-indigo-50 text-[#2F6BFF] border border-indigo-100">
            <Layers className="w-5 h-5" strokeWidth={1.5} />
          </div>
        </div>

        {/* KPI 3: Duplicate Alerts Avoided */}
        <div className="p-4 rounded-3xl frosted-panel shadow-sm flex items-center justify-between transition-all duration-200 hover:shadow-md">
          <div>
            <span className="text-[11px] font-mono font-semibold text-[#526071] uppercase tracking-wider block">
              {t.duplicateAvoided}
            </span>
            <div className="text-2xl sm:text-3xl font-serif-headline text-emerald-600 mt-1 font-tabular font-bold">
              {duplicateAlertsAvoided}
            </div>
            <span className="text-[10px] text-emerald-700 font-mono font-bold">
              {deduplicationRatio > 0 ? `${deduplicationRatio}% noise reduction` : '100% deduplicated'}
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 text-[#10B981] border border-emerald-100">
            <TrendingUp className="w-5 h-5" strokeWidth={1.5} />
          </div>
        </div>

        {/* KPI 4: Average Time to First Response */}
        <div className="p-4 rounded-3xl frosted-panel shadow-sm flex items-center justify-between transition-all duration-200 hover:shadow-md">
          <div>
            <span className="text-[11px] font-mono font-semibold text-[#526071] uppercase tracking-wider block">
              {t.avgResponseTime}
            </span>
            <div className="text-2xl sm:text-3xl font-serif-headline text-[#111827] mt-1 font-tabular font-bold">
              {avgResponseTimeFormatted}
            </div>
            <span className="text-[10px] text-[#526071] font-mono">Instant zero-latency triage</span>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100">
            <Clock className="w-5 h-5" strokeWidth={1.5} />
          </div>
        </div>
      </div>

      {/* Main Content: Map + Live Incident List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: 2D SVG Stadium Map */}
        <div className="lg:col-span-7 space-y-4">
          <StadiumMap
            incidents={incidents}
            selectedZone={selectedZone}
            onSelectZone={onSelectZone}
          />

          <div className="frosted-panel rounded-2xl p-3 text-xs text-[#526071] flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#2F6BFF] shrink-0" strokeWidth={1.5} />
              <span>Select any stand or gate on the map to filter live alerts.</span>
            </div>
            {selectedZone !== 'All' && (
              <button
                onClick={() => onSelectZone('All')}
                className="text-[#2F6BFF] hover:text-[#1E56E8] font-semibold underline text-xs ml-2 shrink-0 cursor-pointer"
              >
                Clear Filter ({selectedZone})
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Live Incident Queue & Before/After Toggle */}
        <div className="lg:col-span-5 space-y-4">
          {/* ===================================================================
              REQUIREMENT 4: BEFORE / AFTER TOGGLE ("Raw alerts vs. merged")
              Shows flood of individual alerts vs. collapsed 5 cards
              =================================================================== */}
          <div className="p-1.5 frosted-panel rounded-2xl border border-black/[0.08] shadow-xs flex items-center gap-1.5">
            <button
              onClick={() => setViewMode('merged')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'merged'
                  ? 'bg-[#2F6BFF] text-white shadow-xs font-bold'
                  : 'bg-white/70 text-[#526071] hover:text-[#111827] hover:bg-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{t.mergedView} ({incidents.length})</span>
            </button>

            <button
              onClick={() => setViewMode('raw')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'raw'
                  ? 'bg-[#2F6BFF] text-white shadow-xs font-bold'
                  : 'bg-white/70 text-[#526071] hover:text-[#111827] hover:bg-white'
              }`}
            >
              <Radio className="w-3.5 h-3.5 animate-pulse text-amber-300" />
              <span>{t.rawFeedView} ({totalRawReportsCount})</span>
            </button>
          </div>

          {/* Controls Bar: Search & Severity Filters */}
          <div className="frosted-panel rounded-3xl p-4 space-y-3 shadow-sm">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-[#526071]" strokeWidth={1.5} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search alerts, seats, Virage Nord, Gate B..."
                className="w-full bg-white/80 border border-black/[0.08] focus:border-[#2F6BFF] rounded-xl pl-9 pr-3 py-2 text-xs text-[#111827] placeholder:text-[#526071] focus:outline-none shadow-xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-[#526071] hover:text-[#111827] text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-black/[0.06]">
              <span className="text-[#526071] font-medium flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-[#526071]" strokeWidth={1.5} />
                Severity:
              </span>
              <div className="flex items-center gap-1">
                {(['All', 'critical', 'high', 'medium', 'low'] as const).map((sev) => {
                  const isActive = selectedSeverity === sev;
                  return (
                    <button
                      key={sev}
                      onClick={() => setSelectedSeverity(sev)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-medium transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#2F6BFF] text-white shadow-xs font-bold'
                          : 'bg-white/80 text-[#526071] hover:text-[#111827] border border-black/[0.06]'
                      }`}
                    >
                      {sev === 'All' ? 'All' : sev.toUpperCase()}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ===================================================================
              VIEW MODE A: RAW ALERTS SCROLLING STACK (Flood of incoming reports)
              =================================================================== */}
          {viewMode === 'raw' ? (
            <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
              <div className="p-2.5 rounded-2xl bg-amber-50/90 border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
                <span className="font-semibold flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-amber-600 animate-ping" />
                  Showing unmerged raw supporter submissions:
                </span>
                <span className="font-mono font-bold text-amber-800">{rawReports.length} Total</span>
              </div>

              {rawReports.length === 0 ? (
                <div className="frosted-panel rounded-3xl p-8 text-center text-[#526071] space-y-2 shadow-sm">
                  <Radio className="w-8 h-8 text-[#2F6BFF] mx-auto animate-pulse" />
                  <p className="text-sm font-bold text-[#111827]">Awaiting live incoming reports</p>
                  <p className="text-xs text-[#526071]">Run the crowd surge simulation to see the live alert flood.</p>
                </div>
              ) : (
                rawReports.map((report, idx) => (
                  <div
                    key={report.id || idx}
                    className="p-3 rounded-2xl bg-white/95 border border-black/[0.06] shadow-2xs space-y-1 animate-in fade-in slide-in-from-top-1 duration-150"
                  >
                    <div className="flex items-center justify-between text-[8px] font-mono text-[#526071]">
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[#2F6BFF] font-bold border border-blue-100">
                        {report.language || 'Multilingual'}
                      </span>
                      <span>{report.timestamp ? getTimeElapsed(report.timestamp) : 'Live'}</span>
                    </div>

                    <p className="text-xs font-semibold text-[#111827] leading-snug">
                      "{report.text}"
                    </p>

                    <div className="flex items-center justify-between text-[8.5px] font-mono text-[#526071] pt-1 border-t border-black/[0.04]">
                      <span className="flex items-center gap-1 text-[#2F6BFF] font-semibold">
                        <MapPin className="w-2.5 h-2.5" />
                        {report.exactSeat || report.zone}
                      </span>
                      <span className="text-slate-400">Source: {report.reporterSource || 'app'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            /* ===================================================================
                VIEW MODE B: MERGED INCIDENTS (Top 5 expanded, rest collapsed)
                =================================================================== */
            <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
              {incidents.length === 0 ? (
                /* EMPTY STATE STRICTLY AS SPECIFIED IN REQUIREMENT 5 */
                <div className="frosted-panel rounded-3xl p-8 sm:p-10 text-center text-[#526071] space-y-4 shadow-sm border border-white/80">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#2F6BFF] flex items-center justify-center mx-auto border border-blue-200 shadow-sm">
                    <Shield className="w-7 h-7" strokeWidth={1.5} />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-base font-bold text-[#111827]">
                      {t.noIncidentsHeadline}
                    </h3>
                    <p className="text-xs text-[#526071] max-w-sm mx-auto leading-relaxed">
                      {t.noIncidentsDesc}
                    </p>
                  </div>
                  {onChangePerspective && (
                    <button
                      onClick={onChangePerspective}
                      className="px-4 py-2 rounded-full bg-[#2F6BFF] hover:bg-[#1E56E8] text-white text-xs font-semibold shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>{t.openSupporter}</span>
                    </button>
                  )}
                </div>
              ) : filteredIncidents.length === 0 ? (
                <div className="frosted-panel rounded-3xl p-8 text-center text-[#526071] space-y-2 shadow-sm">
                  <CheckCircle2 className="w-8 h-8 text-[#2F6BFF] mx-auto" strokeWidth={1.5} />
                  <p className="text-sm font-bold text-[#111827]">No active incidents in this filter</p>
                  <button
                    onClick={() => {
                      onSelectZone('All');
                      setSelectedSeverity('All');
                      setSearchQuery('');
                    }}
                    className="mt-2 text-xs text-[#2F6BFF] hover:underline font-semibold"
                  >
                    Reset all filters
                  </button>
                </div>
              ) : (
                <>
                  {/* TOP 5 EXPANDED INCIDENTS (Requirement 4) */}
                  {topFiveIncidents.map((incident) => {
                    const timeAgo = getTimeElapsed(incident.firstReportTime);
                    const displaySeat = incident.exactSeat || REGISTERED_TICKET.fullSeatString;

                    return (
                      <div
                        key={incident.id}
                        onClick={() => setSelectedDrawerIncidentId(incident.id)}
                        className="rounded-3xl frosted-panel p-4 sm:p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:border-[#2F6BFF]/30 cursor-pointer space-y-3 animate-in fade-in"
                      >
                        {/* Card Header: Type Icon, Exact Seat, Severity Dot, Report Count, Time Elapsed, One Action Button */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2.5 rounded-2xl bg-white/90 border border-black/[0.06] shadow-2xs">
                              {getIncidentIcon(incident.incident_type)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                {getSeverityDot(incident.severity)}
                                <h4 className="text-sm font-bold text-[#111827] tracking-tight">
                                  {incident.incident_type.toUpperCase().replace('_', ' ')}
                                </h4>
                              </div>
                              {/* Exact Seat */}
                              <div className="text-xs font-semibold text-[#111827] mt-0.5 flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-[#2F6BFF] shrink-0" strokeWidth={1.5} />
                                <span className="truncate max-w-[210px]">{displaySeat}</span>
                              </div>
                            </div>
                          </div>

                          {/* Right: Report Count & Time Ago */}
                          <div className="flex flex-col items-end gap-1">
                            <span className="px-2.5 py-0.5 rounded-full bg-black/[0.04] text-[#111827] text-[11px] font-mono font-bold">
                              {incident.reportCount} {t.reportsMerged}
                            </span>
                            <span className="text-[10px] font-mono text-[#526071] flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {timeAgo}
                            </span>
                          </div>
                        </div>

                        {/* Live Summary from Gemini */}
                        <div className="p-2.5 rounded-2xl bg-white/70 border border-black/[0.05] text-xs text-[#111827] leading-relaxed">
                          <div className="text-[10px] font-mono uppercase text-[#2F6BFF] font-bold mb-0.5 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> Live Steward & AI Summary
                          </div>
                          <p className="line-clamp-2">
                            {incident.dashboard_summary || incident.english_summary}
                          </p>
                        </div>

                        {/* Single Action Button */}
                        <div className="flex items-center justify-between pt-1 border-t border-black/[0.05]">
                          <div className="text-[11px] font-medium text-[#526071] flex items-center gap-1">
                            <Shield className="w-3.5 h-3.5 text-[#2F6BFF]" />
                            <span>{incident.assignedTeam || 'Medical / Security Team'}</span>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDrawerIncidentId(incident.id);
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-[#2F6BFF] hover:bg-[#1E56E8] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                          >
                            <Radio className="w-3 h-3" />
                            <span>{t.inspectBtn}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* REST COLLAPSED UNDER "OTHER INCIDENTS" (Requirement 4) */}
                  {otherIncidents.length > 0 && (
                    <div className="pt-2 border-t border-black/[0.06]">
                      <button
                        onClick={() => setIsOtherIncidentsExpanded(!isOtherIncidentsExpanded)}
                        className="w-full py-2.5 px-4 rounded-2xl bg-white/80 hover:bg-white border border-black/[0.08] text-xs font-bold text-[#526071] hover:text-[#111827] flex items-center justify-between shadow-2xs transition-all cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <Layers className="w-4 h-4 text-[#2F6BFF]" />
                          <span>{t.otherIncidents} ({otherIncidents.length})</span>
                        </span>
                        {isOtherIncidentsExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>

                      {isOtherIncidentsExpanded && (
                        <div className="space-y-3 mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                          {otherIncidents.map((incident) => {
                            const timeAgo = getTimeElapsed(incident.firstReportTime);
                            const displaySeat = incident.exactSeat || REGISTERED_TICKET.fullSeatString;

                            return (
                              <div
                                key={incident.id}
                                onClick={() => setSelectedDrawerIncidentId(incident.id)}
                                className="rounded-3xl frosted-panel p-4 shadow-sm opacity-90 hover:opacity-100 transition-all cursor-pointer space-y-2 border border-black/[0.06]"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    {getIncidentIcon(incident.incident_type)}
                                    <span className="text-xs font-bold text-[#111827]">
                                      {incident.incident_type.toUpperCase().replace('_', ' ')}
                                    </span>
                                  </div>
                                  <span className="text-[10px] font-mono text-[#526071]">
                                    {incident.reportCount} reports • {timeAgo}
                                  </span>
                                </div>
                                <p className="text-xs text-[#526071] line-clamp-1">
                                  {incident.dashboard_summary || incident.english_summary}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* DRAWER / MODAL: FULL TRANSCRIPT, WHY MERGED, TAKE OVER, GENERATE REPORT */}
      {selectedDrawerIncident && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-xl h-full bg-white/95 backdrop-blur-2xl shadow-2xl p-6 flex flex-col justify-between overflow-y-auto space-y-5 animate-in slide-in-from-right duration-300">
            {/* Drawer Top Header */}
            <div className="flex items-start justify-between pb-4 border-b border-black/[0.08]">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-blue-50 border border-blue-100 text-[#2F6BFF]">
                  {getIncidentIcon(selectedDrawerIncident.incident_type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-[#111827]">
                      {selectedDrawerIncident.incident_type.toUpperCase().replace('_', ' ')}
                    </h3>
                    {getSeverityBadge(selectedDrawerIncident.severity)}
                  </div>
                  <div className="text-xs font-bold text-[#2F6BFF] mt-0.5 flex items-center gap-1 font-mono">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{selectedDrawerIncident.exactSeat || REGISTERED_TICKET.fullSeatString}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedDrawerIncidentId(null)}
                className="p-2 rounded-full hover:bg-neutral-100 text-[#526071] hover:text-[#111827] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions Bar inside Drawer */}
            <div className="flex flex-wrap items-center gap-2 p-3 bg-neutral-50 rounded-2xl border border-black/[0.06]">
              {/* Take Over Operator Button */}
              <button
                onClick={() => setIsTakeOverActive(!isTakeOverActive)}
                className={`flex-1 py-2 px-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  isTakeOverActive
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-white hover:bg-neutral-100 text-[#111827] border border-black/[0.08]'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>{isTakeOverActive ? 'Takeover Mode Active' : t.takeOver}</span>
              </button>

              {/* Generate Incident Report */}
              <button
                onClick={onGenerateReport}
                className="flex-1 py-2 px-3.5 rounded-xl bg-[#2F6BFF] hover:bg-[#1E56E8] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition-all"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{t.genReport}</span>
              </button>

              {/* Status Toggle */}
              {selectedDrawerIncident.status !== 'resolved' ? (
                <button
                  onClick={() => onUpdateIncidentStatus(selectedDrawerIncident.id, 'resolved')}
                  className="py-2 px-3 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Resolve</span>
                </button>
              ) : (
                <button
                  onClick={() => onUpdateIncidentStatus(selectedDrawerIncident.id, 'active')}
                  className="py-2 px-3 rounded-xl bg-neutral-200 text-[#111827] text-xs font-bold cursor-pointer"
                >
                  Reopen
                </button>
              )}
            </div>

            {/* Operator Take-Over Input Form */}
            {isTakeOverActive && (
              <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 space-y-2 animate-in fade-in">
                <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-amber-600" />
                  Operator Override: Message broadcasted directly to supporter screen
                </span>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (operatorInputText.trim() && onOperatorSendMessage) {
                      onOperatorSendMessage(selectedDrawerIncident.id, operatorInputText.trim());
                      setOperatorInputText('');
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={operatorInputText}
                    onChange={(e) => setOperatorInputText(e.target.value)}
                    placeholder={t.operatorPlaceholder}
                    className="flex-1 bg-white border border-amber-300 rounded-xl px-3.5 py-2 text-xs text-[#111827] placeholder:text-amber-800/60 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!operatorInputText.trim()}
                    className="p-2 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}

            {/* Live Model Summary & Why Merged */}
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-100 space-y-1">
                <span className="text-[11px] font-mono font-bold text-[#2F6BFF] uppercase tracking-wider block">
                  Live Steward & AI Summary
                </span>
                <p className="text-xs text-[#111827] leading-relaxed">
                  {selectedDrawerIncident.dashboard_summary || selectedDrawerIncident.english_summary}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-purple-50/80 border border-purple-100 space-y-1">
                <span className="text-[11px] font-mono font-bold text-purple-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  {t.whyMerged}
                </span>
                <p className="text-xs text-purple-900 leading-relaxed font-medium">
                  {selectedDrawerIncident.why_merged}
                </p>
              </div>
            </div>

            {/* Full Chronological Transcript */}
            <div className="flex-1 space-y-2 border-t border-black/[0.08] pt-4">
              <span className="text-xs font-bold text-[#111827] flex items-center gap-1.5">
                <Mic className="w-4 h-4 text-[#2F6BFF]" />
                {t.fullTranscript} ({selectedDrawerIncident.chatMessages.length} messages)
              </span>

              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1 text-xs">
                {selectedDrawerIncident.chatMessages.length === 0 ? (
                  <p className="text-xs text-[#526071] italic">No intercom messages recorded yet.</p>
                ) : (
                  selectedDrawerIncident.chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-2xl ${
                        msg.sender === 'ai'
                          ? 'bg-blue-50 text-blue-900 border border-blue-200/60 ml-3'
                          : msg.sender === 'operator'
                          ? 'bg-amber-50 text-amber-900 border border-amber-300 ml-3'
                          : 'bg-neutral-100 text-[#111827] mr-3'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono font-bold mb-1 opacity-75">
                        <span>
                          {msg.sender === 'ai' ? '🤖 MyArena AI Steward' : msg.sender === 'operator' ? '🛡️ Security Operator' : '👤 Supporter at ' + (selectedDrawerIncident.exactSeat || 'Seat')}
                        </span>
                        <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                      </div>
                      <p className="leading-relaxed">{msg.text}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-2 text-center text-[10px] text-[#526071] italic">
              {t.simFootnote}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          DEMO CONTROLS FLOATING CARD (WITH SECOND BUTTON: "Simulate crowd surge")
          Requirement 4: In demo controls add a second button, "Simulate crowd surge" (label it "Simulation")
          ========================================================================= */}
      {demoProps && (
        <div className="fixed bottom-5 right-5 z-40">
          {!isDemoControlsOpen ? (
            <button
              onClick={() => setIsDemoControlsOpen(true)}
              className="px-4 py-2.5 rounded-full bg-white/95 hover:bg-white text-[#111827] border border-black/[0.1] shadow-xl hover:shadow-2xl flex items-center gap-2 font-bold text-xs transition-all active:scale-95 cursor-pointer group backdrop-blur-md"
            >
              <Zap className="w-4 h-4 text-[#2F6BFF]" />
              <span>Simulations</span>
              <span className="px-2 py-0.5 rounded-full bg-[#2F6BFF]/10 text-[#2F6BFF] font-mono text-[10px] font-bold">
                {demoProps.isCrowdSurgeActive
                  ? `${demoProps.crowdSurgeProgress || 0}/${demoProps.totalCrowdSurgeReports || 120}`
                  : `${demoProps.simulationProgress}/${demoProps.totalReports}`}
              </span>
              <ChevronUp className="w-3.5 h-3.5 text-[#526071] group-hover:text-[#111827]" />
            </button>
          ) : (
            <div className="w-[350px] sm:w-[400px] frosted-panel bg-white/95 backdrop-blur-2xl rounded-3xl p-4 sm:p-5 shadow-2xl border border-white/90 space-y-4 animate-in slide-in-from-bottom-5 duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-black/[0.06]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#2F6BFF]/10 text-[#2F6BFF] flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#111827]">Stadium Demo Controls</h4>
                    <span className="text-[10px] text-[#526071]">Real-time multilingual crowd ingestion</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsDemoControlsOpen(false)}
                    className="p-1.5 rounded-full text-[#526071] hover:text-[#111827] hover:bg-black/[0.05] transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* TWO DISTINCT SIMULATION BUTTONS (Requirement 4) */}
              <div className="space-y-2">
                {/* BUTTON 2: SIMULATE CROWD SURGE (LABEL IT "Simulation") */}
                <div className="p-3 rounded-2xl bg-gradient-to-r from-orange-50 via-amber-50 to-rose-50 border border-orange-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full bg-orange-600 text-white font-mono text-[9px] font-bold tracking-wider">
                        {t.crowdSurgeBadge}
                      </span>
                      <strong className="text-xs text-[#111827]">{t.simulateCrowdSurge}</strong>
                    </div>
                    <span className="text-[10px] font-mono text-orange-700 font-bold">
                      {demoProps.crowdSurgeProgress || 0}/{demoProps.totalCrowdSurgeReports || 120}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#526071] leading-tight">
                    Injects 120 reports in 30s across 8 seats & blocks in Darija, Arabic, French & English → 5 incidents.
                  </p>
                  
                  <div className="flex items-center gap-2 pt-1">
                    {!demoProps.isCrowdSurgeActive ? (
                      <button
                        onClick={() => demoProps.onStartCrowdSurge && demoProps.onStartCrowdSurge(demoProps.simSpeedMultiplier)}
                        className="flex-1 py-2 px-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/20 active:scale-95 transition-all cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>{(demoProps.crowdSurgeProgress || 0) > 0 ? 'Resume Surge' : t.simulateCrowdSurge}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => demoProps.onPauseCrowdSurge && demoProps.onPauseCrowdSurge()}
                        className="flex-1 py-2 px-3 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                      >
                        <Pause className="w-3.5 h-3.5 fill-current" />
                        <span>Pause Surge</span>
                      </button>
                    )}

                    <button
                      onClick={() => demoProps.onResetCrowdSurge && demoProps.onResetCrowdSurge()}
                      className="p-2 rounded-xl bg-white border border-black/[0.08] hover:bg-neutral-100 text-[#526071] cursor-pointer"
                      title="Reset Crowd Surge"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* BUTTON 1: MATCH SIMULATION (25 reports) */}
                <div className="p-3 rounded-2xl bg-neutral-50 border border-black/[0.06] space-y-2">
                  <div className="flex items-center justify-between">
                    <strong className="text-xs text-[#111827]">{t.matchSimulation}</strong>
                    <span className="text-[10px] font-mono text-[#526071]">
                      {demoProps.simulationProgress}/{demoProps.totalReports}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {!demoProps.isSimulating ? (
                      <button
                        onClick={() => demoProps.onStartSimulation(demoProps.simSpeedMultiplier)}
                        className="flex-1 py-1.5 px-3 rounded-xl bg-[#2F6BFF] hover:bg-[#1E56E8] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>{demoProps.simulationProgress > 0 ? 'Resume Match' : 'Simulate Match'}</span>
                      </button>
                    ) : (
                      <button
                        onClick={demoProps.onPauseSimulation}
                        className="flex-1 py-1.5 px-3 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                      >
                        <Pause className="w-3 h-3 fill-current" />
                        <span>Pause Match</span>
                      </button>
                    )}

                    <button
                      onClick={demoProps.onResetSimulation}
                      className="p-1.5 rounded-xl bg-white border border-black/[0.08] hover:bg-neutral-100 text-[#526071] cursor-pointer"
                      title="Reset Match Simulation"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Speed Multipliers */}
              <div className="flex items-center justify-between text-xs pt-1 border-t border-black/[0.06]">
                <span className="text-[11px] text-[#526071] font-medium">Speed:</span>
                <div className="flex items-center bg-black/[0.04] p-0.5 rounded-full border border-black/[0.08] text-[11px]">
                  <button
                    onClick={() => {
                      if (demoProps.isCrowdSurgeActive && demoProps.onStartCrowdSurge) demoProps.onStartCrowdSurge(1);
                      else demoProps.onStartSimulation(1);
                    }}
                    className={`px-2.5 py-1 rounded-full font-medium transition-all cursor-pointer ${
                      demoProps.simSpeedMultiplier === 1
                        ? 'bg-white text-[#111827] font-bold shadow-xs'
                        : 'text-[#526071] hover:text-[#111827]'
                    }`}
                  >
                    1x
                  </button>
                  <button
                    onClick={() => {
                      if (demoProps.isCrowdSurgeActive && demoProps.onStartCrowdSurge) demoProps.onStartCrowdSurge(3);
                      else demoProps.onStartSimulation(3);
                    }}
                    className={`px-2.5 py-1 rounded-full font-medium transition-all cursor-pointer ${
                      demoProps.simSpeedMultiplier === 3
                        ? 'bg-white text-[#111827] font-bold shadow-xs'
                        : 'text-[#526071] hover:text-[#111827]'
                    }`}
                  >
                    3x
                  </button>
                  <button
                    onClick={() => {
                      if (demoProps.isCrowdSurgeActive && demoProps.onStartCrowdSurge) demoProps.onStartCrowdSurge(10);
                      else demoProps.onStartSimulation(10);
                    }}
                    className={`px-2.5 py-1 rounded-full font-medium transition-all cursor-pointer ${
                      demoProps.simSpeedMultiplier === 10
                        ? 'bg-white text-[#2F6BFF] font-bold shadow-xs'
                        : 'text-[#526071] hover:text-[#111827]'
                    }`}
                  >
                    ⚡ Turbo
                  </button>
                </div>
              </div>

              <div className="text-[10px] text-[#526071] text-center italic pt-1 border-t border-black/[0.05]">
                {t.simFootnote}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SecurityDashboard;
