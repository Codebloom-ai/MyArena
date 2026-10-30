import React from 'react';
import { 
  Play, 
  RotateCcw, 
  Pause, 
  Sparkles,
  Flame,
  ShieldAlert,
  HeartPulse
} from 'lucide-react';
import { SimulationReportItem } from '../data/simulationData';

export interface DemoSimulationBarProps {
  isSimulating: boolean;
  simulationProgress: number; // 0 to 25
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
  isCrowdSurgeActive?: boolean;
  crowdSurgeProgress?: number;
  totalCrowdSurgeReports?: number;
  onStartCrowdSurge?: (speedMultiplier?: number) => void;
  onPauseCrowdSurge?: () => void;
  onResetCrowdSurge?: () => void;
}

export const DemoSimulationBar: React.FC<DemoSimulationBarProps> = ({
  isSimulating,
  simulationProgress,
  totalReports,
  simSpeedMultiplier,
  onStartSimulation,
  onPauseSimulation,
  onResetSimulation,
  latestSimReport,
  activeClusterCounts,
  isCrowdSurgeActive,
  crowdSurgeProgress = 0,
  totalCrowdSurgeReports = 120,
  onStartCrowdSurge,
  onPauseCrowdSurge,
  onResetCrowdSurge,
}) => {
  const percentage = Math.round((simulationProgress / totalReports) * 100);

  return (
    <div className="w-full bg-white border border-black/[0.08] rounded-2xl p-4 sm:p-5 shadow-sm space-y-3.5 relative overflow-hidden">
      {/* Bar Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-black/[0.04] text-[#111412] border border-black/[0.06]">
            <Sparkles className="w-4 h-4 text-[#1F9D55]" strokeWidth={1.5} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#111412] tracking-tight">
                Stadium Simulation Controls
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-[#1F9D55] border border-emerald-200">
                AI Multilingual Deduplication
              </span>
            </div>
            <p className="text-xs text-[#6B7280]">
              Simulates real-time crowd alerts in Darija, Arabic, French & English collapsing into actionable incidents
            </p>
          </div>
        </div>

        {/* Buttons: Match Simulation + Crowd Surge Simulation (Requirement 4) */}
        <div className="flex flex-wrap items-center gap-2">
          {/* BUTTON 2: SIMULATE CROWD SURGE (LABEL IT "Simulation") */}
          {onStartCrowdSurge && (
            !isCrowdSurgeActive ? (
              <button
                onClick={() => onStartCrowdSurge(simSpeedMultiplier)}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-orange-600 hover:bg-orange-700 text-white font-medium text-xs shadow-sm transition-all cursor-pointer"
              >
                <span className="px-1.5 py-0.2 rounded-xs bg-black/25 text-[9px] font-mono uppercase tracking-wider">
                  Simulation
                </span>
                <span>Simulate crowd surge</span>
              </button>
            ) : (
              <button
                onClick={onPauseCrowdSurge}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-900 hover:bg-black text-white font-medium text-xs shadow-sm transition-all cursor-pointer"
              >
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause Surge</span>
              </button>
            )
          )}

          {/* BUTTON 1: MATCH SIMULATION */}
          {!isSimulating ? (
            <button
              onClick={() => onStartSimulation(1)}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#1F9D55] hover:bg-[#168244] text-white font-medium text-xs shadow-sm transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Match Simulation</span>
            </button>
          ) : (
            <button
              onClick={onPauseSimulation}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#111412] hover:bg-black text-white font-medium text-xs shadow-sm transition-all cursor-pointer"
            >
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>Pause</span>
            </button>
          )}

          {/* Speed Controls */}
          <div className="flex items-center bg-[#FAFAF7] p-0.5 rounded-full border border-black/[0.08] text-xs">
            <button
              onClick={() => {
                if (isCrowdSurgeActive && onStartCrowdSurge) onStartCrowdSurge(1);
                else onStartSimulation(1);
              }}
              className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                simSpeedMultiplier === 1
                  ? 'bg-white text-[#111412] font-semibold shadow-2xs'
                  : 'text-[#6B7280] hover:text-[#111412]'
              }`}
              title="1x Real-time"
            >
              1x
            </button>
            <button
              onClick={() => {
                if (isCrowdSurgeActive && onStartCrowdSurge) onStartCrowdSurge(3);
                else onStartSimulation(3);
              }}
              className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                simSpeedMultiplier === 3
                  ? 'bg-white text-[#111412] font-semibold shadow-2xs'
                  : 'text-[#6B7280] hover:text-[#111412]'
              }`}
              title="3x Fast mode"
            >
              3x Fast
            </button>
            <button
              onClick={() => {
                if (isCrowdSurgeActive && onStartCrowdSurge) onStartCrowdSurge(8);
                else onStartSimulation(8);
              }}
              className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                simSpeedMultiplier === 8
                  ? 'bg-white text-[#111412] font-semibold shadow-2xs'
                  : 'text-[#6B7280] hover:text-[#111412]'
              }`}
              title="Instant burst for presentation"
            >
              Turbo
            </button>
          </div>

          {/* Reset Button */}
          <button
            onClick={() => {
              onResetSimulation();
              if (onResetCrowdSurge) onResetCrowdSurge();
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white hover:bg-[#FAFAF7] text-[#6B7280] hover:text-[#111412] text-xs font-medium border border-black/[0.08] transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Progress Bar & Live Stats */}
      <div className="space-y-1.5 relative z-10">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#111412] font-mono font-tabular">
              {simulationProgress} / {totalReports} reports
            </span>
            <span className="text-[#8E8E86]">•</span>
            <span className="text-[#1F9D55] font-semibold">
              Merging live into 3 primary incidents
            </span>
          </div>
          <span className="text-[#6B7280] font-mono text-[11px] font-tabular">{percentage}%</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 rounded-full bg-[#FAFAF7] border border-black/[0.06] overflow-hidden">
          <div
            className="h-full bg-[#1F9D55] transition-all duration-300 rounded-full"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Cluster Merge Telemetry Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 relative z-10 text-xs">
        {/* Cluster 1: Fight */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAFAF7] border border-black/[0.06]">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-600" strokeWidth={1.5} />
            <div>
              <span className="font-bold text-[#111412] block text-[11px]">North Stand Fight</span>
              <span className="text-[10px] text-[#6B7280]">Virage Nord Ultras</span>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full font-mono font-bold text-xs bg-red-50 text-red-700 border border-red-200">
            {activeClusterCounts.northFight} reports
          </span>
        </div>

        {/* Cluster 2: Fainting */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAFAF7] border border-black/[0.06]">
          <div className="flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-emerald-600" strokeWidth={1.5} />
            <div>
              <span className="font-bold text-[#111412] block text-[11px]">Gate B Fainting</span>
              <span className="text-[10px] text-[#6B7280]">Medical Syncope</span>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full font-mono font-bold text-xs bg-emerald-50 text-emerald-700 border border-emerald-200">
            {activeClusterCounts.gateBFaint} reports
          </span>
        </div>

        {/* Cluster 3: Smoke */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAFAF7] border border-black/[0.06]">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-600" strokeWidth={1.5} />
            <div>
              <span className="font-bold text-[#111412] block text-[11px]">Parking Smoke</span>
              <span className="text-[10px] text-[#6B7280]">P2 Flare / Fire</span>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full font-mono font-bold text-xs bg-orange-50 text-orange-700 border border-orange-200">
            {activeClusterCounts.parkingSmoke} reports
          </span>
        </div>
      </div>

      {/* Live Injected Report Ticker */}
      {latestSimReport && (
        <div className="p-2.5 rounded-xl bg-[#FAFAF7] border border-black/[0.08] flex items-center justify-between text-xs animate-in slide-in-from-bottom-2">
          <div className="flex items-center gap-2 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1F9D55] animate-ping shrink-0" />
            <span className="font-bold text-[#111412] shrink-0 font-mono text-[11px]">
              [{latestSimReport.language}]
            </span>
            <span className="text-[#6B7280] font-mono text-[11px] truncate">
              "{latestSimReport.text}"
            </span>
          </div>
          <span className="text-[10px] text-[#8E8E86] shrink-0 font-medium ml-2 font-mono">
            → {latestSimReport.zone}
          </span>
        </div>
      )}

      {/* Tiny footnote in demo controls saying the ticket data is simulated (Requirement 4) */}
      <div className="text-[10px] text-[#8E8E86] italic text-center pt-1 border-t border-black/[0.04]">
        Note: Stadium zones, telemetry stream and ticket data (Gate B • Block 104 • Row 12 • Seat 44) are simulated for demonstration.
      </div>
    </div>
  );
};
