import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { RoundedBox, Html, Float } from '@react-three/drei';
import * as THREE from 'three';
import { 
  HeartPulse, 
  ShieldAlert, 
  Flame, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
  Shield,
  Clock,
  Radio,
  MapPin,
  Mic,
  Ticket
} from 'lucide-react';

interface PhoneModelProps {
  rotationY: number; // in radians
  activeStep: number;
  mergedCount: number;
  onNavigateToPerspective: () => void;
}

// Proportions: 1 : 2.06 : 0.11
const PHONE_WIDTH = 2.4;
const PHONE_HEIGHT = 4.944;
const PHONE_DEPTH = 0.264;
const PHONE_RADIUS = 0.32;

function PhoneMesh({ rotationY, activeStep, mergedCount, onNavigateToPerspective }: PhoneModelProps) {
  const groupRef = useRef<THREE.Group | null>(null);

  // Smooth lerp rotation for ultra-smooth scrub
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        rotationY,
        0.18
      );
    }
  });

  // Metallic Titanium Frame Material
  const titaniumMaterial = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#d4d4cc'),
      metalness: 0.92,
      roughness: 0.22,
      clearcoat: 0.45,
      clearcoatRoughness: 0.18,
      reflectivity: 0.85,
    });
  }, []);

  const buttonMaterial = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#b8b8b0'),
      metalness: 0.9,
      roughness: 0.25,
      clearcoat: 0.3,
    });
  }, []);

  const blackBezelMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: new THREE.Color('#0a0a0c'),
    });
  }, []);

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* 1. MAIN BODY: RoundedBox with real thickness & titanium edges */}
      <RoundedBox
        args={[PHONE_WIDTH, PHONE_HEIGHT, PHONE_DEPTH]}
        radius={PHONE_RADIUS}
        smoothness={8}
        material={titaniumMaterial}
        castShadow
        receiveShadow
      />

      {/* 2. BLACK FRONT SCREEN GLASS SLAB */}
      <RoundedBox
        args={[PHONE_WIDTH - 0.08, PHONE_HEIGHT - 0.08, 0.01]}
        radius={PHONE_RADIUS - 0.04}
        smoothness={6}
        position={[0, 0, PHONE_DEPTH / 2 + 0.005]}
        material={blackBezelMaterial}
      />

      {/* 3. SIDE BUTTONS (Hardware details) */}
      {/* Left Action Button */}
      <RoundedBox
        args={[0.03, 0.26, 0.06]}
        radius={0.015}
        smoothness={4}
        position={[-PHONE_WIDTH / 2 - 0.015, 1.25, 0]}
        material={buttonMaterial}
      />
      {/* Left Volume Up */}
      <RoundedBox
        args={[0.03, 0.44, 0.06]}
        radius={0.015}
        smoothness={4}
        position={[-PHONE_WIDTH / 2 - 0.015, 0.72, 0]}
        material={buttonMaterial}
      />
      {/* Left Volume Down */}
      <RoundedBox
        args={[0.03, 0.44, 0.06]}
        radius={0.015}
        smoothness={4}
        position={[-PHONE_WIDTH / 2 - 0.015, 0.18, 0]}
        material={buttonMaterial}
      />
      {/* Right Power / Lock Button */}
      <RoundedBox
        args={[0.03, 0.68, 0.06]}
        radius={0.015}
        smoothness={4}
        position={[PHONE_WIDTH / 2 + 0.015, 0.5, 0]}
        material={buttonMaterial}
      />

      {/* 4. HTML SCREEN CONTENT: Rendered with drei's Html (transform) */}
      <Html
        transform
        position={[0, 0, PHONE_DEPTH / 2 + 0.012]}
        distanceFactor={4.944}
        scale={[0.198, 0.198, 0.198]}
        className="pointer-events-auto select-none"
      >
        <div 
          className="w-[370px] h-[762px] rounded-[52px] bg-white text-[#111827] flex flex-col justify-between p-5 relative overflow-hidden shadow-2xl border-4 border-black"
          style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
        >
          {/* Dynamic Island Pill */}
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-28 h-6 rounded-full bg-black flex items-center justify-between px-2.5 z-40 shadow-xs">
            <div className="w-2.5 h-2.5 rounded-full bg-[#1c1c1e] flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-[#2F6BFF] animate-pulse" />
            </div>
            <span className="text-[9px] font-mono font-bold text-white/80">MyArena</span>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 animate-ping" />
          </div>

          {/* Top Status Bar */}
          <div className="pt-7 pb-2 flex items-center justify-between text-[11px] font-semibold text-[#526071] border-b border-black/[0.05]">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[#111827]">20:45</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-50 text-[#2F6BFF]">STADE</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-emerald-600 font-bold">5G • GPS</span>
            </div>
          </div>

          {/* Screen Body changes smoothly according to activeStep (0..4) */}
          <div className="flex-1 flex flex-col justify-center py-2 relative">
            {/* STEP 0: 3 Emergency Buttons + Scanned Ticket */}
            {activeStep === 0 && (
              <div className="space-y-3.5 animate-fadeIn">
                {/* Scanned Ticket card */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-blue-100 text-[#2F6BFF] flex items-center justify-center">
                      <Ticket className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-[#111827]">Virage Nord • Porte B</div>
                      <div className="text-[9px] text-[#526071]">Bloc 104, Rang 12, Siège 48</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-bold">
                    Scanné
                  </span>
                </div>

                <div className="text-center">
                  <h4 className="text-lg font-bold text-[#111827]">Besoin d'aide ?</h4>
                  <p className="text-[11px] text-[#526071]">Un clic prévient les secours avec votre siège exact.</p>
                </div>

                {/* 3 Buttons */}
                <div className="space-y-2">
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#FF5A5F] to-[#E0245E] text-white flex items-center justify-between shadow-md">
                    <div>
                      <div className="text-sm font-bold flex items-center gap-1.5">
                        <HeartPulse className="w-4 h-4 animate-pulse" />
                        <span>Urgence Médicale</span>
                      </div>
                      <div className="text-[10px] text-white/85">Malaise, blessure, détresse</div>
                    </div>
                    <span className="text-[10px] px-2 py-1 rounded-full bg-white/20 font-bold">1-Clic</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#2F6BFF] to-[#123FC4] text-white flex items-center justify-between shadow-md">
                    <div>
                      <div className="text-sm font-bold flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4" />
                        <span>Sécurité & Bagarre</span>
                      </div>
                      <div className="text-[10px] text-white/85">Violence, vol, menace</div>
                    </div>
                    <span className="text-[10px] px-2 py-1 rounded-full bg-white/20 font-bold">1-Clic</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#FF8A1F] to-[#E65100] text-white flex items-center justify-between shadow-md">
                    <div>
                      <div className="text-sm font-bold flex items-center gap-1.5">
                        <Flame className="w-4 h-4" />
                        <span>Incendie / Fumée</span>
                      </div>
                      <div className="text-[10px] text-white/85">Flammes, fumigènes, foule</div>
                    </div>
                    <span className="text-[10px] px-2 py-1 rounded-full bg-white/20 font-bold">1-Clic</span>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 1: AI Talks to You (Voice Chat + Pulsing Orb) */}
            {activeStep === 1 && (
              <div className="space-y-3.5 animate-fadeIn">
                <div className="p-3 rounded-2xl bg-blue-50/80 border border-blue-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
                    <span className="text-[11px] font-bold text-blue-900">Équipe Médicale en route</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-blue-700 bg-white px-2 py-0.5 rounded-full">
                    ETA: ~1:45
                  </span>
                </div>

                {/* Pulsing Voice Orb */}
                <div className="flex flex-col items-center justify-center py-4">
                  <div className="relative flex items-center justify-center">
                    <div className="absolute w-20 h-20 rounded-full bg-[#2F6BFF]/20 animate-ping" />
                    <div className="absolute w-16 h-16 rounded-full bg-gradient-to-tr from-[#2F6BFF] to-[#4ECCA3] opacity-50 blur-sm" />
                    <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#2F6BFF] to-[#4ECCA3] text-white flex items-center justify-center shadow-lg relative z-10">
                      <Mic className="w-6 h-6 animate-pulse" />
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-[#111827] mt-3">L'IA vous parle calmement...</span>
                  <span className="text-[10px] text-[#526071]">Écoute et transcription multilingue</span>
                </div>

                {/* AI Dialogue Bubble */}
                <div className="p-3.5 rounded-2xl bg-slate-100 text-[#111827] text-xs leading-relaxed space-y-1.5 shadow-2xs">
                  <p className="font-semibold text-[#111827]">
                    « Je suis avec vous. L'équipe médicale arrive. Restez près de la personne sans la déplacer, respire-t-elle ? »
                  </p>
                  <div className="flex gap-1.5 pt-1">
                    <span className="px-2.5 py-1 rounded-full bg-white text-[10px] font-bold text-[#2F6BFF] shadow-2xs border border-blue-100">
                      Oui, elle respire
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-white text-[10px] font-bold text-red-600 shadow-2xs border border-red-100">
                      Inconsciente
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Duplicates Become One (Report Stacking & Merging) */}
            {activeStep === 2 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="text-center space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#2F6BFF] text-[10px] font-bold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Fusion Spatiale en temps réel</span>
                  </div>
                  <h4 className="text-base font-bold text-[#111827]">Détection de doublons</h4>
                </div>

                {/* Merging Cards Visual */}
                <div className="relative min-h-[220px] flex flex-col justify-center items-center">
                  <div className="w-full p-4 rounded-2xl bg-gradient-to-br from-white to-blue-50 border-2 border-[#2F6BFF] shadow-xl relative z-20 transition-all duration-500">
                    <div className="flex items-center justify-between border-b border-black/[0.06] pb-2 mb-2">
                      <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold">
                        Incident Unique #408
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#2F6BFF] text-white text-[10px] font-bold animate-pulse">
                        {mergedCount} rapports fusionnés
                      </span>
                    </div>
                    <div className="text-xs font-bold text-[#111827]">Malaise Porte B - Tribune Nord</div>
                    <div className="text-[10px] text-[#526071] mt-0.5">3 supporters signalent le même incident en 12s</div>
                    <div className="mt-2.5 pt-2 border-t border-black/[0.05] flex items-center justify-between text-[10px]">
                      <span className="text-emerald-600 font-bold">Alerte doublon évitée</span>
                      <span className="font-mono text-[#2F6BFF] font-bold">Secours unifiés</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Security Acts (Command Dashboard Card) */}
            {activeStep === 3 && (
              <div className="space-y-3.5 animate-fadeIn">
                <div className="p-3 rounded-2xl bg-neutral-900 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#2F6BFF]" />
                    <span className="text-xs font-bold">Poste Central de Sécurité</span>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-md space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                      URGENT • NIVEAU HAUT
                    </span>
                    <span className="text-[10px] text-[#526071] font-mono">14:02:18</span>
                  </div>
                  <div className="text-xs font-bold text-[#111827]">
                    Tribune Nord • Malaise supporter
                  </div>
                  <div className="text-[10px] text-[#526071] leading-relaxed">
                    Localisation confirmée par 3 billets scannés. Équipe médicale affectée.
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 flex items-center justify-between text-[10px]">
                    <span className="font-semibold text-[#111827]">Équipe Médicale</span>
                    <span className="font-mono font-bold text-[#2F6BFF]">Arrivée estimée: 1 min</span>
                  </div>

                  <button className="w-full py-2 rounded-xl bg-[#2F6BFF] text-white text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-sm">
                    <span>Confirmer Prise en Charge</span>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: Ready to Use (Interactive Invitation) */}
            {activeStep === 4 && (
              <div className="space-y-4 text-center animate-fadeIn py-2">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-[#2F6BFF]/10 text-[#2F6BFF] flex items-center justify-center">
                  <Shield className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-[#111827]">MyArena est prêt</h4>
                  <p className="text-xs text-[#526071] mt-1">
                    Explorez l'expérience en direct depuis les deux points de vue.
                  </p>
                </div>

                <button
                  onClick={onNavigateToPerspective}
                  className="w-full py-3 px-4 rounded-2xl bg-[#2F6BFF] hover:bg-[#1E56E8] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 active:scale-95 transition-all cursor-pointer"
                >
                  <span>Choisir votre perspective</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Bottom Powered by Gemini (no version number or fake stats) */}
          <div className="py-2 text-center border-t border-black/[0.05]">
            <div className="inline-flex items-center gap-1 text-[10px] text-[#526071] font-medium">
              <Sparkles className="w-3 h-3 text-[#2F6BFF]" />
              <span>Powered by Gemini</span>
            </div>
          </div>
        </div>
      </Html>
    </group>
  );
}

export interface Phone3DCanvasProps {
  rotationY: number; // in degrees
  activeStep: number;
  mergedCount: number;
  onNavigateToPerspective: () => void;
}

export const Phone3DCanvas: React.FC<Phone3DCanvasProps> = ({
  rotationY,
  activeStep,
  mergedCount,
  onNavigateToPerspective,
}) => {
  const rotRad = (rotationY * Math.PI) / 180;

  return (
    <div className="relative w-full h-[78vh] flex items-center justify-center select-none">
      <Canvas
        shadows
        camera={{ position: [0, 0, 7.8], fov: 42 }}
        className="w-full h-full"
        gl={{ antialias: true, alpha: true }}
      >
        {/* STUDIO LIGHTING: Soft studio key light + rim light */}
        <ambientLight intensity={1.1} />
        <directionalLight
          position={[4, 6, 5]}
          intensity={1.8}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <directionalLight
          position={[-5, 3, -3]}
          intensity={1.2}
          color="#90b8f8"
        />
        <pointLight position={[0, -3, 3]} intensity={0.6} color="#ffe2d1" />

        <PhoneMesh
          rotationY={rotRad}
          activeStep={activeStep}
          mergedCount={mergedCount}
          onNavigateToPerspective={onNavigateToPerspective}
        />
      </Canvas>
    </div>
  );
};
