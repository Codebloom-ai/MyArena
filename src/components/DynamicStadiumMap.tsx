import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Incident, Severity, StadiumZone } from '../types/stadium';
import { 
  HeartPulse, 
  ShieldAlert, 
  Flame, 
  AlertTriangle, 
  MapPin, 
  Layers,
  Sparkles,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Crosshair,
  Info
} from 'lucide-react';

interface DynamicStadiumMapProps {
  incidents: Incident[];
  selectedZone: StadiumZone | 'All';
  onSelectZone: (zone: StadiumZone | 'All') => void;
  interactiveMode?: 'filter' | 'picker';
  onPickZone?: (zone: StadiumZone) => void;
  pickedZone?: StadiumZone;
}

export const ZONE_COORDINATES: Record<StadiumZone, { x: number; y: number; label: string; sector: string }> = {
  'North Stand': { x: 400, y: 110, label: 'North Stand', sector: 'Virage Nord' },
  'South Stand': { x: 400, y: 490, label: 'South Stand', sector: 'Virage Sud' },
  'West Stand': { x: 165, y: 300, label: 'West Stand', sector: 'Tribune Ouest' },
  'East Stand': { x: 635, y: 300, label: 'East Stand', sector: 'Tribune Est' },
  'VIP': { x: 235, y: 300, label: 'VIP Box', sector: 'Presidential Lounge' },
  'Gate A': { x: 660, y: 115, label: 'Gate A', sector: 'East Metro Access' },
  'Gate B': { x: 140, y: 115, label: 'Gate B', sector: 'West Plaza Access' },
  'Parking': { x: 145, y: 505, label: 'Parking', sector: 'Parking P1/P2' },
};

export const DynamicStadiumMap: React.FC<DynamicStadiumMapProps> = ({
  incidents,
  selectedZone,
  onSelectZone,
  interactiveMode = 'filter',
  onPickZone,
  pickedZone,
}) => {
  const [hoveredZone, setHoveredZone] = useState<StadiumZone | null>(null);
  const [activeTooltipIncident, setActiveTooltipIncident] = useState<Incident | null>(null);

  // Zoom-in feature state
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [zoomTarget, setZoomTarget] = useState<{ x: number; y: number; zone: StadiumZone } | null>(null);

  // Sync zoom when selectedZone changes externally
  useEffect(() => {
    if (selectedZone !== 'All' && ZONE_COORDINATES[selectedZone]) {
      const coords = ZONE_COORDINATES[selectedZone];
      setZoomTarget({ x: coords.x, y: coords.y, zone: selectedZone });
      setZoomLevel(2.2);
    } else if (selectedZone === 'All') {
      setZoomTarget(null);
      setZoomLevel(1);
    }
  }, [selectedZone]);

  // Color-coded by incident type: Medical/Red, Fire/Orange, Fight/Blue, Other/Amber
  const getIncidentTypeColor = (type: string) => {
    switch (type) {
      case 'medical_emergency':
        return '#FF5A5F'; // Red
      case 'fire_smoke':
      case 'overcrowding':
        return '#FF8A1F'; // Orange
      case 'fight':
        return '#2F6BFF'; // Blue
      default:
        return '#D97706'; // Amber
    }
  };

  // Pulse intensity & ripple radiuses based on Severity Level
  const getSeverityPulseConfig = (severity: Severity) => {
    switch (severity) {
      case 'critical':
        return {
          baseR: 16,
          pulseR: 38,
          duration: '1.2s',
          strokeWidth: 2.5,
          opacityRange: '0.9;0;0.9',
          labelBg: '#EF4444',
        };
      case 'high':
        return {
          baseR: 14,
          pulseR: 30,
          duration: '2s',
          strokeWidth: 2,
          opacityRange: '0.7;0;0.7',
          labelBg: '#F97316',
        };
      case 'medium':
        return {
          baseR: 12,
          pulseR: 24,
          duration: '2.8s',
          strokeWidth: 1.5,
          opacityRange: '0.6;0;0.6',
          labelBg: '#F59E0B',
        };
      case 'low':
      default:
        return {
          baseR: 10,
          pulseR: 18,
          duration: '3.5s',
          strokeWidth: 1,
          opacityRange: '0.5;0;0.5',
          labelBg: '#64748B',
        };
    }
  };

  // Zoom to a specific zone when clicked
  const handleZoneClick = (zone: StadiumZone) => {
    if (interactiveMode === 'picker' && onPickZone) {
      onPickZone(zone);
    } else {
      if (selectedZone === zone && zoomLevel > 1) {
        // Toggle out to full view
        handleResetZoom();
      } else {
        const coords = ZONE_COORDINATES[zone];
        setZoomTarget({ x: coords.x, y: coords.y, zone });
        setZoomLevel(2.2);
        onSelectZone(zone);
      }
    }
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setZoomTarget(null);
    onSelectZone('All');
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(3.2, Number((prev + 0.5).toFixed(1))));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => {
      const next = Math.max(1, Number((prev - 0.5).toFixed(1)));
      if (next === 1) setZoomTarget(null);
      return next;
    });
  };

  const isZoneActive = (zone: StadiumZone) => {
    if (interactiveMode === 'picker') {
      return pickedZone === zone;
    }
    return selectedZone === zone;
  };

  // Calculate SVG transform values for center zoom
  // Target center in viewport: (400, 300)
  const centerX = zoomTarget ? zoomTarget.x : 400;
  const centerY = zoomTarget ? zoomTarget.y : 300;
  const translateX = zoomLevel === 1 ? 0 : 400 - centerX * zoomLevel;
  const translateY = zoomLevel === 1 ? 0 : 300 - centerY * zoomLevel;

  const zoomGroupRef = useRef<SVGGElement | null>(null);

  useEffect(() => {
    if (zoomGroupRef.current) {
      gsap.to(zoomGroupRef.current, {
        x: translateX,
        y: translateY,
        scale: zoomLevel,
        duration: 0.65,
        ease: 'power3.out',
        overwrite: 'auto',
      });
    }
  }, [translateX, translateY, zoomLevel]);

  return (
    <div className="relative w-full rounded-3xl frosted-panel p-4 sm:p-5 shadow-sm overflow-hidden select-none border border-white/90">
      {/* Top Map Header & Color Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-black/[0.06] text-xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#2F6BFF]/10 text-[#2F6BFF] font-semibold text-[11px] border border-[#2F6BFF]/20">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2F6BFF] animate-ping" />
            <span className="font-mono">2D STADIUM RADAR MAP</span>
          </div>
          <span className="text-[#526071] hidden sm:inline text-xs font-medium">
            Click any active zone to zoom in & focus
          </span>
        </div>

        {/* Color-Coded Incident Type Legend */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-[#526071]">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF5A5F] shadow-xs" />
            <span>Medical (Red)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2F6BFF] shadow-xs" />
            <span>Fight (Blue)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF8A1F] shadow-xs" />
            <span>Fire / Surge (Orange)</span>
          </span>
        </div>
      </div>

      {/* Floating Interactive Zoom Controls Bar */}
      <div className="absolute top-16 right-7 z-20 flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-2.5 py-1.5 rounded-2xl border border-black/[0.08] shadow-md text-xs">
        {zoomTarget && (
          <div className="flex items-center gap-1.5 pr-2 mr-1 border-r border-black/[0.08]">
            <span className="w-2 h-2 rounded-full bg-[#2F6BFF] animate-pulse" />
            <span className="font-bold text-[#111827] text-[11px] truncate max-w-[110px]">
              {zoomTarget.zone}
            </span>
          </div>
        )}

        <button
          onClick={handleZoomIn}
          disabled={zoomLevel >= 3.2}
          className="p-1 rounded-lg text-[#526071] hover:text-[#111827] hover:bg-black/[0.05] disabled:opacity-40 transition-colors cursor-pointer"
          title="Zoom in"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={handleZoomOut}
          disabled={zoomLevel <= 1}
          className="p-1 rounded-lg text-[#526071] hover:text-[#111827] hover:bg-black/[0.05] disabled:opacity-40 transition-colors cursor-pointer"
          title="Zoom out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        {zoomLevel > 1 && (
          <button
            onClick={handleResetZoom}
            className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#2F6BFF] text-white font-semibold text-[10px] hover:bg-[#1E56E8] transition-colors cursor-pointer ml-0.5 shadow-2xs"
            title="Reset full view"
          >
            <Maximize2 className="w-3 h-3" />
            <span>Full View</span>
          </button>
        )}
      </div>

      {/* Dynamic 2D SVG Stadium Canvas with Clip Boundary */}
      <div className="relative w-full aspect-[4/3] max-h-[480px] mx-auto overflow-hidden rounded-2xl bg-[#EAEAE2]/40 border border-black/[0.04]">
        <svg
          viewBox="0 0 800 600"
          className="w-full h-full drop-shadow-sm select-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <clipPath id="stadiumCanvasClip">
              <rect x="0" y="0" width="800" height="600" rx="24" />
            </clipPath>

            {/* Natural pitch grass gradient */}
            <linearGradient id="stadiumPitchGrass" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1E5631" />
              <stop offset="50%" stopColor="#24683C" />
              <stop offset="100%" stopColor="#1E5631" />
            </linearGradient>

            {/* Alternating lawn mow stripes */}
            <pattern id="stadiumLawnStripes" width="40" height="40" patternUnits="userSpaceOnUse">
              <rect width="20" height="40" fill="#1C4F2D" />
              <rect x="20" width="20" height="40" fill="#266D3F" />
            </pattern>

            {/* Glowing marker dropshadow filter */}
            <filter id="markerGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3" />
            </filter>
          </defs>

          {/* Interactive Zoom Transforming Root Group driven by GSAP */}
          <g
            ref={zoomGroupRef}
            style={{
              transformOrigin: '0 0',
            }}
          >
            {/* Stadium Exterior Concrete Perimeter */}
            <rect x="15" y="15" width="770" height="570" rx="42" fill="#F4F4EE" stroke="#E2E2D8" strokeWidth="2" />

            {/* Grandstand Circulation Concourse Ring */}
            <rect x="50" y="35" width="700" height="530" rx="90" fill="#EAEAE2" stroke="#D5D5C8" strokeWidth="1.5" strokeDasharray="5 4" />

            {/* ================= STADIUM SECTOR STANDS ================= */}

            {/* 1. NORTH STAND (VIRAGE NORD) */}
            <g
              className="cursor-pointer transition-colors duration-200"
              onClick={() => handleZoneClick('North Stand')}
              onMouseEnter={() => setHoveredZone('North Stand')}
              onMouseLeave={() => setHoveredZone(null)}
            >
              <path
                d="M 170 170 C 270 60, 530 60, 630 170 L 580 185 C 490 95, 310 95, 220 185 Z"
                fill={isZoneActive('North Stand') ? '#2F6BFF' : hoveredZone === 'North Stand' ? '#D6D6CC' : '#DFDFD6'}
                stroke={isZoneActive('North Stand') ? '#1E56E8' : '#C8C8BE'}
                strokeWidth="2"
              />
              <path d="M 200 150 C 280 80, 520 80, 600 150" fill="none" stroke={isZoneActive('North Stand') ? '#ffffff55' : '#C4C4BA'} strokeWidth="1" strokeDasharray="3 3" />
              <text
                x="400"
                y="108"
                textAnchor="middle"
                fill={isZoneActive('North Stand') ? '#FFFFFF' : '#111827'}
                fontSize="13"
                fontWeight="800"
                letterSpacing="0.5"
              >
                VIRAGE NORD (BLOCK 104)
              </text>
              <text
                x="400"
                y="125"
                textAnchor="middle"
                fill={isZoneActive('North Stand') ? '#DBEAFE' : '#526071'}
                fontSize="10"
                fontWeight="600"
              >
                Active Supporters Stand
              </text>
            </g>

            {/* 2. SOUTH STAND (VIRAGE SUD) */}
            <g
              className="cursor-pointer transition-colors duration-200"
              onClick={() => handleZoneClick('South Stand')}
              onMouseEnter={() => setHoveredZone('South Stand')}
              onMouseLeave={() => setHoveredZone(null)}
            >
              <path
                d="M 170 430 C 270 540, 530 540, 630 430 L 580 415 C 490 505, 310 505, 220 415 Z"
                fill={isZoneActive('South Stand') ? '#2F6BFF' : hoveredZone === 'South Stand' ? '#D6D6CC' : '#DFDFD6'}
                stroke={isZoneActive('South Stand') ? '#1E56E8' : '#C8C8BE'}
                strokeWidth="2"
              />
              <path d="M 200 450 C 280 520, 520 520, 600 450" fill="none" stroke={isZoneActive('South Stand') ? '#ffffff55' : '#C4C4BA'} strokeWidth="1" strokeDasharray="3 3" />
              <text
                x="400"
                y="492"
                textAnchor="middle"
                fill={isZoneActive('South Stand') ? '#FFFFFF' : '#111827'}
                fontSize="13"
                fontWeight="800"
                letterSpacing="0.5"
              >
                VIRAGE SUD (SOUTH STAND)
              </text>
              <text
                x="400"
                y="509"
                textAnchor="middle"
                fill={isZoneActive('South Stand') ? '#DBEAFE' : '#526071'}
                fontSize="10"
                fontWeight="600"
              >
                Family & Visitors Sector
              </text>
            </g>

            {/* 3. WEST STAND (TRIBUNE OUEST) */}
            <g
              className="cursor-pointer transition-colors duration-200"
              onClick={() => handleZoneClick('West Stand')}
              onMouseEnter={() => setHoveredZone('West Stand')}
              onMouseLeave={() => setHoveredZone(null)}
            >
              <path
                d="M 115 200 L 195 210 L 195 390 L 115 400 Z"
                fill={isZoneActive('West Stand') ? '#2F6BFF' : hoveredZone === 'West Stand' ? '#D6D6CC' : '#DFDFD6'}
                stroke={isZoneActive('West Stand') ? '#1E56E8' : '#C8C8BE'}
                strokeWidth="2"
              />
              <text
                x="145"
                y="295"
                textAnchor="middle"
                fill={isZoneActive('West Stand') ? '#FFFFFF' : '#111827'}
                fontSize="12"
                fontWeight="800"
                transform="rotate(-90 145 295)"
              >
                WEST STAND (OUEST)
              </text>
            </g>

            {/* 4. EAST STAND (TRIBUNE EST) */}
            <g
              className="cursor-pointer transition-colors duration-200"
              onClick={() => handleZoneClick('East Stand')}
              onMouseEnter={() => setHoveredZone('East Stand')}
              onMouseLeave={() => setHoveredZone(null)}
            >
              <path
                d="M 685 200 L 605 210 L 605 390 L 685 400 Z"
                fill={isZoneActive('East Stand') ? '#2F6BFF' : hoveredZone === 'East Stand' ? '#D6D6CC' : '#DFDFD6'}
                stroke={isZoneActive('East Stand') ? '#1E56E8' : '#C8C8BE'}
                strokeWidth="2"
              />
              <text
                x="655"
                y="305"
                textAnchor="middle"
                fill={isZoneActive('East Stand') ? '#FFFFFF' : '#111827'}
                fontSize="12"
                fontWeight="800"
                transform="rotate(90 655 305)"
              >
                EAST STAND (EST)
              </text>
            </g>

            {/* 5. VIP BOX */}
            <g
              className="cursor-pointer transition-colors duration-200"
              onClick={() => handleZoneClick('VIP')}
              onMouseEnter={() => setHoveredZone('VIP')}
              onMouseLeave={() => setHoveredZone(null)}
            >
              <rect
                x="205"
                y="250"
                width="60"
                height="100"
                rx="8"
                fill={isZoneActive('VIP') ? '#2F6BFF' : hoveredZone === 'VIP' ? '#FDE68A' : '#FEF3C7'}
                stroke={isZoneActive('VIP') ? '#1E56E8' : '#F59E0B'}
                strokeWidth="1.5"
              />
              <text
                x="235"
                y="305"
                textAnchor="middle"
                fill={isZoneActive('VIP') ? '#FFFFFF' : '#92400E'}
                fontSize="11"
                fontWeight="800"
              >
                VIP
              </text>
            </g>

            {/* 6. CENTRAL FOOTBALL PITCH */}
            <g>
              <rect
                x="285"
                y="190"
                width="230"
                height="220"
                rx="6"
                fill="url(#stadiumPitchGrass)"
                stroke="#1B4D2B"
                strokeWidth="2"
              />
              <rect
                x="285"
                y="190"
                width="230"
                height="220"
                rx="6"
                fill="url(#stadiumLawnStripes)"
                opacity="0.35"
              />

              {/* Pitch White Markings */}
              <rect x="295" y="200" width="210" height="200" fill="none" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.9" />
              <line x1="295" y1="300" x2="505" y2="300" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.9" />
              <circle cx="400" cy="300" r="28" fill="none" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.9" />
              <circle cx="400" cy="300" r="2" fill="#FFFFFF" />

              {/* Penalty Areas */}
              <rect x="355" y="200" width="90" height="32" fill="none" stroke="#FFFFFF" strokeWidth="1.2" opacity="0.9" />
              <rect x="375" y="200" width="50" height="14" fill="none" stroke="#FFFFFF" strokeWidth="1.2" opacity="0.9" />
              <rect x="355" y="368" width="90" height="32" fill="none" stroke="#FFFFFF" strokeWidth="1.2" opacity="0.9" />
              <rect x="375" y="386" width="50" height="14" fill="none" stroke="#FFFFFF" strokeWidth="1.2" opacity="0.9" />

              <text
                x="400"
                y="290"
                textAnchor="middle"
                fill="#FFFFFF"
                opacity="0.4"
                fontSize="10"
                fontWeight="bold"
                letterSpacing="1"
              >
                STADE D'HONNEUR
              </text>
            </g>

            {/* 7. PERIMETER GATES & ACCESS CORRIDORS */}
            <g
              className="cursor-pointer transition-colors duration-200"
              onClick={() => handleZoneClick('Gate A')}
              onMouseEnter={() => setHoveredZone('Gate A')}
              onMouseLeave={() => setHoveredZone(null)}
            >
              <rect
                x="620"
                y="85"
                width="80"
                height="60"
                rx="14"
                fill={isZoneActive('Gate A') ? '#2F6BFF' : hoveredZone === 'Gate A' ? '#E2E8F0' : '#EDF2F7'}
                stroke={isZoneActive('Gate A') ? '#1E56E8' : '#CBD5E1'}
                strokeWidth="1.5"
              />
              <text
                x="660"
                y="115"
                textAnchor="middle"
                fill={isZoneActive('Gate A') ? '#FFFFFF' : '#1E293B'}
                fontSize="12"
                fontWeight="800"
              >
                GATE A
              </text>
              <text
                x="660"
                y="130"
                textAnchor="middle"
                fill={isZoneActive('Gate A') ? '#DBEAFE' : '#64748B'}
                fontSize="9"
                fontWeight="600"
              >
                Metro Access
              </text>
            </g>

            <g
              className="cursor-pointer transition-colors duration-200"
              onClick={() => handleZoneClick('Gate B')}
              onMouseEnter={() => setHoveredZone('Gate B')}
              onMouseLeave={() => setHoveredZone(null)}
            >
              <rect
                x="100"
                y="85"
                width="80"
                height="60"
                rx="14"
                fill={isZoneActive('Gate B') ? '#2F6BFF' : hoveredZone === 'Gate B' ? '#E2E8F0' : '#EDF2F7'}
                stroke={isZoneActive('Gate B') ? '#1E56E8' : '#CBD5E1'}
                strokeWidth="1.5"
              />
              <text
                x="140"
                y="115"
                textAnchor="middle"
                fill={isZoneActive('Gate B') ? '#FFFFFF' : '#1E293B'}
                fontSize="12"
                fontWeight="800"
              >
                GATE B
              </text>
              <text
                x="140"
                y="130"
                textAnchor="middle"
                fill={isZoneActive('Gate B') ? '#DBEAFE' : '#64748B'}
                fontSize="9"
                fontWeight="600"
              >
                West Plaza
              </text>
            </g>

            {/* 8. SUPPORTERS PARKING */}
            <g
              className="cursor-pointer transition-colors duration-200"
              onClick={() => handleZoneClick('Parking')}
              onMouseEnter={() => setHoveredZone('Parking')}
              onMouseLeave={() => setHoveredZone(null)}
            >
              <rect
                x="80"
                y="460"
                width="130"
                height="90"
                rx="18"
                fill={isZoneActive('Parking') ? '#2F6BFF' : hoveredZone === 'Parking' ? '#E2E8F0' : '#EEF2F6'}
                stroke={isZoneActive('Parking') ? '#1E56E8' : '#CBD5E1'}
                strokeWidth="1.5"
              />
              <text
                x="145"
                y="498"
                textAnchor="middle"
                fill={isZoneActive('Parking') ? '#FFFFFF' : '#1E293B'}
                fontSize="12"
                fontWeight="800"
              >
                PARKING P1/P2
              </text>
              <text
                x="145"
                y="515"
                textAnchor="middle"
                fill={isZoneActive('Parking') ? '#DBEAFE' : '#64748B'}
                fontSize="9"
                fontWeight="600"
              >
                Supporter Bays
              </text>
            </g>

            {/* ================= DYNAMIC PULSING COLOR-CODED INCIDENT CIRCLES ================= */}
            {incidents.map((incident) => {
              const coords = ZONE_COORDINATES[incident.zone];
              if (!coords) return null;

              const color = getIncidentTypeColor(incident.incident_type);
              const pulse = getSeverityPulseConfig(incident.severity);

              return (
                <g
                  key={incident.id}
                  className="cursor-pointer transition-transform duration-200 hover:scale-110"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleZoneClick(incident.zone);
                    setActiveTooltipIncident(
                      activeTooltipIncident?.id === incident.id ? null : incident
                    );
                  }}
                >
                  {/* Outermost Concentric Ripple Wave */}
                  <circle
                    cx={coords.x}
                    cy={coords.y}
                    r={pulse.baseR}
                    fill="none"
                    stroke={color}
                    strokeWidth={pulse.strokeWidth}
                    opacity="0.8"
                  >
                    <animate
                      attributeName="r"
                      values={`${pulse.baseR};${pulse.pulseR};${pulse.baseR}`}
                      dur={pulse.duration}
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values={pulse.opacityRange}
                      dur={pulse.duration}
                      repeatCount="indefinite"
                    />
                  </circle>

                  {/* Secondary Ripple Wave for Critical & High Emergencies */}
                  {(incident.severity === 'critical' || incident.severity === 'high') && (
                    <circle
                      cx={coords.x}
                      cy={coords.y}
                      r={pulse.baseR}
                      fill="none"
                      stroke={color}
                      strokeWidth="1.5"
                      opacity="0.6"
                    >
                      <animate
                        attributeName="r"
                        values={`${pulse.baseR};${pulse.pulseR * 1.35};${pulse.baseR}`}
                        dur={pulse.duration}
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        values="0.6;0;0.6"
                        dur={pulse.duration}
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}

                  {/* Core Color-Coded Disc */}
                  <circle
                    cx={coords.x}
                    cy={coords.y}
                    r={pulse.baseR}
                    fill={color}
                    stroke="#FFFFFF"
                    strokeWidth="2.5"
                    filter="url(#markerGlow)"
                  />

                  {/* Number of Merged Reports Inside Marker */}
                  <text
                    x={coords.x}
                    y={coords.y + 4}
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontSize="11"
                    fontWeight="800"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {incident.reportCount}
                  </text>

                  {/* Severity Badge Tag Floating Above Marker */}
                  <g transform={`translate(${coords.x - 30}, ${coords.y - pulse.baseR - 18})`}>
                    <rect
                      width="60"
                      height="16"
                      rx="5"
                      fill="#FFFFFF"
                      stroke={color}
                      strokeWidth="1.5"
                      filter="drop-shadow(0 2px 4px rgba(0,0,0,0.12))"
                    />
                    <text
                      x="30"
                      y="11.5"
                      textAnchor="middle"
                      fill={color}
                      fontSize="8.5"
                      fontWeight="800"
                      letterSpacing="0.4"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      {incident.severity.toUpperCase()}
                    </text>
                  </g>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Zone Quick-Filter Buttons */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-1.5 pt-3 border-t border-black/[0.06] text-xs">
        <span className="text-[#526071] font-semibold flex items-center gap-1">
          <Layers className="w-3.5 h-3.5 text-[#2F6BFF]" />
          Filter Sector:
        </span>
        <div className="flex flex-wrap gap-1">
          <button
            onClick={handleResetZoom}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              selectedZone === 'All'
                ? 'bg-[#2F6BFF] text-white shadow-xs'
                : 'bg-white/80 text-[#526071] hover:text-[#111827] border border-black/[0.08]'
            }`}
          >
            All Zones
          </button>
          {Object.keys(ZONE_COORDINATES).map((zoneName) => {
            const count = incidents.filter((i) => i.zone === zoneName).length;
            const isSelected = selectedZone === zoneName;
            return (
              <button
                key={zoneName}
                onClick={() => handleZoneClick(zoneName as StadiumZone)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#2F6BFF] text-white font-bold shadow-xs'
                    : 'bg-white/80 text-[#526071] hover:text-[#111827] border border-black/[0.08]'
                }`}
              >
                <span>{zoneName}</span>
                {count > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-[#DC2626] text-white">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
