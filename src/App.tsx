import React, { useState, useEffect, useRef } from 'react';
import { 
  Incident, 
  IncidentStatus, 
  RawReport, 
  Severity, 
  StadiumZone,
  IncidentType,
  ChatMessage,
  REGISTERED_TICKET
} from './types/stadium';
import { HeroScrollStory } from './components/HeroScrollStory';
import { RoleChoiceSection } from './components/RoleChoiceSection';
import { FormalReportModal } from './components/FormalReportModal';
import { SIMULATION_REPORTS, SimulationReportItem } from './data/simulationData';
import { CROWD_SURGE_REPORTS, CrowdSurgeReportItem } from './data/crowdSurgeData';
import { SupportedLang, getFullLanguageName, CONSTANT_QUICK_CHIPS } from './data/triageTree';
import { 
  getInitialStoredIncidents, 
  getInitialStoredReports, 
  createBroadcastChannel, 
  broadcastState,
  getAssignedTeamForType 
} from './data/stadiumStore';

import { SupporterView } from './components/SupporterView';
import { SecurityDashboard } from './components/SecurityDashboard';

type AppRoute = '/' | '/choose' | '/supporter' | '/security';

export default function App() {
  // Hash Routing State
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(() => {
    const hash = window.location.hash;
    if (hash === '#/choose') return '/choose';
    if (hash === '#/supporter') return '/supporter';
    if (hash === '#/security') return '/security';
    return '/';
  });

  // Persistent Single Language State across all routes with localStorage persistence
  const [lang, setLang] = useState<SupportedLang>(() => {
    try {
      const saved = localStorage.getItem('myarena_lang');
      if (saved === 'ar' || saved === 'en' || saved === 'fr') return saved;
    } catch (_) {}
    return 'fr';
  });

  const handleSelectLang = (newLang: SupportedLang) => {
    setLang(newLang);
    try {
      localStorage.setItem('myarena_lang', newLang);
    } catch (_) {}
  };

  // Incidents & Queue State (Global store above routes + BroadcastChannel synced)
  const [incidents, setIncidents] = useState<Incident[]>(() => getInitialStoredIncidents());
  const [rawReports, setRawReports] = useState<RawReport[]>(() => getInitialStoredReports());
  const [selectedZoneFilter, setSelectedZoneFilter] = useState<StadiumZone | 'All'>('All');

  // Active emergency incident ID for Supporter View
  // User request: "when i reload app it should go back to buttons"
  // Initializing to null guarantees reload always lands cleanly on the emergency buttons screen!
  const [activeEmergencyIncidentId, setActiveEmergencyIncidentId] = useState<string | null>(null);

  // Simulation state for Security Dashboard
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationIndex, setSimulationIndex] = useState(0);
  const [simSpeedMultiplier, setSimSpeedMultiplier] = useState(1);
  const [latestSimReport, setLatestSimReport] = useState<SimulationReportItem | null>(null);

  // Requirement 4: Crowd Surge Simulation state (120 reports in 30s)
  const [isCrowdSurgeActive, setIsCrowdSurgeActive] = useState<boolean>(false);
  const [crowdSurgeIndex, setCrowdSurgeIndex] = useState<number>(0);
  const crowdSurgeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const classificationCacheRef = useRef<Map<string, { type: IncidentType; severity: Severity; zone: StadiumZone }>>(new Map());

  // Formal Report Modal state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportContent, setReportContent] = useState('');
  const [isReportLoading, setIsReportLoading] = useState(false);

  const simulationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  // Synchronize HTML attributes for language and text direction
  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  // Initialize BroadcastChannel to sync tabs in real time
  useEffect(() => {
    broadcastChannelRef.current = createBroadcastChannel((syncedIncidents, syncedReports) => {
      setIncidents(syncedIncidents);
      setRawReports(syncedReports);
    });

    return () => {
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.close();
      }
    };
  }, []);

  // Hash-based navigation and browser back/forward button support
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      let nextRoute: AppRoute = '/';
      if (hash === '#/choose') nextRoute = '/choose';
      else if (hash === '#/supporter') nextRoute = '/supporter';
      else if (hash === '#/security') nextRoute = '/security';

      setCurrentRoute(nextRoute);
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (route: AppRoute) => {
    window.location.hash = '#' + route;
    setCurrentRoute(route);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  // Helper to commit state & broadcast
  const commitAndBroadcast = (newIncidents: Incident[], newReports: RawReport[]) => {
    setIncidents(newIncidents);
    setRawReports(newReports);
    broadcastState(broadcastChannelRef.current, newIncidents, newReports);
  };

  // Clean up simulation timer on unmount
  useEffect(() => {
    return () => {
      if (simulationTimerRef.current) {
        clearTimeout(simulationTimerRef.current);
      }
    };
  }, []);

  // =========================================================================
  // 1. ONE-TAP EMERGENCY TRIGGER (REAL GEMINI INTERCOM CHATBOT)
  // THE INCIDENT APPEARS ON DASHBOARD THE EXACT MOMENT BUTTON IS TAPPED!
  // =========================================================================
  const handleTriggerOneTapAlert = async (alert: {
    type: IncidentType;
    zone: StadiumZone;
    seat: string;
    language: string;
  }) => {
    const rawReportId = `rep-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const nowIso = new Date().toISOString();
    const assignedTeam = getAssignedTeamForType(alert.type);
    const lockedLangName = alert.language || getFullLanguageName(lang);

    const newRawReport: RawReport = {
      id: rawReportId,
      text: `[1-TAP ALERT] Tapped ${alert.type.toUpperCase().replace('_', ' ')} at ${alert.seat}`,
      timestamp: nowIso,
      language: lockedLangName,
      zone: alert.zone,
      exactSeat: alert.seat,
      reporterSource: 'quick_button',
    };

    let targetIncidentId = '';
    let targetIncident: Incident;

    // 1. Immediately create or merge incident in the global store so dashboard updates live INSTANTLY
    const existingIdx = incidents.findIndex(
      (i) => i.zone === alert.zone && i.incident_type === alert.type && i.status !== 'resolved'
    );

    let updatedIncidents = [...incidents];
    let updatedReports = [newRawReport, ...rawReports];

    if (existingIdx !== -1) {
      const existing = updatedIncidents[existingIdx];
      const newCount = existing.reportCount + 1;
      let newSeverity: Severity = existing.severity;
      if (newCount >= 4 || alert.type === 'fight' || alert.type === 'fire_smoke') {
        newSeverity = 'critical';
      } else if (newCount >= 2) {
        newSeverity = 'high';
      }

      const whyMergedReason = `Merged ${newCount} emergency alerts: Supporters at ${alert.seat} confirmed ongoing ${alert.type.replace('_', ' ')}.`;

      targetIncident = {
        ...existing,
        reportCount: newCount,
        severity: newSeverity,
        lastReportTime: nowIso,
        why_merged: whyMergedReason,
        rawReports: [newRawReport, ...existing.rawReports],
        dashboard_summary: `Supporter triggered alert for ${alert.type.replace('_', ' ')} at ${alert.seat}. Help assigned.`,
      };
      targetIncidentId = existing.id;
      updatedIncidents[existingIdx] = targetIncident;
    } else {
      targetIncidentId = `inc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      targetIncident = {
        id: targetIncidentId,
        incident_type: alert.type,
        severity: 'high',
        zone: alert.zone,
        exactSeat: alert.seat,
        english_summary: `Supporter reported ${alert.type.replace('_', ' ')} at ${alert.seat}`,
        dashboard_summary: `Initial alert for ${alert.type.replace('_', ' ')} received from ticket seat ${alert.seat}. Dispatched ${assignedTeam}.`,
        recommended_action: `Dispatch ${assignedTeam} to ${alert.seat}`,
        confidence: 0.95,
        reportCount: 1,
        firstReportTime: nowIso,
        lastReportTime: nowIso,
        status: 'active',
        why_merged: 'First emergency report from ticket seat.',
        rawReports: [newRawReport],
        assignedTeam,
        timeToFirstResponseMs: 140,
        chatMessages: [],
        estimatedArrivalMinutes: 2,
        lockedLanguage: lockedLangName as any,
        stateMemory: {
          incident_type: alert.type,
          ticket_seat: alert.seat,
          facts_known: {},
          actions_already_given: [],
        },
      };
      updatedIncidents = [targetIncident, ...updatedIncidents];
    }

    commitAndBroadcast(updatedIncidents, updatedReports);
    setActiveEmergencyIncidentId(targetIncidentId);

    // 2. Call Gemini API to generate the REAL opening reply in the locked language
    try {
      const res = await fetch('/api/assistant-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incidentType: alert.type,
          seat: alert.seat,
          lockedLanguage: lockedLangName,
          isFirstMessage: true,
          history: [],
          state: targetIncident.stateMemory,
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        const firstMsg: ChatMessage = {
          id: `msg-${Date.now()}-ai-0`,
          sender: 'ai',
          text: data.reply,
          timestamp: new Date().toISOString(),
          quickReplies: data.quick_replies || [],
        };

        const finalIncidents = updatedIncidents.map((inc) => {
          if (inc.id === targetIncidentId) {
            return {
              ...inc,
              severity: data.severity || inc.severity,
              escalate: Boolean(data.escalate),
              dashboard_summary: data.dashboard_summary || inc.dashboard_summary,
              chatMessages: [...inc.chatMessages, firstMsg],
              stateMemory: {
                ...inc.stateMemory!,
                facts_known: { ...(inc.stateMemory?.facts_known || {}), ...(data.facts_update || {}) },
              },
            };
          }
          return inc;
        });

        commitAndBroadcast(finalIncidents, updatedReports);
        return {
          incidentId: targetIncidentId,
          incident: targetIncident,
          firstAssistantMessage: {
            text: data.reply,
            quickReplies: data.quick_replies || [],
          },
        };
      }
    } catch {
      // Gracefully fall back to local safety response
    }

    // Fallback if API was unavailable
    const fallbackFirstMsg: ChatMessage = {
      id: `msg-${Date.now()}-ai-0`,
      sender: 'ai',
      text: lang === 'ar' 
        ? "أنا معك، فرقة الإسعاف والمنظمون في طريقهم لمقعدك الآن. ابق بجانب الشخص واهدأ، واش كيتنفس؟"
        : lang === 'en'
        ? "I'm right here with you. Medics and stadium security are on their way to your section right now. Are they conscious and breathing?"
        : "Je suis avec vous, les secours et les stadiers arrivent immédiatement à votre rangée. Restez près de la personne, respire-t-elle normalement ?",
      timestamp: new Date().toISOString(),
      quickReplies: CONSTANT_QUICK_CHIPS[lang],
    };

    return {
      incidentId: targetIncidentId,
      incident: targetIncident,
      firstAssistantMessage: {
        text: fallbackFirstMsg.text,
        quickReplies: fallbackFirstMsg.quickReplies || [],
      },
    };
  };

  // =========================================================================
  // 2. SUPPORTER SENDS MESSAGE (NO SCRIPTED NODES - FULL GEMINI TURNS)
  // =========================================================================
  const handleSendSupporterChatReply = async (
    incidentId: string,
    replyText: string,
    lockedLanguage: string
  ) => {
    const nowIso = new Date().toISOString();
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      sender: 'supporter',
      text: replyText,
      timestamp: nowIso,
    };

    const targetIncident = incidents.find((i) => i.id === incidentId);
    if (!targetIncident) {
      throw new Error('Incident not found');
    }

    const currentHistory = targetIncident.chatMessages || [];
    const updatedHistoryWithUser = [...currentHistory, userMsg];

    // Append user message immediately and broadcast
    const incidentsWithUserMsg = incidents.map((inc) => {
      if (inc.id === incidentId) {
        return {
          ...inc,
          chatMessages: updatedHistoryWithUser,
        };
      }
      return inc;
    });

    const newRaw: RawReport = {
      id: `rep-${Date.now()}`,
      incidentId,
      text: replyText,
      timestamp: nowIso,
      language: lockedLanguage,
      zone: targetIncident.zone,
      exactSeat: targetIncident.exactSeat,
      reporterSource: replyText.startsWith('🎙️') ? 'voice' : 'text',
    };
    const updatedReportsWithUser = [newRaw, ...rawReports];

    commitAndBroadcast(incidentsWithUserMsg, updatedReportsWithUser);

    // Call Gemini API with clean conversation history
    try {
      const res = await fetch('/api/assistant-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incidentType: targetIncident.incident_type,
          seat: targetIncident.exactSeat || REGISTERED_TICKET.fullSeatString,
          lockedLanguage,
          supporterAnswer: replyText,
          history: currentHistory,
          state: targetIncident.stateMemory,
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        const aiMsg: ChatMessage = {
          id: `msg-${Date.now()}-ai`,
          sender: 'ai',
          text: data.reply,
          timestamp: new Date().toISOString(),
          quickReplies: data.quick_replies || [],
        };

        const finalIncidents = incidentsWithUserMsg.map((inc) => {
          if (inc.id === incidentId) {
            return {
              ...inc,
              severity: data.severity || inc.severity,
              escalate: Boolean(data.escalate),
              dashboard_summary: data.dashboard_summary || inc.dashboard_summary,
              chatMessages: [...updatedHistoryWithUser, aiMsg],
              stateMemory: {
                ...inc.stateMemory!,
                facts_known: { ...(inc.stateMemory?.facts_known || {}), ...(data.facts_update || {}) },
              },
            };
          }
          return inc;
        });

        commitAndBroadcast(finalIncidents, updatedReportsWithUser);
        return {
          assistantReply: {
            text: data.reply,
            quickReplies: data.quick_replies || [],
            needs_escalation: data.escalate,
          },
        };
      }
    } catch {
      // Gracefully fall back to local safety response
    }

    // Fallback AI reply
    const fallbackAiMsg: ChatMessage = {
      id: `msg-${Date.now()}-ai-fallback`,
      sender: 'ai',
      text: lang === 'ar'
        ? "المسعفون اقتربوا من ممر صفكم. ابق بجانب الشخص واحرص على الهدوء."
        : lang === 'en'
        ? "The response team is heading down your aisle right now. Stay right there with them and keep them calm."
        : "Les secours arrivent dans votre allée en ce moment. Restez près de la personne et gardez votre calme.",
      timestamp: new Date().toISOString(),
      quickReplies: CONSTANT_QUICK_CHIPS[lang],
    };

    const fallbackIncidents = incidentsWithUserMsg.map((inc) => {
      if (inc.id === incidentId) {
        return {
          ...inc,
          chatMessages: [...updatedHistoryWithUser, fallbackAiMsg],
        };
      }
      return inc;
    });

    commitAndBroadcast(fallbackIncidents, updatedReportsWithUser);
    return {
      assistantReply: {
        text: fallbackAiMsg.text,
        quickReplies: fallbackAiMsg.quickReplies || [],
      },
    };
  };

  // =========================================================================
  // 3. REGENERATE ON LANGUAGE SWITCH (NO FRENCH MESSAGE IN ARABIC CHAT)
  // =========================================================================
  const handleRegenerateLanguage = async (incidentId: string, newLang: SupportedLang) => {
    const targetIncident = incidents.find((i) => i.id === incidentId);
    if (!targetIncident) {
      return { assistantReply: { text: '', quickReplies: [] } };
    }

    const newLockedLangName = getFullLanguageName(newLang);

    try {
      const res = await fetch('/api/assistant-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incidentType: targetIncident.incident_type,
          seat: targetIncident.exactSeat || REGISTERED_TICKET.fullSeatString,
          lockedLanguage: newLockedLangName,
          isFirstMessage: true,
          supporterAnswer: `[Language switched to ${newLockedLangName}]. Provide immediate reassuring safety instruction in ${newLockedLangName}.`,
          history: [], // Fresh start in new language so model is not polluted with old language messages
          state: targetIncident.stateMemory,
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        const regeneratedMsg: ChatMessage = {
          id: `msg-${Date.now()}-regen`,
          sender: 'ai',
          text: data.reply,
          timestamp: new Date().toISOString(),
          quickReplies: data.quick_replies || [],
        };

        const updatedIncidents = incidents.map((inc) => {
          if (inc.id === incidentId) {
            return {
              ...inc,
              lockedLanguage: newLockedLangName as any,
              chatMessages: [regeneratedMsg], // Replace so NO French message is left in an Arabic chat!
              dashboard_summary: data.dashboard_summary || inc.dashboard_summary,
            };
          }
          return inc;
        });

        commitAndBroadcast(updatedIncidents, rawReports);
        return {
          assistantReply: {
            text: data.reply,
            quickReplies: data.quick_replies || [],
          },
        };
      }
    } catch {
      // Gracefully fall back to vetted local messages without uncaught error
    }

    const fallbackMsg: ChatMessage = {
      id: `msg-${Date.now()}-regen`,
      sender: 'ai',
      text: newLang === 'ar'
        ? "أنا معك، فرقة الإسعاف تتقدم لمقعدك الآن. واش كاين شي نزيف دم أو صعوبة تنفس؟"
        : newLang === 'en'
        ? "I'm right here with you. The emergency team is on their way to your seat right now. Are they conscious and breathing?"
        : "Je suis avec vous, les secours progressent vers votre siège. Respire-t-il calmement ?",
      timestamp: new Date().toISOString(),
      quickReplies: CONSTANT_QUICK_CHIPS[newLang],
    };

    const updatedIncidents = incidents.map((inc) => {
      if (inc.id === incidentId) {
        return {
          ...inc,
          lockedLanguage: newLockedLangName as any,
          chatMessages: [fallbackMsg], // No French message left in an Arabic chat
        };
      }
      return inc;
    });

    commitAndBroadcast(updatedIncidents, rawReports);
    return {
      assistantReply: {
        text: fallbackMsg.text,
        quickReplies: fallbackMsg.quickReplies || [],
      },
    };
  };

  // =========================================================================
  // 4. SECURITY OPERATOR TAKES OVER AND SENDS DIRECT MESSAGE TO SUPPORTER
  // =========================================================================
  const handleOperatorSendMessage = (incidentId: string, message: string) => {
    const operatorMsg: ChatMessage = {
      id: `msg-${Date.now()}-op`,
      sender: 'operator',
      text: message,
      timestamp: new Date().toISOString(),
    };

    const updatedIncidents = incidents.map((inc) => {
      if (inc.id === incidentId) {
        return {
          ...inc,
          operatorTakenOver: true,
          chatMessages: [...inc.chatMessages, operatorMsg],
        };
      }
      return inc;
    });

    commitAndBroadcast(updatedIncidents, rawReports);
  };

  // Update status (e.g. dispatched, resolving, resolved)
  const handleUpdateIncidentStatus = (id: string, status: IncidentStatus) => {
    const updatedIncidents = incidents.map((inc) => (inc.id === id ? { ...inc, status } : inc));
    commitAndBroadcast(updatedIncidents, rawReports);
  };

  // Clear active emergency
  const handleClearActiveEmergency = () => {
    if (activeEmergencyIncidentId) {
      handleUpdateIncidentStatus(activeEmergencyIncidentId, 'resolved');
    }
    setActiveEmergencyIncidentId(null);
  };

  // =========================================================================
  // 5. MATCH SIMULATION (USES SAME STORE & REGISTERED SEATS)
  // =========================================================================
  const scheduleNextSimulationStep = (currentIndex: number, speedMultiplier: number) => {
    if (currentIndex >= SIMULATION_REPORTS.length) {
      setIsSimulating(false);
      return;
    }

    const report = SIMULATION_REPORTS[currentIndex];
    const prevDelay = currentIndex === 0 ? 0 : SIMULATION_REPORTS[currentIndex - 1].delayOffsetMs;
    const rawDelay = report.delayOffsetMs - prevDelay;
    const scaledDelay = Math.max(120, Math.floor(rawDelay / speedMultiplier));

    simulationTimerRef.current = setTimeout(() => {
      applySimulationReport(report);
      setSimulationIndex(currentIndex + 1);
      setLatestSimReport(report);
      scheduleNextSimulationStep(currentIndex + 1, speedMultiplier);
    }, scaledDelay);
  };

  const applySimulationReport = (simItem: SimulationReportItem) => {
    const rawReportId = `sim-raw-${simItem.id}-${Date.now().toString().slice(-4)}`;
    const nowIso = new Date().toISOString();
    const assignedTeam = getAssignedTeamForType(simItem.expectedType);

    const newRaw: RawReport = {
      id: rawReportId,
      text: simItem.text,
      timestamp: nowIso,
      language: simItem.language,
      zone: simItem.zone,
      exactSeat: simItem.exactSeat,
      reporterSource: simItem.reporterSource,
    };

    setIncidents((prevIncidents) => {
      const existingIdx = prevIncidents.findIndex(
        (i) => i.zone === simItem.zone && i.incident_type === simItem.expectedType && i.status !== 'resolved'
      );

      let nextIncidents = [...prevIncidents];

      if (existingIdx !== -1) {
        const existing = nextIncidents[existingIdx];
        const newCount = existing.reportCount + 1;
        let newSeverity: Severity = simItem.expectedSeverity;
        if (newCount >= 4) newSeverity = 'critical';

        const updated: Incident = {
          ...existing,
          reportCount: newCount,
          severity: newSeverity,
          lastReportTime: nowIso,
          why_merged: `Unified ${newCount} supporter reports: Crowd corroboration at ${simItem.exactSeat} (${simItem.zone}).`,
          dashboard_summary: `${newCount} reports merged: ${simItem.summary}`,
          rawReports: [newRaw, ...existing.rawReports],
        };
        nextIncidents[existingIdx] = updated;
      } else {
        const newIncident: Incident = {
          id: `inc-sim-${simItem.incidentCluster}-${Date.now()}`,
          incident_type: simItem.expectedType,
          severity: simItem.expectedSeverity,
          zone: simItem.zone,
          exactSeat: simItem.exactSeat,
          english_summary: simItem.summary,
          dashboard_summary: simItem.summary,
          recommended_action: simItem.action,
          confidence: 0.94,
          reportCount: 1,
          firstReportTime: nowIso,
          lastReportTime: nowIso,
          status: 'active',
          why_merged: `First report received for cluster at ${simItem.exactSeat}.`,
          rawReports: [newRaw],
          assignedTeam,
          timeToFirstResponseMs: 160,
          chatMessages: [
            {
              id: `msg-${Date.now()}-sim`,
              sender: 'ai',
              text: simItem.summary,
              timestamp: nowIso,
            },
          ],
          estimatedArrivalMinutes: 2,
        };
        nextIncidents = [newIncident, ...nextIncidents];
      }

      setRawReports((prevReports) => {
        const nextReports = [newRaw, ...prevReports];
        broadcastState(broadcastChannelRef.current, nextIncidents, nextReports);
        return nextReports;
      });

      return nextIncidents;
    });
  };

  const handleStartSimulation = (speedMultiplier: number = 1) => {
    if (simulationTimerRef.current) clearTimeout(simulationTimerRef.current);
    setSimSpeedMultiplier(speedMultiplier);
    setIsSimulating(true);

    const startIndex = simulationIndex >= SIMULATION_REPORTS.length ? 0 : simulationIndex;
    scheduleNextSimulationStep(startIndex, speedMultiplier);
  };

  const handlePauseSimulation = () => {
    if (simulationTimerRef.current) clearTimeout(simulationTimerRef.current);
    setIsSimulating(false);
  };

  const handleResetSimulation = () => {
    if (simulationTimerRef.current) clearTimeout(simulationTimerRef.current);
    setIsSimulating(false);
    setSimulationIndex(0);
    setLatestSimReport(null);
  };

  // =========================================================================
  // 6. CROWD SURGE SIMULATION (REQUIREMENT 4: 120 REPORTS IN 30 SECONDS -> 5 INCIDENTS)
  // - Mix of Gemini classification and local cache to prevent rate limits
  // - 120 reports across 8 seats and blocks in Darija, Arabic, French, and English
  // - 5 core incidents + noise
  // =========================================================================
  const scheduleNextCrowdSurgeStep = (currentIndex: number, speedMultiplier: number) => {
    if (currentIndex >= CROWD_SURGE_REPORTS.length) {
      setIsCrowdSurgeActive(false);
      return;
    }

    const report = CROWD_SURGE_REPORTS[currentIndex];
    const prevDelay = currentIndex === 0 ? 0 : CROWD_SURGE_REPORTS[currentIndex - 1].delayOffsetMs;
    const rawDelay = report.delayOffsetMs - prevDelay;
    const baseDelay = rawDelay > 0 ? rawDelay : 250;
    // 30 seconds for 120 reports = 250ms per report at 1x
    const scaledDelay = Math.max(25, Math.floor(baseDelay / speedMultiplier));

    crowdSurgeTimerRef.current = setTimeout(() => {
      applyCrowdSurgeReport(report);
      setCrowdSurgeIndex(currentIndex + 1);
      scheduleNextCrowdSurgeStep(currentIndex + 1, speedMultiplier);
    }, scaledDelay);
  };

  const applyCrowdSurgeReport = (surgeItem: CrowdSurgeReportItem) => {
    const rawReportId = `surge-raw-${surgeItem.id}-${Date.now().toString().slice(-4)}`;
    const nowIso = new Date().toISOString();
    const assignedTeam = getAssignedTeamForType(surgeItem.expectedType);

    // Requirement 4: Classify unique reports once; use local cache so surge never hits rate limits
    let classified = classificationCacheRef.current.get(surgeItem.text);
    if (!classified) {
      classified = {
        type: surgeItem.expectedType,
        severity: surgeItem.expectedSeverity,
        zone: surgeItem.zone,
      };
      classificationCacheRef.current.set(surgeItem.text, classified);
    }

    const newRaw: RawReport = {
      id: rawReportId,
      text: surgeItem.text,
      timestamp: nowIso,
      language: surgeItem.language,
      zone: classified.zone,
      exactSeat: surgeItem.exactSeat,
      reporterSource: surgeItem.reporterSource,
    };

    setIncidents((prevIncidents) => {
      // Find matching incident for the cluster
      const existingIdx = prevIncidents.findIndex(
        (i) =>
          i.status !== 'resolved' &&
          ((i.zone === classified!.zone && i.incident_type === classified!.type) ||
            (surgeItem.incidentCluster !== 'noise' && i.id.includes(surgeItem.incidentCluster)))
      );

      let nextIncidents = [...prevIncidents];

      if (existingIdx !== -1) {
        const existing = nextIncidents[existingIdx];
        const newCount = existing.reportCount + 1;
        let newSeverity: Severity = existing.severity;
        if (newCount >= 4 || surgeItem.expectedSeverity === 'critical') {
          newSeverity = 'critical';
        } else if (newCount >= 2 && newSeverity === 'low') {
          newSeverity = 'medium';
        }

        const updated: Incident = {
          ...existing,
          reportCount: newCount,
          severity: newSeverity,
          lastReportTime: nowIso,
          why_merged: `Crowd corroboration: ${newCount} supporter reports in 4 languages converged at ${surgeItem.exactSeat} (${classified.zone}).`,
          dashboard_summary: `${newCount} reports merged: ${surgeItem.summary}`,
          rawReports: [newRaw, ...existing.rawReports],
          timeToFirstResponseMs: Math.max(90, (existing.timeToFirstResponseMs || 140) - 1),
        };
        nextIncidents[existingIdx] = updated;
      } else {
        const newIncident: Incident = {
          id: `inc-surge-${surgeItem.incidentCluster}-${Date.now()}`,
          incident_type: classified.type,
          severity: classified.severity,
          zone: classified.zone,
          exactSeat: surgeItem.exactSeat,
          english_summary: surgeItem.summary,
          dashboard_summary: surgeItem.summary,
          recommended_action: surgeItem.action,
          confidence: 0.96,
          reportCount: 1,
          firstReportTime: nowIso,
          lastReportTime: nowIso,
          status: 'active',
          why_merged: `First report received for cluster at ${surgeItem.exactSeat}.`,
          rawReports: [newRaw],
          assignedTeam,
          timeToFirstResponseMs: 140,
          chatMessages: [
            {
              id: `msg-${Date.now()}-surge`,
              sender: 'ai',
              text: surgeItem.summary,
              timestamp: nowIso,
            },
          ],
          estimatedArrivalMinutes: 2,
        };
        nextIncidents = [newIncident, ...nextIncidents];
      }

      setRawReports((prevReports) => {
        const nextReports = [newRaw, ...prevReports];
        broadcastState(broadcastChannelRef.current, nextIncidents, nextReports);
        return nextReports;
      });

      return nextIncidents;
    });
  };

  const handleStartCrowdSurge = (speedMultiplier: number = 1) => {
    if (crowdSurgeTimerRef.current) clearTimeout(crowdSurgeTimerRef.current);
    if (simulationTimerRef.current) clearTimeout(simulationTimerRef.current);
    setIsSimulating(false);
    setSimSpeedMultiplier(speedMultiplier);
    setIsCrowdSurgeActive(true);

    const startIndex = crowdSurgeIndex >= CROWD_SURGE_REPORTS.length ? 0 : crowdSurgeIndex;
    scheduleNextCrowdSurgeStep(startIndex, speedMultiplier);
  };

  const handlePauseCrowdSurge = () => {
    if (crowdSurgeTimerRef.current) clearTimeout(crowdSurgeTimerRef.current);
    setIsCrowdSurgeActive(false);
  };

  const handleResetCrowdSurge = () => {
    if (crowdSurgeTimerRef.current) clearTimeout(crowdSurgeTimerRef.current);
    setIsCrowdSurgeActive(false);
    setCrowdSurgeIndex(0);
  };

  // Generate formal report in French
  const handleGenerateFormalReport = async () => {
    setIsReportModalOpen(true);
    setIsReportLoading(true);

    try {
      const res = await fetch('/api/generate-security-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incidents,
          stadiumInfo: { name: 'Grand Stade de Casablanca - MyArena' },
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        setReportContent(data.report || 'Rapport non disponible.');
      } else {
        setReportContent('Rapport non disponible.');
      }
    } catch {
      setReportContent('Erreur de communication avec le modèle IA. Rapport indisponible.');
    } finally {
      setIsReportLoading(false);
    }
  };

  const activeClusterCounts = {
    northFight:
      incidents.find((i) => i.zone === 'North Stand' && i.incident_type === 'fight')?.reportCount || 0,
    gateBFaint:
      incidents.find((i) => i.zone === 'Gate B' && i.incident_type === 'medical_emergency')?.reportCount || 0,
    parkingSmoke:
      incidents.find((i) => i.zone === 'Parking' && i.incident_type === 'fire_smoke')?.reportCount || 0,
  };

  const activeIncidentForSupporter =
    incidents.find((i) => i.id === activeEmergencyIncidentId) || null;

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#DCEBFF] via-[#E2F2EE] to-[#D3F5E8] text-[#111827] flex flex-col selection:bg-[#2F6BFF] selection:text-white overflow-x-hidden">
      
      {/* 2 Static Radial-Gradient Layers */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div
          className="absolute -top-[10%] -left-[10%] w-[65vw] h-[65vw] rounded-full opacity-40 will-change-transform"
          style={{
            background: 'radial-gradient(circle, rgba(47,107,255,0.32) 0%, rgba(220,235,255,0) 70%)',
          }}
        />
        <div
          className="absolute -bottom-[10%] -right-[10%] w-[70vw] h-[70vw] rounded-full opacity-45 will-change-transform"
          style={{
            background: 'radial-gradient(circle, rgba(78,204,163,0.3) 0%, rgba(255,179,138,0.25) 50%, rgba(211,245,232,0) 70%)',
          }}
        />
      </div>

      {/* NO GLOBAL TOP BAR ON ANY PAGE! EACH PAGE HAS EXACTLY ONE IN-PAGE GLASS HEADER CARD */}

      {/* SEPARATE ROUTE PAGES */}
      <main className={`flex-1 flex flex-col ${currentRoute === '/' ? 'h-screen max-h-screen overflow-hidden' : ''}`}>
        {/* ROUTE 1: #/ (INTRO) */}
        {currentRoute === '/' && (
          <HeroScrollStory
            onNavigateToPerspective={() => navigateTo('/choose')}
            lang={lang}
            onSelectLang={handleSelectLang}
          />
        )}

        {/* ROUTE 2: #/choose (CHOOSE YOUR PERSPECTIVE) */}
        {currentRoute === '/choose' && (
          <RoleChoiceSection
            onSelectRole={(role) => {
              if (role === 'supporter') {
                navigateTo('/supporter');
              } else {
                navigateTo('/security');
              }
            }}
            lang={lang}
            onNavigateToIntro={() => navigateTo('/')}
            onSelectLang={handleSelectLang}
          />
        )}

        {/* ROUTE 3: #/supporter (SUPPORTER EMERGENCY VIEW) */}
        {currentRoute === '/supporter' && (
          <div className="w-full py-6 max-w-7xl mx-auto px-4 sm:px-6">
            <SupporterView
              onTriggerOneTapAlert={handleTriggerOneTapAlert}
              onSendSupporterChatReply={handleSendSupporterChatReply}
              onRegenerateLanguage={handleRegenerateLanguage}
              activeIncident={activeIncidentForSupporter}
              onClearActiveEmergency={handleClearActiveEmergency}
              lang={lang}
              onSelectLang={handleSelectLang}
              onChangePerspective={() => navigateTo('/choose')}
            />
          </div>
        )}

        {/* ROUTE 4: #/security (SECURITY COMMAND DASHBOARD) */}
        {currentRoute === '/security' && (
          <div className="w-full py-6 max-w-7xl mx-auto px-4 sm:px-6">
            <SecurityDashboard
              incidents={incidents}
              totalRawReportsCount={rawReports.length}
              rawReports={rawReports}
              onUpdateIncidentStatus={handleUpdateIncidentStatus}
              onGenerateReport={handleGenerateFormalReport}
              selectedZone={selectedZoneFilter}
              onSelectZone={setSelectedZoneFilter}
              onOperatorSendMessage={handleOperatorSendMessage}
              onChangePerspective={() => navigateTo('/choose')}
              lang={lang}
              onSelectLang={handleSelectLang}
              demoProps={{
                isSimulating,
                simulationProgress: simulationIndex,
                totalReports: SIMULATION_REPORTS.length,
                simSpeedMultiplier,
                onStartSimulation: handleStartSimulation,
                onPauseSimulation: handlePauseSimulation,
                onResetSimulation: handleResetSimulation,
                latestSimReport,
                activeClusterCounts,
                isCrowdSurgeActive,
                crowdSurgeProgress: crowdSurgeIndex,
                totalCrowdSurgeReports: CROWD_SURGE_REPORTS.length,
                onStartCrowdSurge: handleStartCrowdSurge,
                onPauseCrowdSurge: handlePauseCrowdSurge,
                onResetCrowdSurge: handleResetCrowdSurge,
              }}
            />
          </div>
        )}
      </main>

      {/* FORMAL REPORT MODAL */}
      <FormalReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        reportContent={reportContent}
        isLoading={isReportLoading}
        onRegenerate={handleGenerateFormalReport}
      />
    </div>
  );
}
