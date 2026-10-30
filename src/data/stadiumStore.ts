import { 
  Incident, 
  IncidentStatus, 
  RawReport, 
  Severity, 
  StadiumZone, 
  IncidentType, 
  ChatMessage,
  REGISTERED_TICKET
} from '../types/stadium';
import { SupportedLang, getFullLanguageName, CONSTANT_QUICK_CHIPS } from './triageTree';

const STORAGE_KEY_INCIDENTS = 'myarena_global_incidents_v3';
const STORAGE_KEY_REPORTS = 'myarena_global_reports_v3';
const BROADCAST_CHANNEL_NAME = 'myarena_live_sync_v3';

export function getInitialStoredIncidents(): Incident[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_INCIDENTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (_) {}
  return [];
}

export function getInitialStoredReports(): RawReport[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REPORTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (_) {}
  return [];
}

export function saveIncidentsToStorage(incidents: Incident[]) {
  try {
    localStorage.setItem(STORAGE_KEY_INCIDENTS, JSON.stringify(incidents));
  } catch (_) {}
}

export function saveReportsToStorage(reports: RawReport[]) {
  try {
    localStorage.setItem(STORAGE_KEY_REPORTS, JSON.stringify(reports));
  } catch (_) {}
}

export function createBroadcastChannel(onSync: (incidents: Incident[], reports: RawReport[]) => void) {
  if (typeof window === 'undefined' || typeof window.BroadcastChannel === 'undefined') {
    return null;
  }
  const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
  channel.onmessage = (event) => {
    if (event.data?.type === 'SYNC_STATE') {
      const incs = event.data.incidents || [];
      const reps = event.data.reports || [];
      saveIncidentsToStorage(incs);
      saveReportsToStorage(reps);
      onSync(incs, reps);
    }
  };
  return channel;
}

export function broadcastState(channel: BroadcastChannel | null, incidents: Incident[], reports: RawReport[]) {
  saveIncidentsToStorage(incidents);
  saveReportsToStorage(reports);
  if (channel) {
    try {
      channel.postMessage({
        type: 'SYNC_STATE',
        incidents,
        reports,
      });
    } catch (_) {}
  }
}

export function getAssignedTeamForType(type: IncidentType): string {
  switch (type) {
    case 'medical_emergency':
      return 'Medical team';
    case 'fight':
      return 'Security team';
    case 'fire_smoke':
    case 'overcrowding':
      return 'Fire & Safety team';
    case 'theft':
      return 'Security team';
    default:
      return 'Stadium team';
  }
}
